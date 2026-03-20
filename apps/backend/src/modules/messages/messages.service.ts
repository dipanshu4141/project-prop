import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { AiParserService, ParseOutcome } from '../../ai/property-parser/ai-parser/ai-parser.service';
import { PropertiesService } from '../properties/properties.service';

interface IncomingMessageInput {
  workspaceId: string;   // ← ADDED: every message belongs to a workspace
  groupId:     string;
  messageKey:  string;
  text:        string;
  sender?:     string | null;
}

@Injectable()
export class MessagesService {
  private readonly logger = new Logger('Messages');

  constructor(
    private readonly prisma:      PrismaService,
    private readonly ai:          AiParserService,
    private readonly properties:  PropertiesService,
  ) {}

  async handleIncomingMessage(input: IncomingMessageInput): Promise<void> {
    const { workspaceId, groupId, messageKey, text, sender } = input;

    // 1️⃣ Deduplication — don't process the same message twice
    const exists = await this.prisma.message.findUnique({
      where: { messageKey },
    });

    if (exists) {
      this.logger.debug(`Already processed: ${messageKey}`);
      return;
    }

    // 2️⃣ Save raw message — scoped to workspace
    const created = await this.prisma.message.create({
      data: {
        workspaceId,          // ← scoped
        groupName:  groupId,
        messageKey,
        rawText:    text,
      },
    });

    this.logger.log('Message saved, sending to AI...');

    // 3️⃣ Parse with AI
    const outcome: ParseOutcome = await this.ai.parseMessage(text);
    this.logger.log('AI returned: ' + JSON.stringify(outcome));

    if (!outcome.success) {
      this.logger.warn(`AI parse failed [${outcome.reason}], skipping`);
      return;
    }

    const aiResult = outcome.data;

    // 4️⃣ Create listings if AI found properties
    if (aiResult.properties.length > 0) {
      this.logger.log(`Creating ${aiResult.properties.length} listings`);
      await this.properties.createFromAi(
        workspaceId,      // ← passed through
        created.id,
        aiResult,
        input.sender,
      );
    } else {
      this.logger.warn('AI returned no properties, skipping creation');
    }
  }
}