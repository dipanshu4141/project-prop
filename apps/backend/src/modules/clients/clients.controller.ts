import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  Patch,
} from '@nestjs/common';
import { ClientsService } from './clients.service';
import { LeadStage } from '@prisma/client';

@Controller('clients')
export class ClientsController {
  constructor(
    private readonly clientsService: ClientsService,
  ) {}

  /* =====================================================
   * 📥 LEADS INBOX (CLIENT-CENTRIC)
   * MUST BE AT TOP — DO NOT MOVE
   * ===================================================== */

  @Get('leads')
  getLeadsInbox() {
    return this.clientsService.getLeadsInbox();
  }

  /* =====================================================
   * 👤 CLIENT CORE
   * ===================================================== */

  @Post()
  createOrGetClient(
    @Body() body: { phone: string; name?: string },
  ) {
    return this.clientsService.getOrCreateClient(
      body.phone,
      body.name,
    );
  }

  @Get(':id')
  getClient(@Param('id') id: string) {
    return this.clientsService.getClient(id);
  }

  /* =====================================================
   * 🏠 CLIENT ↔ PROPERTY
   * ===================================================== */

  @Post(':id/share')
  shareProperty(
    @Param('id') clientId: string,
    @Body() body: { propertyId: string },
  ) {
    return this.clientsService.shareProperty(
      clientId,
      body.propertyId,
    );
  }

  @Patch('client-property/:id/status')
  updateClientPropertyStatus(
    @Param('id') clientPropertyId: string,
    @Body() body: { status: LeadStage },
  ) {
    return this.clientsService.updateClientPropertyStatus(
      clientPropertyId,
      body.status,
    );
  }

  @Patch('client-property/:id/follow-up')
  updateClientPropertyFollowUp(
    @Param('id') clientPropertyId: string,
    @Body() body: { followUpAt: string },
  ) {
    return this.clientsService.updateClientPropertyFollowUp(
      clientPropertyId,
      body.followUpAt,
    );
  }

  /* =====================================================
   * 📲 WHATSAPP
   * ===================================================== */

  /**
   * IMPORTANT:
   * Controller NEVER builds WhatsApp text.
   * It only returns structured data.
   */
  @Get('client-property/:id/whatsapp-draft')
  getWhatsappDraft(@Param('id') clientPropertyId: string) {
    return this.clientsService.getWhatsappDraft(clientPropertyId);
  }

  @Post('client-property/:id/whatsapp-sent')
  markWhatsappSent(@Param('id') clientPropertyId: string) {
    return this.clientsService.markWhatsappSent(clientPropertyId);
  }

  @Get(':id/whatsapp-options')
  getWhatsappOptions(@Param('id') clientId: string) {
    return this.clientsService.getWhatsappOptions(clientId);
  }
}
