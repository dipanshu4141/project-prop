import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { TeamService } from './team.service';
import { JwtAuthGuard, RolesGuard } from '../../auth/guards/auth.guards';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { JwtPayload } from '../../auth/jwt-payload.interface';
import { MemberRole } from '@prisma/client';

@Controller('team')
@UseGuards(JwtAuthGuard)
export class TeamController {
  constructor(private team: TeamService) {}

  /* ================================================================
   * MEMBERS
   * ================================================================ */

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
    return this.team.updateMemberRole(
      user.workspaceId,
      memberId,
      body.role,
      user.sub,
    );
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

  /* ================================================================
   * INVITES
   * ================================================================ */

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

/* ================================================================
 * INVITE ACCEPT — public-ish route (requires auth, not role)
 * The invitee must be logged in (or register first) before accepting.
 * ================================================================ */

@Controller('invites')
@UseGuards(JwtAuthGuard)
export class InviteController {
  constructor(private team: TeamService) {}

  /**
   * GET /invites/info?token=xxx
   * Fetch invite details so the frontend can show workspace name + role
   * before the user clicks "Accept".
   */
  @Get('info')
  getInviteInfo(@Query('token') token: string) {
    return this.team.getInviteByToken(token);
  }

  /** POST /invites/accept — accept an invite by token */
  @Post('accept')
  acceptInvite(
    @CurrentUser() user: JwtPayload,
    @Body() body: { token: string },
  ) {
    return this.team.acceptInvite(body.token, user.sub);
  }
}