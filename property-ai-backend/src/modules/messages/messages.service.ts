import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AiParserService, AiParseResult } from '../ai-parser/ai-parser.service';
import { PropertiesService } from '../properties/properties.service';

/* =======================
   Types
======================= */

interface IncomingMessageInput {
  groupId: string;
  messageKey: string;
  text: string;
  sender?: string | null;
}

/* =======================
   Service
======================= */


@Injectable()
export class MessagesService {
  private readonly logger = new Logger('Messages');


  constructor(
    private readonly prisma: PrismaService,
    private readonly ai: AiParserService,
    private readonly properties: PropertiesService,
  ) {}

  async handleIncomingMessage(input: IncomingMessageInput): Promise<void> {

    const { groupId, messageKey, text, sender } = input;

    // 1️⃣ Deduplication: don't process same message twice
    const exists = await this.prisma.message.findUnique({
      where: { messageKey },
    });

    if (exists) {
      this.logger.debug(`Message already processed: ${messageKey}`);
      return;
    }

    // 2️⃣ Save raw message
    const created = await this.prisma.message.create({
      data: {
        groupName: groupId,
        messageKey: messageKey,
        rawText: text,
      },
    });

    this.logger.log('Message saved, sending to AI...');

    // 3️⃣ Parse with AI
    const aiResult: AiParseResult | null = await this.ai.parseMessage(text);

    this.logger.log('AI returned: ' + JSON.stringify(aiResult));

    // 4️⃣ Create properties if any
    if (aiResult && Array.isArray(aiResult.properties) && aiResult.properties.length > 0) {
      this.logger.log(`Creating ${aiResult.properties.length} properties`);
      this.logger.log(`Sender passed to property pipeline: ${input.sender}`);

      await this.properties.createFromAi(created.id, aiResult, input.sender);
    } else {
      this.logger.warn('AI returned no properties, skipping creation');
    }
  }
}
