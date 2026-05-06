// FULL FILE REPLACEMENT:
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';

@Injectable()
export class MessagesService {
  private readonly logger = new Logger('Messages');

  constructor(private readonly prisma: PrismaService) {}

  async findRawByMessageKey(messageKey: string): Promise<string | null> {
    const msg = await this.prisma.message.findUnique({
      where:  { messageKey },
      select: { rawText: true },
    });
    return msg?.rawText ?? null;
  }
}