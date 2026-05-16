import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  Patch,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { LeadStage, MemberRole } from '@prisma/client';
import { CallerContext, ClientsService } from './clients.service';
import { JwtAuthGuard } from '../../auth/guards/auth.guards';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { JwtPayload } from '../../auth/jwt-payload.interface';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ShortlistsService } from '../shortlists/shortlists.service';



class ShareTokenByPhoneDto {
  @IsString()
  @IsNotEmpty()
  phone!: string;

  @IsString()
  @IsOptional()
  name?: string;
}


@Controller('clients')
@UseGuards(JwtAuthGuard)
export class ClientsController {

  constructor(
    private readonly clientsService: ClientsService,
    private readonly shortlistsService: ShortlistsService,
  ) {}

  private ctx(user: JwtPayload): CallerContext {
      return {
        workspaceId: user.workspaceId,
        userId:      user.sub,
        role:        user.role as MemberRole,
      };
    }

  // ================================================================
  // LEADS INBOX  (must stay above :id to avoid route conflict)
  // ================================================================

  @Get('leads')
  getLeadsInbox(@CurrentUser() user: JwtPayload) {
    return this.clientsService.getLeadsInbox(this.ctx(user));
  }

  // ================================================================
  // LEAD POOL
  // ================================================================

  @Get('pool')
  getLeadPool(@CurrentUser() user: JwtPayload) {
    return this.clientsService.getLeadPool(this.ctx(user));
  }

  // ================================================================
  // FOLLOW-UPS (dashboard)
  // ================================================================

  @Get('follow-ups/today')
  getFollowUpsToday(@CurrentUser() user: JwtPayload) {
    return this.clientsService.getFollowUpsToday(this.ctx(user));
  }

  @Get('follow-ups/upcoming')
  getUpcomingFollowUps(@CurrentUser() user: JwtPayload) {
    return this.clientsService.getUpcomingFollowUps(this.ctx(user));
  }

  // ================================================================
  // CLIENT CORE
  // ================================================================

  @Post()
  createOrGetClient(
    @CurrentUser() user: JwtPayload,
    @Body() body: { phone: string; name?: string },
  ) {
    return this.clientsService.getOrCreateClient(this.ctx(user), body.phone, body.name);
  }

  @Get(':id')
  getClient(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.clientsService.getClient(this.ctx(user), id);
  }

  // ================================================================
  // CLAIM / REASSIGN
  // ================================================================

  @Post(':id/claim')
  @HttpCode(HttpStatus.OK)
  claimLead(@Param('id') clientId: string, @CurrentUser() user: JwtPayload) {
    return this.clientsService.claimLead(this.ctx(user), clientId);
  }

  @Patch(':id/reassign')
  @HttpCode(HttpStatus.OK)
  reassignClient(
    @Param('id') clientId: string,
    @Body() body: { toUserId: string | null },
    @CurrentUser() user: JwtPayload,
  ) {
    return this.clientsService.reassignClient(this.ctx(user), clientId, body.toUserId);
  }

  // ================================================================
  // CLIENT ↔ LISTING
  // ================================================================

  @Post(':id/follow-up')
    @HttpCode(HttpStatus.OK)
    setClientFollowUp(
      @CurrentUser() user: JwtPayload,
      @Param('id') clientId: string,
      @Body() body: { followUpAt: string | null },
    ) {
      return this.clientsService.setClientFollowUp(
        this.ctx(user), clientId, body.followUpAt
      );
    }

  @Post(':id/share')
  shareProperty(
    @CurrentUser() user: JwtPayload,
    @Param('id') clientId: string,
    @Body() body: { listingId: string },
  ) {
    return this.clientsService.shareProperty(this.ctx(user), clientId, body.listingId);
  }

  @Patch('client-property/:id/status')
  updateClientPropertyStatus(
    @CurrentUser() user: JwtPayload,
    @Param('id') clientPropertyId: string,
    @Body() body: { status: LeadStage },
  ) {
    return this.clientsService.updateClientPropertyStatus(
      this.ctx(user),
      clientPropertyId,
      body.status,
    );
  }

  @Patch('client-property/:id/follow-up')
  updateClientPropertyFollowUp(
    @CurrentUser() user: JwtPayload,
    @Param('id') clientPropertyId: string,
    @Body() body: { followUpAt: string},
  ) {
    return this.clientsService.updateClientPropertyFollowUp(
      this.ctx(user),
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
    return this.clientsService.addNote(this.ctx(user), clientId, body.note);
  }

  // ================================================================
  // WHATSAPP
  // ================================================================

  @Get(':id/whatsapp-options')
  getWhatsappOptions(
    @CurrentUser() user: JwtPayload,
    @Param('id') clientId: string,
  ) {
    return this.clientsService.getWhatsappOptions(this.ctx(user), clientId);
  }

  @Get('client-property/:id/whatsapp-draft')
  getWhatsappDraft(
    @CurrentUser() user: JwtPayload,
    @Param('id') clientPropertyId: string,
  ) {
    return this.clientsService.getWhatsappDraft(this.ctx(user), clientPropertyId);
  }

  @Post('client-property/:id/whatsapp-sent')
  markWhatsappSent(
    @CurrentUser() user: JwtPayload,
    @Param('id') clientPropertyId: string,
  ) {
    return this.clientsService.markWhatsappSent(this.ctx(user), clientPropertyId);
  }

  // ================================================================
  // SHARE TOKENS
  // ================================================================

  @Post(':id/share-token')
  createShareToken(
    @Param('id') clientId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.clientsService.createShareToken(clientId, user.workspaceId);
  }

  @Post('share-token-by-phone')
  createShareTokenByPhone(
    @Body() body: ShareTokenByPhoneDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.clientsService.createShareTokenByPhone(
      body.phone,
      user.workspaceId,
      user.sub,
      body.name,
    );
  }

  @Get(':id/shortlists')
  getClientShortlists(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.shortlistsService.listForClient(user.workspaceId, id);
  }
}
