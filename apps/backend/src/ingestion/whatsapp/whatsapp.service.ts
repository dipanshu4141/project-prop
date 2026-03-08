import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
} from '@whiskeysockets/baileys';
import * as qrcode from 'qrcode-terminal';
import { Boom } from '@hapi/boom';
import { MessagesService } from '../../modules/messages/messages.service';

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
      printQRInTerminal: true,
    });

    this.sock.ev.on('creds.update', saveCreds);

    this.sock.ev.on('connection.update', (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        qrcode.generate(qr, { small: true });
      }

      if (connection === 'close') {
        const reason = (lastDisconnect?.error as Boom)?.output?.statusCode;
        this.logger.warn(`Disconnected: ${reason}`);

        if (reason !== DisconnectReason.loggedOut) {
          this.logger.warn('Reconnecting to WhatsApp...');
          this.start();
        } else {
          this.logger.error('Logged out from WhatsApp.');
        }
      }

      if (connection === 'open') {
        this.logger.log('WhatsApp connected!');
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
          // LID mode group
          if (key.addressingMode === 'lid' && key.participantAlt) {
            senderJidRaw = key.participantAlt;
          }
          // Normal group mode
          else if (key.participant && key.participant.length > 0) {
            senderJidRaw = key.participant;
          }
          // Fallback
          else if ((msg as any).participant) {
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

        this.logger.warn(`FINAL SENDER RAW = ${senderJidRaw}`);
        this.logger.warn(`FINAL SENDER CLEAN = ${sender}`);

        // -------- Send to pipeline --------
        await this.messagesService.handleIncomingMessage({
          groupId,
          messageKey,
          text,
          sender: sender || undefined,
        });
      } catch (err) {
        this.logger.error('Error processing incoming WhatsApp message', err);
      }
    });
  }
}
