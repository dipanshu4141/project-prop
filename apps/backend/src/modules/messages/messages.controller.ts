// FULL FILE REPLACEMENT:
import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/auth.guards';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { JwtPayload } from '../../auth/jwt-payload.interface';
import { IngestionService } from '../ingestion/ingestion.service';

@Controller('messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(private readonly ingestion: IngestionService) {}

  @Post('manual')
  async ingestManualMessage(
    @CurrentUser() user: JwtPayload,
    @Body() body: {
      text: string;
      source: { type: string; contactNumber: string; name?: string; firmName?: string };
    },
  ) {
    const { text, source } = body;
    if (!text?.trim()) throw new Error('Message text is required');

    await this.ingestion.ingestManual({
      workspaceId: user.workspaceId,
      text:        text.trim(),
      sender:      source.contactNumber,
    });

    return { success: true };
  }
}