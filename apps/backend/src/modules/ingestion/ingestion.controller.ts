import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { IngestionService } from './ingestion.service';
import { JwtAuthGuard }     from '../../auth/guards/auth.guards';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { JwtPayload }       from '../../auth/jwt-payload.interface';
import { requireSuperAdmin } from '../../auth/helpers/require-role';

// ─── Admin routes (/admin/ingestion/...) ──────────────────────────────────────

@Controller('admin/ingestion')
@UseGuards(JwtAuthGuard)
export class IngestionAdminController {
  constructor(private ingestion: IngestionService) {}

  // Phones
  @Get('phones')
  listPhones(@CurrentUser() user: JwtPayload) {
    requireSuperAdmin(user);
    return this.ingestion.listPhones();
  }

  @Post('phones')
  addPhone(
    @CurrentUser() user: JwtPayload,
    @Body() body: { phone: string; displayName?: string; sessionPath: string },
  ) {
    requireSuperAdmin(user);
    return this.ingestion.addPhone(body.phone, body.displayName ?? '', body.sessionPath);
  }

  @Delete('phones/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removePhone(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    requireSuperAdmin(user);
    await this.ingestion.removePhone(id);
  }

  @Get('phones/:id/qr')
  async getQr(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    requireSuperAdmin(user);
    const qr = await this.ingestion.getQr(id);
    return { qr }; // null when already connected
  }

  @Get('phones/:id/groups')
  listPhoneGroups(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    requireSuperAdmin(user);
    return this.ingestion.listPhoneGroups(id);
  }

  // Groups
  @Get('groups')
  listGroups(@CurrentUser() user: JwtPayload) {
    requireSuperAdmin(user);
    return this.ingestion.listAllGroups();
  }

  @Post('groups')
  addGroup(
    @CurrentUser() user: JwtPayload,
    @Body() body: { groupJid: string; groupName: string; ingestionPhoneId: string },
  ) {
    requireSuperAdmin(user);
    return this.ingestion.addGroup(body.groupJid, body.groupName, body.ingestionPhoneId);
  }

  @Delete('groups/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeGroup(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    requireSuperAdmin(user);
    await this.ingestion.removeGroup(id);
  }

  @Post('phones/:id/sync-groups')
  async syncPhoneGroups(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    requireSuperAdmin(user);
    await this.ingestion.syncGroupsForPhone(id);
    return { success: true };
  }
}

// ─── Workspace routes (/ingestion/...) ───────────────────────────────────────

@Controller('ingestion')
@UseGuards(JwtAuthGuard)
export class IngestionController {
  constructor(private ingestion: IngestionService) {}

  @Get('available-groups')
  availableGroups(@CurrentUser() user: JwtPayload) {
    return this.ingestion.getAvailableGroups(user.workspaceId);
  }

  @Get('subscriptions')
  subscriptions(@CurrentUser() user: JwtPayload) {
    return this.ingestion.getSubscriptions(user.workspaceId);
  }

  @Post('subscriptions')
  subscribe(
    @CurrentUser() user: JwtPayload,
    @Body() body: { groupId: string },
  ) {
    return this.ingestion.subscribe(user.workspaceId, body.groupId);
  }

  @Delete('subscriptions/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async unsubscribe(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    await this.ingestion.unsubscribe(id, user.workspaceId);
  }
}

