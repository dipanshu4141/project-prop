import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { createHash } from 'crypto';

@Injectable()
export class MessageCacheService {
  private readonly logger = new Logger(MessageCacheService.name);

  constructor(private readonly prisma: PrismaService) {}

  private hash(text: string): string {
    const normalized = text.toLowerCase().replace(/\s+/g, ' ').trim();
    return createHash('sha256').update(normalized).digest('hex');
  }

  async isDuplicate(
    text: string,
    workspaceId: string,
  ): Promise<{ hit: boolean; messageId?: string }> {
    const hash = this.hash(text);

    const existing = await this.prisma.messageCache.findUnique({
      where: { hash },
    });

    if (existing) {
      this.logger.log(`CACHE_HIT workspaceId=${workspaceId} hash=${hash.slice(0, 8)}`);
      return { hit: true, messageId: existing.messageId };
    }

    return { hit: false };
  }

  async store(text: string, messageId: string, workspaceId: string): Promise<void> {
    const hash = this.hash(text);
    await this.prisma.messageCache.upsert({
      where: { hash },
      create: { hash, messageId, workspaceId },
      update: {},
    });
  }
}