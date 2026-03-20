import {
  Controller, Get, Patch, Param, Query, Body, UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard, PlatformRolesGuard } from '../../auth/guards/auth.guards';
import { PlatformRoles } from '../../auth/decorators/roles.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { JwtPayload } from '../../auth/jwt-payload.interface';

/**
 * All routes here require:
 *   1. Valid JWT (JwtAuthGuard)
 *   2. platformRole = SUPERADMIN or SUPPORT (PlatformRolesGuard)
 *
 * SUPERADMIN = full read + write
 * SUPPORT    = read + limited actions (no suspend, no role change)
 */

@Controller('admin')
@UseGuards(JwtAuthGuard, PlatformRolesGuard)
@PlatformRoles('SUPERADMIN', 'SUPPORT')
export class AdminController {
  constructor(private admin: AdminService) {}

  /* ================================================================
   * PLATFORM STATS
   * ================================================================ */

  @Get('stats')
  getStats() {
    return this.admin.getPlatformStats();
  }

  /* ================================================================
   * WORKSPACES
   * ================================================================ */

  @Get('workspaces')
  getWorkspaces(
    @Query('page')      page?:      string,
    @Query('limit')     limit?:     string,
    @Query('q')         q?:         string,
    @Query('plan')      plan?:      string,
    @Query('type')      type?:      string,
    @Query('active')    active?:    string,
    @Query('sortBy')    sortBy?:    string,
    @Query('sortOrder') sortOrder?: string,
  ) {
    return this.admin.getWorkspaces({
      page:      page      ? Number(page)  : undefined,
      limit:     limit     ? Number(limit) : undefined,
      q, plan, type, active,
      sortBy,
      sortOrder: sortOrder as any,
    });
  }

  @Get('workspaces/:id')
  getWorkspace(@Param('id') id: string) {
    return this.admin.getWorkspace(id);
  }

  @Patch('workspaces/:id/suspend')
  @PlatformRoles('SUPERADMIN')    // SUPPORT cannot suspend
  suspendWorkspace(
    @CurrentUser() admin: JwtPayload,
    @Param('id') id: string,
    @Body() body: { reason?: string },
  ) {
    return this.admin.setWorkspaceActive(id, false, body.reason, admin.sub);
  }

  @Patch('workspaces/:id/reactivate')
  @PlatformRoles('SUPERADMIN')
  reactivateWorkspace(
    @CurrentUser() admin: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.admin.setWorkspaceActive(id, true, undefined, admin.sub);
  }

  /* ================================================================
   * USERS
   * ================================================================ */

  @Get('users')
  getUsers(
    @Query('page')         page?:         string,
    @Query('limit')        limit?:        string,
    @Query('q')            q?:            string,
    @Query('platformRole') platformRole?: string,
    @Query('active')       active?:       string,
  ) {
    return this.admin.getUsers({
      page:  page  ? Number(page)  : undefined,
      limit: limit ? Number(limit) : undefined,
      q, platformRole, active,
    });
  }

  @Patch('users/:id')
  @PlatformRoles('SUPERADMIN')    // SUPPORT cannot change roles or deactivate users
  updateUser(
    @CurrentUser() admin: JwtPayload,
    @Param('id') targetUserId: string,
    @Body() dto: { isActive?: boolean; platformRole?: string },
  ) {
    return this.admin.updateUser(targetUserId, dto, admin.sub);
  }

  /* ================================================================
   * SUBSCRIPTIONS
   * ================================================================ */

  @Get('subscriptions')
  getSubscriptions() {
    return this.admin.getSubscriptionOverview();
  }

  /* ================================================================
   * AUDIT LOG
   * ================================================================ */

  @Get('audit')
  getAuditLog(
    @Query('page')        page?:        string,
    @Query('limit')       limit?:       string,
    @Query('workspaceId') workspaceId?: string,
  ) {
    return this.admin.getAuditLog({
      page:  page  ? Number(page)  : undefined,
      limit: limit ? Number(limit) : undefined,
      workspaceId,
    });
  }
}