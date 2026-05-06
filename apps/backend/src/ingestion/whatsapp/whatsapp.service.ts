import { Injectable, OnModuleDestroy, OnModuleInit, Logger } from '@nestjs/common';
import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  proto,
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import { MessagesService } from '../../modules/messages/messages.service';

@Injectable()
export class WhatsappService implements OnModuleInit, OnModuleDestroy {
  private sock: any;
  private saveCreds: (() => Promise<void>) | null = null;
  private isShuttingDown = false;
  private readonly logger = new Logger('WhatsApp');

  constructor(private messagesService: MessagesService) {}

  async onModuleInit() {
    await this.start();
  }

  async onModuleDestroy() {
    this.isShuttingDown = true;
    this.logger.log('WhatsApp: flushing session before shutdown…');
    try {
      if (this.saveCreds) await this.saveCreds();
      this.sock?.end(undefined);
    } catch {}
    this.logger.log('WhatsApp: session flushed ✓');
  }

  async start() {
    const { state, saveCreds } = await useMultiFileAuthState('wa-session');
    const { version }          = await fetchLatestBaileysVersion();
    this.saveCreds = saveCreds;

    this.sock = makeWASocket({
      version,
      auth:            state,
      syncFullHistory: false,
      getMessage: async (key: proto.IMessageKey) => {
        try {
          const stored = await this.messagesService.findRawByMessageKey(key.id ?? '');
          if (stored) return { conversation: stored };
        } catch {}
        return undefined;
      },
    });

    this.sock.ev.on('creds.update', saveCreds);

    this.sock.ev.on('connection.update', (update: any) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qr)}`;
        this.logger.log('📲 Scan QR:');
        this.logger.log(qrUrl);
      }

      if (connection === 'close') {
        const reason = (lastDisconnect?.error as Boom)?.output?.statusCode;
        this.logger.warn(`Disconnected: ${reason}`);
        if (this.isShuttingDown) return;
        if (reason === DisconnectReason.loggedOut) {
          this.logger.error('Logged out — scan QR again.');
        } else {
          this.logger.warn('Reconnecting in 3s…');
          setTimeout(() => this.start(), 3000);
        }
      }

      if (connection === 'open') {
        this.logger.log('✅ WhatsApp connected (legacy single-session)');
      }
    });

    // messages.upsert intentionally removed —
    // IngestionService owns all message handling now.
    // This socket is kept alive only to serve getMessage() retries.
  }
}