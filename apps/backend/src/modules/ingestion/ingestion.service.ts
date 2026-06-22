import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { useDbAuthState } from './db-auth-state';
import {
  makeWASocket,
  DisconnectReason,
  WASocket,
  proto,
} from '@whiskeysockets/baileys';

import { Boom } from '@hapi/boom';
import * as crypto from 'crypto';
import { PrismaService } from '../../core/prisma/prisma.service';
import { AiParserService } from '../../ai/property-parser/ai-parser/ai-parser.service';
import { PropertiesService } from '../properties/properties.service';
import { PreClassifierService } from '../messages/pre-classifier.service';
import { IngestionPhone } from '@prisma/client';
import { fetchLatestBaileysVersion } from '@whiskeysockets/baileys';
import P from 'pino';


type SessionStatus = 'CONNECTED' | 'DISCONNECTED' | 'QR_PENDING' | 'CONNECTING';

interface SessionMeta {
  socket: WASocket;
  status: SessionStatus;
  syncDone: boolean;  
}

@Injectable()
export class IngestionService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(IngestionService.name);
  private sessions = new Map<string, SessionMeta>();

  constructor(
    private prisma: PrismaService,
    private aiParser: AiParserService,
    private properties: PropertiesService,
    private preClassifier: PreClassifierService,
  ) {}






  async onModuleInit() {
    const phones = await this.prisma.ingestionPhone.findMany({
      where: { active: true },
    });
    for (const phone of phones) {
      await this.startSession(phone).catch((err) =>
        this.logger.error(`Failed to start session for ${phone.phone}: ${err.message}`),
      );
    }
  }

  async onModuleDestroy() {
    for (const [phoneId, meta] of this.sessions.entries()) {
      await meta.socket.end(undefined);
      this.sessions.delete(phoneId);
    }
  }

  // ─── Session Management ────────────────────────────────────────────────────

  async startSession(phone: IngestionPhone) {
    if (this.sessions.has(phone.id)) {
      this.logger.warn(`Session for ${phone.phone} already running`);
      
      return;
    }

    const { state, saveCreds } = await useDbAuthState(this.prisma, phone.id);

    const { version } = await fetchLatestBaileysVersion();
    const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false,
    logger: P({ level: 'silent' }),
    browser: ['GrowCliento', 'Chrome', '120.0.0'],
    });

    // In startSession(), where session is set:
    this.sessions.set(phone.id, { socket: sock, status: 'CONNECTING', syncDone: false });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        this.sessions.get(phone.id)!.status = 'QR_PENDING';
        await this.prisma.ingestionPhone.update({
          where: { id: phone.id },
          data: { qrCode: qr },
        });
        this.logger.log(`QR ready for ${phone.phone}`);
        this.logger.log(`QR saved to DB for ${phone.phone}`);
      }

      if (connection === 'open') {
        const meta = this.sessions.get(phone.id);
        if (meta) meta.status = 'CONNECTED';
        await this.prisma.ingestionPhone.update({
          where: { id: phone.id },
          data: { qrCode: null },
        });
        this.logger.log(`Connected: ${phone.phone}`);
        // Delay sync — WA rate-limits groupFetchAllParticipating if called immediately
        setTimeout(() => this.syncGroups(phone.id, sock), 30000);
      }

      if (connection === 'close') {
        const reason = (lastDisconnect?.error as Boom)?.output?.statusCode;
        this.logger.warn(`Disconnected: ${phone.phone}, reason=${reason}`);

        const meta = this.sessions.get(phone.id);
        if (meta) meta.status = 'DISCONNECTED';

        // 405 on a fresh (unauthenticated) session = WA rejected empty creds.
        // Restart so Baileys can generate a fresh QR.
        // 401 = truly logged out after prior auth — also restart for re-scan.
        // Any other reason = transient, reconnect.
        const isLoggedOut = reason === DisconnectReason.loggedOut; // 401
        const isRejected  = reason === 405;

        const fresh = await this.prisma.ingestionPhone.findUnique({
          where: { id: phone.id },
        });

        if (fresh?.active) {
          this.sessions.delete(phone.id);
          if (isLoggedOut || isRejected) {
            // Clear DB auth state so fresh QR is generated
            await this.prisma.waAuthState.deleteMany({
              where: { id: { startsWith: `${phone.id}:` } },
            });
          }
          setTimeout(() => this.startSession(fresh), 3000);
        } else {
          this.sessions.delete(phone.id);
        }
      }
    });

    sock.ev.on('messages.upsert', async ({ messages, type }) => {
      if (type !== 'notify') return;
      for (const msg of messages) {
        await this.handleMessage(msg, phone.id).catch((err) =>
          this.logger.error(`handleMessage error: ${err.message}`),
        );
      }
    });

    // Keep groups table in sync when group metadata changes
    // sock.ev.on('groups.update', async () => {
    //   await this.syncGroups(phone.id, sock);
    // });
  }

  async stopSession(phoneId: string) {
    const meta = this.sessions.get(phoneId);
    if (!meta) return;
    await meta.socket.end(undefined);
    this.sessions.delete(phoneId);
  }


  async ingestManual(input: { workspaceId: string; text: string; sender?: string }) {
    const { workspaceId, text, sender } = input;
    const hash = crypto.createHash('sha256').update(text).digest('hex');
    const messageKey = `manual-${workspaceId}-${hash}`;

    const cached = await this.prisma.globalMessageCache.findUnique({ where: { hash } });

    const savedMessage = await this.prisma.message.upsert({
        where: { messageKey },
        create: { messageKey, rawText: text, groupName: 'MANUAL', sender, receivedAt: new Date(), workspaceId },
        update: {},
    }).catch(() => null);

    const messageId = savedMessage?.id ?? '';

    if (cached) {
        await this.prisma.globalMessageCache.update({ where: { hash }, data: { hitCount: { increment: 1 } } });
        await this.properties.createFromAi(workspaceId, messageId, cached.aiResult as any, sender ?? null);
        return;
    }

    const classified = this.preClassifier.classify(text);
    if (classified.skip) return;

    const outcome = await this.aiParser.parseMessage(text);
    if (!outcome.success) return;

    await this.prisma.globalMessageCache.upsert({
      where:  { hash },
      create: { hash, aiResult: outcome.data as any },
      update: { hitCount: { increment: 1 } },
    });
    await this.properties.createFromAi(workspaceId, messageId, outcome.data, sender ?? null);
    }


    // Add after ingestManual() and before handleMessage()

    async backfillWorkspace(workspaceId: string) {
      const subscriptions = await this.prisma.groupSubscription.findMany({
        where: { workspaceId, active: true },
        include: { group: true },
      });

      let created = 0;
      let skipped = 0;

      for (const sub of subscriptions) {
        const messages = await this.prisma.message.findMany({
          where: { groupName: sub.group.groupName },
          orderBy: { receivedAt: 'asc' },
        });

        for (const msg of messages) {
          const existing = await this.prisma.workspaceListing.findFirst({
            where: { workspaceId, messageId: msg.id },
          });
          if (existing) { skipped++; continue; }

          const hash = crypto.createHash('sha256').update(msg.rawText).digest('hex');
          const cached = await this.prisma.globalMessageCache.findUnique({ where: { hash } });
          if (!cached) { skipped++; continue; }

          // Create ws-scoped message copy so createFromAi guard passes
          const wsMessageKey = `${msg.messageKey}:backfill:${workspaceId}`;
          const wsCopy = await this.prisma.message.upsert({
            where: { messageKey: wsMessageKey },
            create: {
              messageKey: wsMessageKey,
              rawText: msg.rawText,
              groupName: msg.groupName,
              sender: msg.sender,
              receivedAt: msg.receivedAt,
              workspaceId,
            },
            update: {},
          }).catch(() => null);

          await this.properties
            .createFromAi(workspaceId, wsCopy?.id ?? msg.id, cached.aiResult as any, msg.sender ?? null)
            .catch(() => {});
          created++;
        }
      }

      this.logger.log(`Backfill ws=${workspaceId}: created=${created} skipped=${skipped}`);
      return { created, skipped };
    }
  // ─── Message Handling ──────────────────────────────────────────────────────

  private async handleMessage(msg: proto.IWebMessageInfo, phoneId: string) {
    const groupJid = msg.key?.remoteJid;
    if (!groupJid?.endsWith('@g.us')) return;
    

    const text =
      msg.message?.conversation ||
      msg.message?.extendedTextMessage?.text ||
      '';
    if (!text.trim()) return;

    const sender = msg.key?.participant || groupJid || '';

    // 0. Check for private group linking code PAI-XXXX
    const paiMatch = text.trim().match(/^PAI-[A-Z0-9]{4}$/);
    if (paiMatch) {
      const code = paiMatch[0];
      const request = await this.prisma.privateGroupRequest.findUnique({
        where: { code },
      });
      if (request && request.status === 'PENDING' && request.expiresAt > new Date()) {
        // Try to get group name from socket directly
        const meta = this.sessions.get(phoneId);
        let groupName = groupJid;
        if (meta?.socket) {
          try {
            const groupMeta = await meta.socket.groupMetadata(groupJid);
            groupName = groupMeta.subject ?? groupJid;
          } catch {}
        }

        // Also upsert the group into DB with correct name
        const group = await this.prisma.ingestionGroup.upsert({
          where: { groupJid_ingestionPhoneId: { groupJid, ingestionPhoneId: phoneId } },
          create: { 
            groupJid, 
            groupName, 
            ingestionPhoneId: phoneId,
            isPrivate: true,
            workspaceId: request.workspaceId,
            claimExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
          },
          update: { groupName, isPrivate: true, workspaceId: request.workspaceId },
        });

        await this.prisma.$transaction(async (tx) => {
          await tx.privateGroupRequest.update({
            where: { id: request.id },
            data:  { status: 'LINKED', groupJid, groupName },
          });
          await tx.groupSubscription.upsert({
            where: { groupId_workspaceId: { groupId: group.id, workspaceId: request.workspaceId } },
            create: { groupId: group.id, workspaceId: request.workspaceId, active: true },
            update: { active: true },
          });
        });

        this.logger.log(`Private group linked: ${groupJid} (${groupName}) → workspace ${request.workspaceId}`);
      }
      return;
    }

    // 1. Find active subscriptions for this group
    const subscriptions = await this.prisma.groupSubscription.findMany({
      where: {
        group: { groupJid, ingestionPhoneId: phoneId },
        active: true,
      },
      include: { group: true },
    });

    if (!subscriptions.length) return;

    const groupName = subscriptions[0].group.groupName;
    const workspaceIds = subscriptions.map((s) => s.workspaceId);

    // 2. L0 — SHA-256 dedup via GlobalMessageCache
    const hash = crypto.createHash('sha256').update(text).digest('hex');
    const cached = await this.prisma.globalMessageCache.findUnique({
      where: { hash },
    });

    // 3. Store raw message per workspace so createFromAi's guard passes for each
    const messageKey = `${groupJid}:${hash}`;
    const messageIds: Record<string, string> = {};

    for (const wsId of workspaceIds) {
      const wsMessageKey = `${messageKey}:${wsId}`;
      const saved = await this.prisma.message.upsert({
        where: { messageKey: wsMessageKey },
        create: {
          messageKey: wsMessageKey,
          rawText: text,
          groupName,
          sender,
          receivedAt: new Date(),
          workspaceId: wsId,
        },
        update: {},
      }).catch(() => null);
      if (saved) messageIds[wsId] = saved.id;
    }

    if (cached) {
      await this.prisma.globalMessageCache.update({
        where: { hash },
        data: { hitCount: { increment: 1 } },
      });
      for (const wsId of workspaceIds) {
        await this.properties
          .createFromAi(wsId, messageIds[wsId] ?? '', cached.aiResult as any, sender)
          .catch((err) =>
            this.logger.error(`createFromAi(cached) ws=${wsId}: ${err.message}`),
          );
      }
        await this.updateLastSeenAtByHash(hash, workspaceIds);
        await this.updateLastSeenForWorkspaces(workspaceIds, messageIds);

      return;
    }

    // 4. L1 — noise filter via PreClassifier
    const classified = this.preClassifier.classify(text);
    if (classified.skip) return;

    // 5. L4 — Gemini full parse (L3 HIGH disabled per existing design)
    const outcome = await this.aiParser.parseMessage(text);
    if (!outcome.success) return;

    // 6. Cache globally
    await this.prisma.globalMessageCache.upsert({
      where:  { hash },
      create: { hash, aiResult: outcome.data as any },
      update: { hitCount: { increment: 1 } },
    });

     // 7. Fan-out to all subscribed workspaces
    for (const wsId of workspaceIds) {
      await this.properties
        .createFromAi(wsId, messageIds[wsId] ?? '', outcome.data, sender)
        .catch((err) =>
          this.logger.error(`createFromAi ws=${wsId}: ${err.message}`),
        );
    }

    // 8. Update lastSeenAt for all workspace listings that match this message
    await this.updateLastSeenAtByHash(hash, workspaceIds);
    await this.updateLastSeenForWorkspaces(workspaceIds, messageIds);

  }

  private async updateLastSeenAt(canonicalPropertyId: string, workspaceIds: string[]) {
    await this.prisma.workspaceListing.updateMany({
      where: {
        canonicalPropertyId,
        workspaceId: { in: workspaceIds },
      },
      data: { lastSeenAt: new Date() },
    });
  }

  private async updateLastSeenAtByHash(hash: string, workspaceIds: string[]) {
    try {
      // Find canonical via any workspace listing that has a message with this hash
      const cached = await this.prisma.globalMessageCache.findUnique({ where: { hash } });
      if (!cached) return;

      // Find listings via messages that contain this text (matched by hash in cache)
      // Simpler: find WorkspaceListings for these workspaces and update lastSeenAt
      // We find them by looking at recently created messages with this hash
      const messages = await this.prisma.message.findMany({
        where: {
          workspaceId: { in: workspaceIds },
          rawText: { not: '' },
        },
        select: { id: true, workspaceId: true },
        orderBy: { receivedAt: 'desc' },
        take: workspaceIds.length * 2,
      });

      // Find all listings linked to these messages
      for (const wsId of workspaceIds) {
        const wsMessages = messages.filter(m => m.workspaceId === wsId);
        for (const msg of wsMessages) {
          await this.prisma.workspaceListing.updateMany({
            where: { messageId: msg.id, workspaceId: wsId },
            data: { lastSeenAt: new Date() },
          });
        }
      }
    } catch (err: any) {
      this.logger.error(`updateLastSeenAt failed: ${err.message}`);
    }
  }

  private async updateLastSeenForWorkspaces(workspaceIds: string[], messageIds: Record<string, string>) {
  for (const wsId of workspaceIds) {
    const msgId = messageIds[wsId];
    if (!msgId) continue;
    await this.prisma.workspaceListing.updateMany({
      where: { messageId: msgId, workspaceId: wsId },
      data:  { lastSeenAt: new Date() },
    });
  }
}
  

  // ─── Group Sync ────────────────────────────────────────────────────────────

  private async syncGroups(phoneId: string, sock: WASocket, attempt = 1) {
    const meta = this.sessions.get(phoneId);
    if (!meta) return;
    if (meta.syncDone) return; // already synced this session
    meta.syncDone = true;      // mark before await to prevent concurrent calls
    try {

      const groups = await sock.groupFetchAllParticipating();
      for (const [jid, meta] of Object.entries(groups)) {
        await this.prisma.ingestionGroup.upsert({
          where: { groupJid_ingestionPhoneId: { groupJid: jid, ingestionPhoneId: phoneId } },
          create: { 
            groupJid: jid, 
            groupName: meta.subject, 
            ingestionPhoneId: phoneId,
            claimExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h grace
          },
          update: { groupName: meta.subject }, // don't reset claimExpiresAt on update
        });
      }
      this.logger.log(`syncGroups: synced ${Object.keys(groups).length} groups for ${phoneId}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`syncGroups failed (attempt ${attempt}): ${message}`);
      if (attempt < 3) {
        setTimeout(() => this.syncGroups(phoneId, sock, attempt + 1), 60000 * attempt);
      }
    }
  }


  async syncGroupsForPhone(phoneId: string) {
    const meta = this.sessions.get(phoneId);
    if (!meta || meta.status !== 'CONNECTED') {
      throw new Error('Phone not connected');
    }
    meta.syncDone = false; // reset guard so syncGroups runs again
    await this.syncGroups(phoneId, meta.socket);
  }

  // ─── Admin API Methods ─────────────────────────────────────────────────────

  async addPhone(phone: string, displayName: string, sessionPath: string) {
    const record = await this.prisma.ingestionPhone.upsert({
      where: { phone },
      create: { phone, displayName, sessionPath, active: true },
      update: { displayName, sessionPath, active: true },
    });
    await this.startSession(record);
    return record;
  }

  async removePhone(phoneId: string) {
    await this.stopSession(phoneId);
    await this.prisma.ingestionPhone.update({
      where: { id: phoneId },
      data: { active: false },
    });
  }

  getPhoneStatus(phoneId: string): SessionStatus {
    return this.sessions.get(phoneId)?.status ?? 'DISCONNECTED';
  }

  async listPhones() {
    const phones = await this.prisma.ingestionPhone.findMany({
      where: { active: true },
      orderBy: { createdAt: 'asc' },
    });
    return phones.map((p) => ({
      ...p,
      status: this.getPhoneStatus(p.id),
    }));
  }

  async getQr(phoneId: string) {
    const phone = await this.prisma.ingestionPhone.findUniqueOrThrow({
      where: { id: phoneId },
      select: { qrCode: true },
    });
    return phone.qrCode;
  }

  async listPhoneGroups(phoneId: string) {
    // Returns live groups from Baileys (what WA number is actually in)
    const meta = this.sessions.get(phoneId);
    if (!meta || meta.status !== 'CONNECTED') return [];
    const groups = await meta.socket.groupFetchAllParticipating();
    return Object.entries(groups).map(([jid, g]) => ({
      jid,
      name: g.subject,
      participantCount: g.participants.length,
    }));
  }

  async listAllGroups() {
    return this.prisma.ingestionGroup.findMany({
      include: {
        phone: { select: { phone: true, displayName: true } },
        _count: { select: { subscriptions: { where: { active: true } } } },
      },
      orderBy: { groupName: 'asc' },
    });
  }

  async addGroup(groupJid: string, groupName: string, ingestionPhoneId: string) {
    return this.prisma.ingestionGroup.upsert({
      where: { groupJid_ingestionPhoneId: { groupJid, ingestionPhoneId } },
      create: { groupJid, groupName, ingestionPhoneId },
      update: { groupName },
    });
  }

  async removeGroup(groupId: string) {
    await this.prisma.groupSubscription.deleteMany({ where: { groupId } });
    return this.prisma.ingestionGroup.delete({ where: { id: groupId } });
  }


  // ─── Workspace API Methods ─────────────────────────────────────────────────

  async getAvailableGroups(workspaceId: string) {
    const subscribed = await this.prisma.groupSubscription.findMany({
      where: { workspaceId, active: true },
      select: { groupId: true },
    });
    const subscribedIds = subscribed.map((s) => s.groupId);
    const now = new Date();

    return this.prisma.ingestionGroup.findMany({
      where: {
        id: { notIn: subscribedIds },
        OR: [
          // Public groups — grace period expired or never set
          { 
            isPrivate: false,
            OR: [
              { claimExpiresAt: null },
              { claimExpiresAt: { lt: now } }, // grace period over
            ]
          },
          // Own private groups
          { isPrivate: true, workspaceId },
        ],
      },
      include: {
        phone: { select: { phone: true, displayName: true } },
        _count: { select: { subscriptions: { where: { active: true } } } },
      },
      orderBy: { groupName: 'asc' },
    });
  }

  async getSubscriptions(workspaceId: string) {
    const subs = await this.prisma.groupSubscription.findMany({
      where: { workspaceId },
      include: { group: { include: { phone: { select: { phone: true, displayName: true } } } } },
      orderBy: { createdAt: 'desc' },
    });

    // Enrich with property count and last listing time per group
    const enriched = await Promise.all(subs.map(async (sub) => {
      const listings = await this.prisma.workspaceListing.aggregate({
        where: {
          workspaceId,
          message: { groupName: sub.group.groupName },
        },
        _count: { id: true },
        _max:   { lastSeenAt: true },
      });

      return {
        ...sub,
        propertyCount:   listings._count.id,
        lastListingAt:   listings._max.lastSeenAt ?? null,
      };
    }));

    return enriched;
  }

  async subscribe(workspaceId: string, groupId: string) {
      const sub = await this.prisma.groupSubscription.upsert({
        where: { groupId_workspaceId: { groupId, workspaceId } },
        create: { groupId, workspaceId, active: true },
        update: { active: true },
      });
      // Fire backfill in background — don't block the response
      this.backfillWorkspace(workspaceId).catch(err =>
        this.logger.error(`Backfill failed for ${workspaceId}: ${err.message}`)
      );
      return sub;
    }

  async unsubscribe(subscriptionId: string, workspaceId: string) {
    // Guard: ensure it belongs to this workspace
    return this.prisma.groupSubscription.updateMany({
      where: { id: subscriptionId, workspaceId },
      data: { active: false },
    });
  }
}