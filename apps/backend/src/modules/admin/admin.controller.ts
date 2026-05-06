// apps/backend/src/modules/admin/admin.controller.ts
// Replaces the previous admin-properties.controller.ts
// All routes under /admin/* — requires SUPERADMIN or SUPPORT platform role.

import { Controller, Get, Post, Patch, Param, Query, 
  Body, Request,UseGuards, ForbiddenException,
  HttpCode, HttpStatus } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/auth.guards';

import { AdminPropertiesService }    from './admin-properties.service';
import { AdminWorkspacesService }    from './admin-workspaces.service';
import { AdminUsersService }         from './admin-users.service';
import { AdminSubscriptionsService } from './admin-subscriptions.service';
import { HealthService } from './health.service';
import { AdminAuditService }         from './admin-audit.service';
import { DedupService } from '../dedup/dedup.service';

function requireAdmin(req: any) {
  const role = req.user?.platformRole;
  if (role !== 'SUPERADMIN' && role !== 'SUPPORT') {
    throw new ForbiddenException('Admin access required');
  }
}

function requireSuperAdmin(req: any) {
  if (req.user?.platformRole !== 'SUPERADMIN') {
    throw new ForbiddenException('SuperAdmin access required');
  }
}

@Controller('admin')
@UseGuards(JwtAuthGuard)
export class AdminController {
    constructor(
    private readonly properties:    AdminPropertiesService,
    private readonly workspaces:    AdminWorkspacesService,
    private readonly users:         AdminUsersService,
    private readonly subscriptions: AdminSubscriptionsService,
    private readonly audit:         AdminAuditService,
    private readonly health:        HealthService,
    private readonly dedup:         DedupService,
  ) {}

  @Get('health')
  getPlatformHealth(@Request() req: any) {
    requireSuperAdmin(req);
    return this.health.getPlatformHealth();
  }

  // ── PROPERTIES ────────────────────────────────────────────────────────────

  @Get('properties/stats')
  getPropertyStats(@Request() req: any) {
    requireAdmin(req);
    return this.properties.getStats();
  }

  @Get('properties')
  findAllProperties(@Query() q: any, @Request() req: any) {
    requireAdmin(req);
    return this.properties.findAll({
      page: q.page ? Number(q.page) : 1,
      limit: q.limit ? Number(q.limit) : 20,
      q: q.q,
      verified: q.verified,
      duplicatesOnly: q.duplicatesOnly,
      sortBy:         q.sortBy,         // ← add
      sortOrder:      q.sortOrder,      // ← add
    });
  }

  @Get('properties/:id')
  findOneProperty(@Param('id') id: string, @Request() req: any) {
    requireAdmin(req);
    return this.properties.findOne(id);
  }

  @Patch('properties/:id/verify')
  @HttpCode(HttpStatus.OK)
  verifyProperty(@Param('id') id: string, @Request() req: any) {
    requireAdmin(req);
    return this.properties.verify(id, req.user.sub);
  }

  // ── WORKSPACES ────────────────────────────────────────────────────────────

  @Get('workspaces')
  findAllWorkspaces(@Query() q: any, @Request() req: any) {
    requireAdmin(req);
    return this.workspaces.findAll({
      page:  q.page  ? Number(q.page)  : 1,
      limit: q.limit ? Number(q.limit) : 20,
      q:      q.q,
      type:   q.type,
      plan:   q.plan,
      active: q.active,
    });
  }

  @Get('workspaces/:id')
  findOneWorkspace(@Param('id') id: string, @Request() req: any) {
    requireAdmin(req);
    return this.workspaces.findOne(id);
  }

  @Patch('workspaces/:id/suspend')
  @HttpCode(HttpStatus.OK)
  suspendWorkspace(
    @Param('id') id: string,
    @Body() body: { reason?: string },
    @Request() req: any,
  ) {
    requireSuperAdmin(req);
    return this.workspaces.suspend(id, body.reason ?? 'Suspended by admin');
  }

  @Patch('workspaces/:id/unsuspend')
  @HttpCode(HttpStatus.OK)
  unsuspendWorkspace(@Param('id') id: string, @Request() req: any) {
    requireSuperAdmin(req);
    return this.workspaces.unsuspend(id);
  }

  // ── USERS ─────────────────────────────────────────────────────────────────

  @Get('users')
  findAllUsers(@Query() q: any, @Request() req: any) {
    requireAdmin(req);
    return this.users.findAll({
      page:         q.page ? Number(q.page) : 1,
      limit:        q.limit ? Number(q.limit) : 20,
      q:            q.q,
      platformRole: q.platformRole,
      active:       q.active,
    });
  }

  @Patch('users/:id/platform-role')
  @HttpCode(HttpStatus.OK)
  setUserRole(
    @Param('id') id: string,
    @Body() body: { role: string },
    @Request() req: any,
  ) {
    requireSuperAdmin(req);
    return this.users.setPlatformRole(id, body.role);
  }

  @Patch('users/:id/deactivate')
  @HttpCode(HttpStatus.OK)
  deactivateUser(@Param('id') id: string, @Request() req: any) {
    requireSuperAdmin(req);
    return this.users.deactivate(id);
  }

  @Patch('users/:id/activate')
  @HttpCode(HttpStatus.OK)
  activateUser(@Param('id') id: string, @Request() req: any) {
    requireSuperAdmin(req);
    return this.users.activate(id);
  }

  // ── SUBSCRIPTIONS ─────────────────────────────────────────────────────────

  @Get('subscriptions/stats')
  getSubscriptionStats(@Request() req: any) {
    requireAdmin(req);
    return this.subscriptions.getStats();
  }

  @Get('subscriptions')
  findAllSubscriptions(@Query() q: any, @Request() req: any) {
    requireAdmin(req);
    return this.subscriptions.findAll({
      page:   q.page  ? Number(q.page)  : 1,
      limit:  q.limit ? Number(q.limit) : 20,
      q:      q.q,
      status: q.status,
      plan:   q.plan,
    });
  }

  // ── AUDIT LOG ─────────────────────────────────────────────────────────────

  @Get('audit/meta')
  getAuditMeta(@Request() req: any) {
    requireAdmin(req);
    return Promise.all([
      this.audit.getActions(),
      this.audit.getEntities(),
    ]).then(([actions, entities]) => ({ actions, entities }));
  }

  @Get('audit')
  findAuditLogs(@Query() q: any, @Request() req: any) {
    requireAdmin(req);
    return this.audit.findAll({
      page:        q.page  ? Number(q.page)  : 1,
      limit:       q.limit ? Number(q.limit) : 50,
      workspaceId: q.workspaceId,
      userId:      q.userId,
      action:      q.action,
      entity:      q.entity,
      fromDate:    q.fromDate,
      toDate:      q.toDate,
    });
  }

  @Post('dedup/run')
  @HttpCode(HttpStatus.OK)
  runDedupBackfill(@Request() req: any) {
    requireSuperAdmin(req);
    return this.dedup.runBackfill();
  }
}