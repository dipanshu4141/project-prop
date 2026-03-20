import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../../core/prisma/prisma.service';
import { EmailService } from './email.service';
import { MemberRole } from '@prisma/client';

@Injectable()
export class TeamService {
  constructor(
    private prisma: PrismaService,
    private email:  EmailService,
  ) {}

  /* ================================================================
   * LIST MEMBERS
   * ================================================================ */

  async getMembers(workspaceId: string) {
    const members = await this.prisma.workspaceMember.findMany({
      where:   { workspaceId },
      orderBy: { joinedAt: 'asc' },
      include: {          // ← change "select" → "include" for nested relation
        user: {
          select: {
            id:        true,
            email:     true,
            name:      true,
            avatarUrl: true,
            isActive:  true,
            createdAt: true,
            // lastActiveAt does NOT exist on User — remove it
          },
        },
      },
    });


    return members.map((m) => ({
      memberId:     m.id,
      role:         m.role,
      joinedAt:     m.joinedAt,
      lastActiveAt: m.lastActiveAt,  // ← this is on WorkspaceMember, not User
      user: {
        id:       m.user.id,
        email:    m.user.email,
        name:     m.user.name,
        isActive: m.user.isActive,
      },
    }));

  }

  /* ================================================================
   * LIST PENDING INVITES
   * ================================================================ */

  async getPendingInvites(workspaceId: string) {
    return this.prisma.workspaceInvite.findMany({
      where: {
        workspaceId,
        status:    'PENDING',
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        invitedBy: { select: { id: true, name: true, email: true } },
      },
    });
  }

  /* ================================================================
   * SEND INVITE
   * ================================================================ */

  async sendInvite(
    workspaceId:  string,
    invitedById:  string,
    email:        string,
    role:         MemberRole = MemberRole.BROKER,
  ) {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
    });
    if (!workspace) throw new NotFoundException('Workspace not found');

    const inviter = await this.prisma.user.findUnique({
      where: { id: invitedById },
      select: { name: true, email: true },
    });

    // Check seat limit
    const sub = await this.prisma.subscription.findUnique({
      where: { workspaceId },
    });
    const currentMembers = await this.prisma.workspaceMember.count({
      where: { workspaceId },
    });
    const pendingCount = await this.prisma.workspaceInvite.count({
      where: { workspaceId, status: 'PENDING', expiresAt: { gt: new Date() } },
    });

    const seats = sub?.seats ?? 1;
    if (currentMembers + pendingCount >= seats) {
      throw new BadRequestException(
        `Seat limit reached (${seats}). Upgrade your plan to invite more brokers.`,
      );
    }

    // Check if user already a member
    const existingUser = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (existingUser) {
      const alreadyMember = await this.prisma.workspaceMember.findUnique({
        where: { workspaceId_userId: { workspaceId, userId: existingUser.id } },
      });
      if (alreadyMember) {
        throw new ConflictException('This person is already a member of your workspace');
      }
    }

    // Revoke any existing pending invite for this email
    await this.prisma.workspaceInvite.updateMany({
      where: { workspaceId, email: email.toLowerCase(), status: 'PENDING' },
      data:  { status: 'REVOKED' },
    });

    // Create new invite
    const token  = crypto.randomBytes(32).toString('hex');
    const invite = await this.prisma.workspaceInvite.create({
      data: {
        workspaceId,
        email:       email.toLowerCase(),
        role,
        token,
        status:      'PENDING',
        expiresAt:   new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        invitedById,
      },
    });

    const inviteUrl = `${process.env.FRONTEND_URL}/invites/accept?token=${token}`;

    // Send email (non-blocking — failure won't crash the request)
    await this.email.sendWorkspaceInvite({
      to:            email,
      invitedBy:     inviter?.name ?? inviter?.email ?? 'Your team',
      workspaceName: workspace.name,
      role,
      inviteUrl,
    });

    // Audit log
    await this.prisma.auditLog.create({
      data: {
        userId:     invitedById,
        workspaceId,
        action:     'MEMBER_INVITED',
        entity:     'WorkspaceInvite',
        entityId:   invite.id,
        after:      { email, role },
      },
    });

    return {
      inviteId:  invite.id,
      inviteUrl, // always return so dev can copy from API response too
      email,
      role,
      expiresAt: invite.expiresAt,
    };
  }

  /* ================================================================
   * REVOKE INVITE
   * ================================================================ */

  async revokeInvite(workspaceId: string, inviteId: string) {
    const invite = await this.prisma.workspaceInvite.findFirst({
      where: { id: inviteId, workspaceId },
    });
    if (!invite) throw new NotFoundException('Invite not found');

    await this.prisma.workspaceInvite.update({
      where: { id: inviteId },
      data:  { status: 'REVOKED' },
    });

    return { success: true };
  }

  /* ================================================================
   * ACCEPT INVITE — called by the invitee from /invites/accept?token=
   * ================================================================ */

  async getInviteByToken(token: string) {
    const invite = await this.prisma.workspaceInvite.findUnique({
      where:   { token },
      include: {
        workspace: { select: { id: true, name: true, type: true } },
        invitedBy: { select: { name: true, email: true } },
      },
    });

    if (!invite)                    throw new NotFoundException('Invite not found');
    if (invite.status !== 'PENDING') throw new BadRequestException('This invite has already been used or revoked');
    if (invite.expiresAt < new Date()) throw new BadRequestException('This invite has expired');

    return invite;
  }

  async acceptInvite(token: string, userId: string) {
    const invite = await this.getInviteByToken(token);

    // Verify the accepting user's email matches the invite
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    if (user.email.toLowerCase() !== invite.email.toLowerCase()) {
      throw new BadRequestException(
        `This invite was sent to ${invite.email}. Please log in with that email to accept.`,
      );
    }

    // Check not already a member
    const existing = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: { workspaceId: invite.workspaceId, userId },
      },
    });
    if (existing) throw new ConflictException('You are already a member of this workspace');

    // Accept in a transaction
    await this.prisma.$transaction(async (tx) => {
      // Add member
      await tx.workspaceMember.create({
        data: {
          workspaceId: invite.workspaceId,
          userId,
          role:      invite.role,
          inviteId:  invite.id,
        },
      });

      // Mark invite accepted
      await tx.workspaceInvite.update({
        where: { id: invite.id },
        data:  { status: 'ACCEPTED', acceptedAt: new Date() },
      });

      // Update seats used
      await tx.subscription.updateMany({
        where: { workspaceId: invite.workspaceId },
        data:  { seatsUsed: { increment: 1 } },
      });

      // Audit log
      await tx.auditLog.create({
        data: {
          userId,
          workspaceId: invite.workspaceId,
          action:      'MEMBER_JOINED',
          entity:      'WorkspaceMember',
          after:       { role: invite.role, via: 'invite' },
        },
      });
    });

    return {
      workspaceId:   invite.workspaceId,
      workspaceName: invite.workspace.name,
      role:          invite.role,
    };
  }

  /* ================================================================
   * UPDATE MEMBER ROLE
   * ================================================================ */

  async updateMemberRole(
    workspaceId: string,
    memberId:    string,
    role:        MemberRole,
    requesterId: string,
  ) {
    const member = await this.prisma.workspaceMember.findFirst({
      where: { id: memberId, workspaceId },
    });
    if (!member) throw new NotFoundException('Member not found');

    // Can't demote yourself if you're the only owner
    if (member.userId === requesterId && role !== MemberRole.OWNER) {
      const ownerCount = await this.prisma.workspaceMember.count({
        where: { workspaceId, role: MemberRole.OWNER },
      });
      if (ownerCount <= 1) {
        throw new BadRequestException('Cannot demote the only owner of a workspace');
      }
    }

    const updated = await this.prisma.workspaceMember.update({
      where: { id: memberId },
      data:  { role },
      include: { user: { select: { email: true, name: true } } },
    });

    await this.prisma.auditLog.create({
      data: {
        userId:     requesterId,
        workspaceId,
        action:     'MEMBER_ROLE_CHANGED',
        entity:     'WorkspaceMember',
        entityId:   memberId,
        before:     { role: member.role },
        after:      { role },
      },
    });

    return updated;
  }

  /* ================================================================
   * REMOVE MEMBER
   * ================================================================ */

  async removeMember(
    workspaceId: string,
    memberId:    string,
    requesterId: string,
  ) {
    const member = await this.prisma.workspaceMember.findFirst({
      where: { id: memberId, workspaceId },
    });
    if (!member) throw new NotFoundException('Member not found');

    // Can't remove yourself if you're the only owner
    if (member.role === MemberRole.OWNER) {
      const ownerCount = await this.prisma.workspaceMember.count({
        where: { workspaceId, role: MemberRole.OWNER },
      });
      if (ownerCount <= 1) {
        throw new BadRequestException('Cannot remove the only owner of a workspace');
      }
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.workspaceMember.delete({ where: { id: memberId } });

      await tx.subscription.updateMany({
        where: { workspaceId },
        data:  { seatsUsed: { decrement: 1 } },
      });

      await tx.auditLog.create({
        data: {
          userId:     requesterId,
          workspaceId,
          action:     'MEMBER_REMOVED',
          entity:     'WorkspaceMember',
          entityId:   memberId,
          before:     { role: member.role, userId: member.userId },
        },
      });
    });

    return { success: true };
  }
}