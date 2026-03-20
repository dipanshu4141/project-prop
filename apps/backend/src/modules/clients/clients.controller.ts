import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  Patch,
  Request,
  UseGuards,
} from '@nestjs/common';
import { LeadStage } from '@prisma/client';
import { ClientsService } from './clients.service';
import { JwtAuthGuard } from '../../auth/guards/auth.guards';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { JwtPayload } from '../../auth/jwt-payload.interface';


@Controller('clients')
@UseGuards(JwtAuthGuard)
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  // ================================================================
  // LEADS INBOX  (must stay above :id to avoid route conflict)
  // ================================================================

  @Get('leads')
  getLeadsInbox(@CurrentUser() user: JwtPayload) {
    return this.clientsService.getLeadsInbox(user.workspaceId);
  }

  // ================================================================
  // FOLLOW-UPS (dashboard)
  // ================================================================

  @Get('follow-ups/today')
  getFollowUpsToday(@CurrentUser() user: JwtPayload) {
    return this.clientsService.getFollowUpsToday(user.workspaceId);
  }

  @Get('follow-ups/upcoming')
  getUpcomingFollowUps(@CurrentUser() user: JwtPayload) {
    return this.clientsService.getUpcomingFollowUps(user.workspaceId);
  }

  // ================================================================
  // CLIENT CORE
  // ================================================================

  @Post()
  createOrGetClient(
    @CurrentUser() user: JwtPayload,
    @Body() body: { phone: string; name?: string },
  ) {
    return this.clientsService.getOrCreateClient(
      user.workspaceId,
      body.phone,
      body.name,
    );
  }

  @Get(':id')
  getClient(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.clientsService.getClient(user.workspaceId, id);
  }

  // ================================================================
  // CLIENT ↔ LISTING
  // ================================================================

  @Post(':id/share')
  shareProperty(
    @CurrentUser() user: JwtPayload,
    @Param('id') clientId: string,
    @Body() body: { listingId: string },   // was propertyId
  ) {
    return this.clientsService.shareProperty(
      user.workspaceId,
      clientId,
      body.listingId,
    );
  }

  @Patch('client-property/:id/status')
  updateClientPropertyStatus(
    @CurrentUser() user: JwtPayload,
    @Param('id') clientPropertyId: string,
    @Body() body: { status: LeadStage },
  ) {
    return this.clientsService.updateClientPropertyStatus(
      user.workspaceId,
      clientPropertyId,
      body.status,
    );
  }

  @Patch('client-property/:id/follow-up')
  updateClientPropertyFollowUp(
    @CurrentUser() user: JwtPayload,
    @Param('id') clientPropertyId: string,
    @Body() body: { followUpAt: string },
  ) {
    return this.clientsService.updateClientPropertyFollowUp(
      user.workspaceId,
      clientPropertyId,
      body.followUpAt,
    );
  }

  // ================================================================
  // NOTES
  // ================================================================

  @Post(':id/notes')
  addNote(
    @CurrentUser() user: JwtPayload,
    @Param('id') clientId: string,
    @Body() body: { note: string },
  ) {
    return this.clientsService.addNote(user.workspaceId, clientId, body.note);
  }

  // ================================================================
  // WHATSAPP
  // ================================================================

  @Get(':id/whatsapp-options')
  getWhatsappOptions(
    @CurrentUser() user: JwtPayload,
    @Param('id') clientId: string,
  ) {
    return this.clientsService.getWhatsappOptions(user.workspaceId, clientId);
  }

  @Get('client-property/:id/whatsapp-draft')
  getWhatsappDraft(
    @CurrentUser() user: JwtPayload,
    @Param('id') clientPropertyId: string,
  ) {
    return this.clientsService.getWhatsappDraft(user.workspaceId, clientPropertyId);
  }

  @Post('client-property/:id/whatsapp-sent')
  markWhatsappSent(
    @CurrentUser() user: JwtPayload,
    @Param('id') clientPropertyId: string,
  ) {
    return this.clientsService.markWhatsappSent(user.workspaceId, clientPropertyId);
  }

  @Post(':id/share-token')
  @UseGuards(JwtAuthGuard)
  createShareToken(
    @Param('id') clientId: string,
    @Request() req: any,
  ) {
    const workspaceId: string = req.user.workspaceId;
    return this.clientsService.createShareToken(clientId, workspaceId);
  }



}