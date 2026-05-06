// apps/backend/src/modules/team/team.controller.ts

import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query,
  UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { TeamService }       from './team.service';
import { JwtAuthGuard, RolesGuard } from '../../auth/guards/auth.guards';
import { CurrentUser }       from '../../auth/decorators/current-user.decorator';
import { Roles }             from '../../auth/decorators/roles.decorator';
import { JwtPayload }        from '../../auth/jwt-payload.interface';
import { MemberRole }        from '@prisma/client';

/* ====================================================================
 * TEAM CONTROLLER  —  /team/*
 * All routes require JWT auth. Owner-only routes also require RolesGuard.
 * ==================================================================== */

@Controller('team')
@UseGuards(JwtAuthGuard)
export class TeamController {
  constructor(private readonly team: TeamService) {}

  // ── Members ──────────────────────────────────────────────────────────

  @Get('members')
  getMembers(@CurrentUser() user: JwtPayload) {
    return this.team.getMembers(user.workspaceId);
  }

  @Patch('members/:memberId/role')
  @UseGuards(RolesGuard)
  @Roles(MemberRole.OWNER)
  updateRole(
    @CurrentUser() user: JwtPayload,
    @Param('memberId') memberId: string,
    @Body() body: { role: MemberRole },
  ) {
    return this.team.updateMemberRole(user.workspaceId, memberId, body.role, user.sub);
  }

  @Delete('members/:memberId')
  @UseGuards(RolesGuard)
  @Roles(MemberRole.OWNER)
  @HttpCode(HttpStatus.OK)
  removeMember(
    @CurrentUser() user: JwtPayload,
    @Param('memberId') memberId: string,
  ) {
    return this.team.removeMember(user.workspaceId, memberId, user.sub);
  }

  // ── Invites ───────────────────────────────────────────────────────────

  @Get('invites')
  @UseGuards(RolesGuard)
  @Roles(MemberRole.OWNER)
  getPendingInvites(@CurrentUser() user: JwtPayload) {
    return this.team.getPendingInvites(user.workspaceId);
  }

  @Post('invites')
  @UseGuards(RolesGuard)
  @Roles(MemberRole.OWNER)
  sendInvite(
    @CurrentUser() user: JwtPayload,
    @Body() body: { email: string; role?: MemberRole },
  ) {
    return this.team.sendInvite(
      user.workspaceId,
      user.sub,
      body.email,
      body.role ?? MemberRole.BROKER,
    );
  }

  /**
   * POST /team/invites/:inviteId/resend
   * Resets the expiry and re-sends the invite email.
   * Owner only.
   */
  @Post('invites/:inviteId/resend')
  @UseGuards(RolesGuard)
  @Roles(MemberRole.OWNER)
  @HttpCode(HttpStatus.OK)
  resendInvite(
    @CurrentUser() user: JwtPayload,
    @Param('inviteId') inviteId: string,
  ) {
    return this.team.resendInvite(user.workspaceId, inviteId);
  }

  @Delete('invites/:inviteId')
  @UseGuards(RolesGuard)
  @Roles(MemberRole.OWNER)
  @HttpCode(HttpStatus.OK)
  revokeInvite(
    @CurrentUser() user: JwtPayload,
    @Param('inviteId') inviteId: string,
  ) {
    return this.team.revokeInvite(user.workspaceId, inviteId);
  }
}

/* ====================================================================
 * INVITE CONTROLLER  —  /invites/*
 * Public-ish: requires auth but NOT owner role.
 * The invitee must be logged in (or register first) before accepting.
 * ==================================================================== */

@Controller('invites')
export class InviteController {
  constructor(private readonly team: TeamService) {}

  /**
   * GET /invites/info?token=xxx
   * PUBLIC — no auth required.
   * Returns workspace name + role so the frontend can show the
   * invite details before the user logs in and clicks "Accept".
   */
  @Get('info')
  getInviteInfo(@Query('token') token: string) {
    return this.team.getInviteByToken(token);
  }

  /**
   * POST /invites/accept
   * Requires auth — the invitee must be logged in to accept.
   */
  @Post('accept')
  @UseGuards(JwtAuthGuard)
  acceptInvite(
    @CurrentUser() user: JwtPayload,
    @Body() body: { token: string },
  ) {
    return this.team.acceptInvite(body.token, user.sub);
  }
}