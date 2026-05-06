// apps/backend/src/modules/clients/clients.service.ts

import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../core/prisma/prisma.service';
import { ClientPropertyStatus, LeadStage, MemberRole } from '@prisma/client';

// ── Caller context — passed from every controller method ─────────────────────
// This replaces bare workspaceId params with full context so the service
// can enforce role-based scoping without each method needing to know role logic.

export interface CallerContext {
  workspaceId: string;
  userId:      string;      // User.id of the requesting broker/owner
  role:        MemberRole;  // OWNER | BROKER | VIEWER
}

@Injectable()
export class ClientsService {
  constructor(
    private prisma:  PrismaService,
    private config:  ConfigService,
  ) {}

  // ── Role helpers ────────────────────────────────────────────────────────────

  /** OWNER sees all clients. BROKER sees only their own + unassigned pool. */
  private clientScopeWhere(ctx: CallerContext) {
    if (ctx.role === MemberRole.OWNER) {
      return { workspaceId: ctx.workspaceId };
    }

    
    // BROKER and VIEWER: own clients + unassigned pool

    // V1: Pool hidden — brokers see all clients in workspace
    // Restore OR clause with { ownerId: null } when Pool UI is enabled
    return {
      workspaceId: ctx.workspaceId,
    };
  }

  /** Verify caller can access a specific client. Throws if not allowed. */
  private async assertClientAccess(ctx: CallerContext, clientId: string) {
    const client = await this.prisma.client.findFirst({
      where: { id: clientId, workspaceId: ctx.workspaceId },
      select: { id: true, ownerId: true },
    });

    if (!client) throw new NotFoundException('Client not found');

    if (ctx.role !== MemberRole.OWNER) {
      // BROKER can only access their own clients or unassigned ones
      if (client.ownerId !== null && client.ownerId !== ctx.userId) {
        throw new ForbiddenException('This client belongs to another broker');
      }
    }

    return client;
  }

  // ── HELPERS ─────────────────────────────────────────────────────────────────

  private followUpRank(date: Date | null): number {
    if (!date) return 4;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const d     = new Date(date); d.setHours(0, 0, 0, 0);
    if (d < today)                       return 1; // overdue
    if (d.getTime() === today.getTime()) return 2; // today
    return 3;                                       // upcoming
  }

  private buildRequirementLabel(properties: any[]): string {
    if (properties.length === 0) return '—';
    const latest = properties[0]?.listing;
    if (!latest) return '—';
    const base = [latest.bhk, latest.propertySubType, latest.city]
      .filter(Boolean).join(' ');
    return properties.length === 1 ? base : `${base} +${properties.length - 1} more`;
  }

  // ── CLIENT CORE ─────────────────────────────────────────────────────────────

  /**
   * Find or create a client scoped to workspace.
   * When a broker creates a client, they become the owner automatically.
   */
  async getOrCreateClient(
    ctx:    CallerContext,
    phone:  string,
    name?:  string,
  ) {
    const existing = await this.prisma.client.findFirst({
      where: { workspaceId: ctx.workspaceId, phones: { some: { phone } } },
    });

    if (existing) return existing;

    return this.prisma.client.create({
      data: {
        workspaceId: ctx.workspaceId,
        name,
        ownerId: ctx.userId,    // ← assigned to the creating broker
        phones:  { create: { phone, primary: true } },
      },
    });
  }

  async getClient(ctx: CallerContext, clientId: string) {
    await this.assertClientAccess(ctx, clientId);

    return this.prisma.client.findFirst({
      where: { id: clientId, workspaceId: ctx.workspaceId },
      include: {
        phones: true,
        owner:  { select: { id: true, name: true, email: true } },
        properties: {
          include: { listing: true },
          orderBy: { sharedAt: 'desc' },
        },
        events: { orderBy: { createdAt: 'desc' } },
      },
    });
  }

  // ── LEADS INBOX ─────────────────────────────────────────────────────────────
  // OWNER: all clients in workspace
  // BROKER: own clients + unassigned pool (ownerId = null)

  async getLeadsInbox(ctx: CallerContext) {
    const where = this.clientScopeWhere(ctx);

    const clients = await this.prisma.client.findMany({
      where,
      include: {
        phones: true,
        owner:  { select: { id: true, name: true } },
        properties: {
          orderBy: { sharedAt: 'desc' },
          include: { listing: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const rows = clients.map((client) => {
      const followUps = client.properties
        .map((cp) => cp.followUpAt)
        .filter(Boolean) as Date[];

      const nearestFollowUpAt =
        followUps.length > 0
          ? new Date(Math.min(...followUps.map((d) => d.getTime())))
          : null;

      const primaryPhone =
        client.phones.find((p) => p.primary)?.phone ??
        client.phones[0]?.phone ?? '';

      return {
        clientId:         client.id,
        name:             client.name,
        phone:            primaryPhone,
        propertiesCount:  client.properties.length,
        requirementLabel: this.buildRequirementLabel(client.properties),
        nearestFollowUpAt,
        // Show who owns this client — useful for owner's view
        owner:     client.owner,
        // V1: isPool hidden — uncomment when Lead Pool UI is restored
        // isPool: client.ownerId === null,
      };
    });

    rows.sort(
      (a, b) =>
        this.followUpRank(a.nearestFollowUpAt) -
        this.followUpRank(b.nearestFollowUpAt),
    );

    return rows;
  }

  async setClientFollowUp(
  ctx: CallerContext,
  clientId: string,
  followUpAt: string | null,
) {
  await this.assertClientAccess(ctx, clientId);
  // Sets followUpAt on the most recently active ClientProperty
  const cp = await this.prisma.clientProperty.findFirst({
    where: { client: { id: clientId, workspaceId: ctx.workspaceId } },
    orderBy: { lastActionAt: 'desc' },
    select: { id: true },
  });
  if (!cp) throw new NotFoundException('No properties linked to this client');

  const updated = await this.prisma.clientProperty.update({
  where: { id: cp.id },
  data:  { followUpAt: followUpAt ? new Date(followUpAt) : null },
  select: { id: true, followUpAt: true, clientId: true },
});

await this.createEvent(updated.clientId, 'FOLLOW_UP_SET', {
  followUpAt,
  clearedAt: followUpAt ? null : new Date().toISOString(),
});

return updated;
}

  // ── LEAD POOL ───────────────────────────────────────────────────────────────
  // Unassigned clients — any broker can claim them.

  async getLeadPool(ctx: CallerContext) {
    return this.prisma.client.findMany({
      where: { workspaceId: ctx.workspaceId, ownerId: null },
      include: {
        phones: true,
        properties: {
          include: { listing: true },
          orderBy: { sharedAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ── CLAIM LEAD ──────────────────────────────────────────────────────────────
  // Broker claims an unassigned lead from the pool.

  async claimLead(ctx: CallerContext, clientId: string) {
    const client = await this.prisma.client.findFirst({
      where: { id: clientId, workspaceId: ctx.workspaceId },
      select: { id: true, ownerId: true },
    });

    if (!client) throw new NotFoundException('Client not found');

    if (client.ownerId !== null && client.ownerId !== ctx.userId) {
      throw new ForbiddenException('This lead is already claimed by another broker');
    }

    return this.prisma.client.update({
      where: { id: clientId },
      data:  { ownerId: ctx.userId },
      select: { id: true, ownerId: true },
    });
  }

  // ── REASSIGN CLIENT ─────────────────────────────────────────────────────────
  // Owner can reassign any client to any broker.

  async reassignClient(
    ctx:       CallerContext,
    clientId:  string,
    toUserId:  string | null,  // null = return to pool
  ) {
    if (ctx.role !== MemberRole.OWNER) {
      throw new ForbiddenException('Only workspace owners can reassign clients');
    }

    const client = await this.prisma.client.findFirst({
      where:  { id: clientId, workspaceId: ctx.workspaceId },
      select: { id: true },
    });
    if (!client) throw new NotFoundException('Client not found');

    // Verify target broker is in the workspace (if not returning to pool)
    if (toUserId !== null) {
      const member = await this.prisma.workspaceMember.findFirst({
        where: { workspaceId: ctx.workspaceId, userId: toUserId },
      });
      if (!member) throw new NotFoundException('Broker not found in workspace');
    }

    const updated = await this.prisma.client.update({
      where: { id: clientId },
      data:  { ownerId: toUserId },
      select: { id: true, ownerId: true, name: true },
    });

    await this.createEvent(clientId, 'CLIENT_REASSIGNED', {
      fromUserId: null,
      toUserId,
      byUserId:   ctx.userId,
    });

    return updated;
  }

  // ── CLIENT ↔ LISTING ────────────────────────────────────────────────────────

  async shareProperty(ctx: CallerContext, clientId: string, listingId: string) {
    await this.assertClientAccess(ctx, clientId);

    const cp = await this.prisma.clientProperty.upsert({
      where:  { clientId_listingId: { clientId, listingId } },
      update: { lastActionAt: new Date() },
      create: {
        clientId,
        listingId,
        assignedTo: ctx.userId,   // ← broker who shared it owns this lead
      },
    });

    await this.createEvent(clientId, 'PROPERTY_SHARED', { listingId });
    return cp;
  }

  async updateClientPropertyStatus(
    ctx:               CallerContext,
    clientPropertyId:  string,
    status:            LeadStage,
  ) {
    const cp = await this.prisma.clientProperty.findFirst({
      where: {
        id:     clientPropertyId,
        client: { workspaceId: ctx.workspaceId },
      },
      select: { id: true, clientId: true, listingId: true, assignedTo: true },
    });
    if (!cp) throw new NotFoundException('ClientProperty not found');

    // BROKER can only update their own assigned leads
    if (ctx.role !== MemberRole.OWNER && cp.assignedTo !== ctx.userId) {
      throw new ForbiddenException('This lead is assigned to another broker');
    }

    const updated = await this.prisma.clientProperty.update({
      where: { id: clientPropertyId },
      data:  { status, lastActionAt: new Date() },
    });

    await this.createEvent(updated.clientId, 'STATUS_CHANGED', {
      listingId: updated.listingId, status,
    });

    return updated;
  }

  async updateClientPropertyClientStatus(
    ctx:              CallerContext,
    clientPropertyId: string,
    clientStatus:     ClientPropertyStatus,
  ) {
    const cp = await this.prisma.clientProperty.findFirst({
      where: { id: clientPropertyId, listing: { workspaceId: ctx.workspaceId } },
    });
    if (!cp) throw new NotFoundException('ClientProperty not found');

    return this.prisma.clientProperty.update({
      where: { id: clientPropertyId },
      data:  { clientStatus },
    });
  }

  async updateClientPropertyFollowUp(
    ctx:              CallerContext,
    clientPropertyId: string,
    followUpAt:       string,
  ) {
    const cp = await this.prisma.clientProperty.findFirst({
      where: { id: clientPropertyId, client: { workspaceId: ctx.workspaceId } },
    });
    if (!cp) throw new NotFoundException('ClientProperty not found');

    const date = followUpAt ? new Date(followUpAt) : null;
    const updated = await this.prisma.clientProperty.update({
      where: { id: clientPropertyId },
      data:  { followUpAt: date, lastActionAt: new Date() },

    });

    await this.createEvent(updated.clientId, 'FOLLOW_UP_SET', {
      listingId: updated.listingId, followUpAt: date,
    });

    return updated;
  }

  // ── FOLLOW-UPS ──────────────────────────────────────────────────────────────

  async getFollowUpsToday(ctx: CallerContext) {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const clientWhere = this.clientScopeWhere(ctx);

    const rows = await this.prisma.clientProperty.findMany({
      where: {
        followUpAt: { lte: today },
        client:     clientWhere,     // ← scoped to caller's visible clients
      },
      include: { client: true, listing: true },
      orderBy: { followUpAt: 'asc' },
    });

    return this.mapFollowUps(rows);
  }

  async getUpcomingFollowUps(ctx: CallerContext) {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const end   = new Date(today); end.setDate(end.getDate() + 7);
    const clientWhere = this.clientScopeWhere(ctx);

    const rows = await this.prisma.clientProperty.findMany({
      where: {
        followUpAt: { gt: today, lte: end },
        client:     clientWhere,
      },
      include: { client: true, listing: true },
      orderBy: { followUpAt: 'asc' },
    });

    return this.mapFollowUps(rows);
  }

  private mapFollowUps(rows: any[]) {
    return rows.map((r) => ({
      clientId:   r.clientId,
      clientName: r.client.name,
      followUpAt: r.followUpAt,
      property:   r.listing,
    }));
  }

  // ── NOTES ───────────────────────────────────────────────────────────────────

  async addNote(ctx: CallerContext, clientId: string, note: string) {
    await this.assertClientAccess(ctx, clientId);
    return this.createEvent(clientId, 'NOTE_ADDED', { note });
  }

  // ── WHATSAPP ────────────────────────────────────────────────────────────────

  async getWhatsappOptions(ctx: CallerContext, clientId: string) {
    await this.assertClientAccess(ctx, clientId);

    const cps = await this.prisma.clientProperty.findMany({
      where: {
        clientId,
        status: { notIn: [LeadStage.CLOSED, LeadStage.LOST] },
      },
      include: { listing: true },
      orderBy: { sharedAt: 'desc' },
    });

    return cps.map((cp) => ({
      clientPropertyId: cp.id,
      label: [cp.listing.bhk, cp.listing.propertySubType, cp.listing.area, cp.listing.city]
        .filter(Boolean).join(' '),
      price:      cp.listing.price,
      followUpAt: cp.followUpAt,
      status:     cp.status,
    }));
  }

  async getWhatsappDraft(ctx: CallerContext, clientPropertyId: string) {
    const cp = await this.prisma.clientProperty.findFirst({
      where: { id: clientPropertyId, client: { workspaceId: ctx.workspaceId } },
      include: { client: true, listing: true },
    });
    if (!cp) throw new NotFoundException('ClientProperty not found');

    return { message: this.generateWhatsappDraft(cp.client, cp) };
  }

  async markWhatsappSent(ctx: CallerContext, clientPropertyId: string) {
    const now = new Date();
    const cp  = await this.prisma.clientProperty.findFirst({
      where: { id: clientPropertyId, client: { workspaceId: ctx.workspaceId } },
    });
    if (!cp) throw new NotFoundException('ClientProperty not found');

    let followUpAt = cp.followUpAt;
    if (!followUpAt || followUpAt <= now) {
      followUpAt = new Date(now);
      followUpAt.setDate(followUpAt.getDate() + 2);
    }

    const updated = await this.prisma.clientProperty.update({
      where: { id: clientPropertyId },
      data: {
        status:          LeadStage.CONTACTED,
        lastContactedAt: now,
        followUpAt,
        lastActionAt:    now,
      },
    });

    await this.createEvent(updated.clientId, 'WHATSAPP_SENT', {
      listingId: updated.listingId,
    });

    return updated;
  }

  generateWhatsappDraft(client: any, cp: any) {
    const name    = client.name || 'there';
    const listing = cp.listing;
    const label   = `${listing.bhk ?? ''} ${listing.propertySubType ?? 'property'} in ${
      listing.area ?? listing.city ?? 'your area'
    }`;
    return `Hi ${name}, following up regarding the ${label}. Let me know how you'd like to proceed.`;
  }

  // ── SHARE TOKEN ─────────────────────────────────────────────────────────────

  async createShareToken(clientId: string, workspaceId: string) {
    const client = await this.prisma.client.findFirst({
      where: { id: clientId, workspaceId },
      select: { id: true },
    });
    if (!client) throw new NotFoundException('Client not found');

    await this.prisma.clientShareToken.deleteMany({
      where: { clientId, workspaceId },
    });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const shareToken = await this.prisma.clientShareToken.create({
      data: { clientId, workspaceId, expiresAt },
    });

    const frontendUrl = this.config.get<string>('FRONTEND_URL') ?? 'http://localhost:3001';
    return { url: `${frontendUrl}/share/${shareToken.token}`, expiresAt };
  }

  async createShareTokenByPhone(
    phone:       string,
    workspaceId: string,
    userId:      string,
    name?:       string,
  ) {
    const normalised = phone.replace(/\D/g, '');

    let client = await this.prisma.client.findFirst({
      where: {
        workspaceId,
        phones: { some: { phone: { in: [normalised, phone] } } },
      },
      select: { id: true, name: true },
    });

    let isNew = false;

    if (!client) {
      client = await this.prisma.client.create({
        data: {
          workspaceId,
          name:    name?.trim() || null,
          ownerId: userId,      // ← assigned to the broker who created via WhatsApp
          phones:  { create: { phone: normalised, primary: true } },
        },
        select: { id: true, name: true },
      });
      isNew = true;
    } else if (name?.trim() && !client.name) {
      await this.prisma.client.update({
        where: { id: client.id },
        data:  { name: name.trim() },
      });
    }

    await this.prisma.clientShareToken.deleteMany({
      where: { clientId: client.id, workspaceId },
    });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const shareToken = await this.prisma.clientShareToken.create({
      data: { clientId: client.id, workspaceId, expiresAt },
    });

    const frontendUrl = this.config.get<string>('FRONTEND_URL') ?? 'http://localhost:3000';
    return {
      url: `${frontendUrl}/share/${shareToken.token}`,
      expiresAt,
      clientId: client.id,
      isNew,
    };
  }

  // ── EVENTS ──────────────────────────────────────────────────────────────────

  private async createEvent(clientId: string, type: string, metadata?: Record<string, any>) {
    return this.prisma.clientEvent.create({
      data: { clientId, type, metadata: metadata ?? {} },
    });
  }
}