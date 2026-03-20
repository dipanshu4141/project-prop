import {
  Body,
  Controller,
  Post,
  UseGuards,
} from '@nestjs/common';
import { MessagesService } from './messages.service';
import { JwtAuthGuard } from '../../auth/guards/auth.guards';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { JwtPayload } from '../../auth/jwt-payload.interface';

@Controller('messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(private readonly messages: MessagesService) {}

  /**
   * POST /messages/manual
   *
   * Accepts raw text (typed by broker) or a WhatsApp-style message
   * and runs it through the full AI ingestion pipeline,
   * scoped to the calling user's workspace.
   */
  @Post('manual')
  async ingestManualMessage(
    @CurrentUser() user: JwtPayload,
    @Body() body: {
      text: string;
      source: {
        type:           string;
        contactNumber:  string;
        name?:          string;
        firmName?:      string;
      };
    },
  ) {
    const { text, source } = body;

    if (!text?.trim()) {
      throw new Error('Message text is required');
    }

    await this.messages.handleIncomingMessage({
      workspaceId: user.workspaceId,          // ← scoped to caller's workspace
      groupId:     'MANUAL',
      messageKey:  `manual-${user.workspaceId}-${Date.now()}`,  // workspace-namespaced key
      text:        text.trim(),
      sender:      source.contactNumber,
    });

    return { success: true };
  }
}