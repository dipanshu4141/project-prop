import { Body, Controller, Post } from '@nestjs/common';
import { MessagesService } from './messages.service';

@Controller('messages')
export class MessagesController {
  constructor(private readonly messages: MessagesService) {}

  @Post('manual')
  async ingestManualMessage(
    @Body()
    body: {
      text: string;
      source: {
        type: string;
        contactNumber: string;
        name?: string;
        firmName?: string;
      };
    },
  ) {
    const { text, source } = body;

    if (!text || !text.trim()) {
      throw new Error('Message text is required');
    }

    // 👇 Make it indistinguishable from WhatsApp
    await this.messages.handleIncomingMessage({
      groupId: 'MANUAL',
      messageKey: `manual-${Date.now()}`,
      text: text.trim(),
      sender: source.contactNumber,
    });

    return { success: true };
  }
}
