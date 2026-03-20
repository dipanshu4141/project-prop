import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
} from '@whiskeysockets/baileys';
// import * as qrcode from 'qrcode-terminal';
import { Boom } from '@hapi/boom';
import { MessagesService } from '../../modules/messages/messages.service';
// import * as QRCode from 'qrcode';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class WhatsappService implements OnModuleInit {
  private sock: any;
  private readonly logger = new Logger('WhatsApp');

  constructor(private messagesService: MessagesService) {}

  async onModuleInit() {
    await this.start();
  }

  async start() {
    const { state, saveCreds } = await useMultiFileAuthState('wa-session');
    const { version } = await fetchLatestBaileysVersion();

    this.sock = makeWASocket({
      version,
      auth: state,
      syncFullHistory: false, // 🔥 IMPORTANT (prevents old message decrypt issues)
    });

    this.sock.ev.on('creds.update', saveCreds);

    this.sock.ev.on('connection.update', (update) => {
      const { connection, lastDisconnect, qr } = update;

      // ✅ QR handling (NEW way)
      if (qr) {
        console.log('QR RECEIVED:', qr);
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qr)}`;
console.log('QR RECEIVED:', qr);
        this.logger.log('📲 Scan QR from browser:');
        this.logger.log(qrUrl);

        // Auto open in browser (Mac)
        const open = require('child_process').exec;
        open(`open "${qrUrl}"`);
      }

      if (connection === 'close') {
        const reason = (lastDisconnect?.error as Boom)?.output?.statusCode;
        this.logger.warn(`Disconnected: ${reason}`);

        if (reason === DisconnectReason.loggedOut) {
          this.logger.error('Logged out from WhatsApp. Please scan QR again.');
        } else {
          this.logger.warn('Reconnecting to WhatsApp in 3s...');
          setTimeout(() => this.start(), 3000); // ✅ safe reconnect
        }
      }

      if (connection === 'open') {
        this.logger.log('✅ WhatsApp connected!');
      }
    });

    this.sock.ev.on('messages.upsert', async (m) => {
      try {
        const msg = m.messages?.[0];
        if (!msg) return;
        if (!msg.message) return;
        if (msg.key?.fromMe) return;

        // -------- Extract text / caption --------
        const text =
          msg.message.conversation ||
          msg.message.extendedTextMessage?.text ||
          msg.message.imageMessage?.caption ||
          msg.message.videoMessage?.caption ||
          msg.message.documentMessage?.caption ||
          null;

        if (!text || text.trim().length === 0) return;

        const groupId = msg.key.remoteJid;
        const messageKey = msg.key.id;

        if (!groupId || !messageKey) return;

        // -------- SENDER EXTRACTION (BULLETPROOF) --------
        const key: any = msg.key;
        let senderJidRaw: string | null = null;

        // Case 1: PERSONAL CHAT
        if (
          key.remoteJid &&
          key.remoteJid.endsWith('@s.whatsapp.net') &&
          !key.remoteJid.endsWith('@g.us')
        ) {
          senderJidRaw = key.remoteJid;
        }
        // Case 2: GROUP CHAT
        else {
          if (key.addressingMode === 'lid' && key.participantAlt) {
            senderJidRaw = key.participantAlt;
          } else if (key.participant && key.participant.length > 0) {
            senderJidRaw = key.participant;
          } else if ((msg as any).participant) {
            senderJidRaw = (msg as any).participant;
          }
        }

        // -------- Normalize to pure phone number --------
        let sender: string | null = null;

        if (senderJidRaw) {
          sender = senderJidRaw
            .toString()
            .replace(/@s\.whatsapp\.net/g, '')
            .replace(/\D/g, '');

          if (sender.length < 10) {
            sender = null;
          }
        }

        this.logger.debug(`Sender RAW = ${senderJidRaw}`);
        this.logger.debug(`Sender CLEAN = ${sender}`);

        // -------- Send to pipeline --------
        await this.messagesService.handleIncomingMessage({
          workspaceId:
            process.env.DEFAULT_WORKSPACE_ID ?? "9d8f5f71-2c31-4e3a-8fa2-accadd507984",
          groupId,
          messageKey,
          text,
          sender: sender || undefined,
        });
      } catch (err) {
        this.logger.error(
          'Error processing incoming WhatsApp message',
          err,
        );
      }
    });
  }
}