import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { randomBytes } from 'crypto';

@Injectable()
export class PrivateGroupsService {
  constructor(private prisma: PrismaService) {}

  // Generate a unique PAI-XXXX code
  private generateCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'PAI-';
    const bytes = randomBytes(4);
    for (let i = 0; i < 4; i++) {
      code += chars[bytes[i] % chars.length];
    }
    return code;
  }

  // POST /private-groups/request
  async createRequest(workspaceId: string) {
    // Expire any old pending requests for this workspace
    await this.prisma.privateGroupRequest.updateMany({
      where: { workspaceId, status: 'PENDING' },
      data:  { status: 'EXPIRED' },
    });

    // Generate unique code
    let code: string;
    let attempts = 0;
    while (true) {
      code = this.generateCode();
      const exists = await this.prisma.privateGroupRequest.findUnique({ where: { code } });
      if (!exists) break;
      if (++attempts > 10) throw new Error('Failed to generate unique code');
    }

    const request = await this.prisma.privateGroupRequest.create({
      data: {
        workspaceId,
        code,
        status:    'PENDING',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
      },
    });

    return {
      code:      request.code,
      expiresAt: request.expiresAt,
      phoneNumber: process.env.PRIVATE_INGESTION_PHONE, // second number
    };
  }

  // Called by Baileys when PAI-XXXX code detected
  async linkGroup(code: string, groupJid: string, groupName: string) {
    const request = await this.prisma.privateGroupRequest.findUnique({
      where: { code },
    });

    if (!request) return null;
    if (request.status !== 'PENDING') return null;
    if (request.expiresAt < new Date()) {
      await this.prisma.privateGroupRequest.update({
        where: { id: request.id },
        data:  { status: 'EXPIRED' },
      });
      return null;
    }

    // Link group to workspace
    await this.prisma.$transaction(async (tx) => {
      // Update request
      await tx.privateGroupRequest.update({
        where: { id: request.id },
        data:  { status: 'LINKED', groupJid, groupName },
      });

      // Find or create IngestionGroup and mark private
      const existing = await tx.ingestionGroup.findFirst({
        where: { groupJid },
      });

      if (existing) {
        await tx.ingestionGroup.update({
          where: { id: existing.id },
          data:  { isPrivate: true, workspaceId: request.workspaceId },
        });
      }

      // Create GroupSubscription for this workspace
      if (existing) {
        await tx.groupSubscription.upsert({
          where: {
            groupId_workspaceId: {
              groupId:     existing.id,
              workspaceId: request.workspaceId,
            },
          },
          create: {
            groupId:     existing.id,
            workspaceId: request.workspaceId,
            active:      true,
          },
          update: { active: true },
        });
      }
    });

    return { success: true, workspaceId: request.workspaceId, groupJid, groupName };
  }

  // GET /private-groups — broker sees his private groups
  async getPrivateGroups(workspaceId: string) {
    const requests = await this.prisma.privateGroupRequest.findMany({
      where:   { workspaceId, status: 'LINKED' },
      orderBy: { createdAt: 'desc' },
    });

    return requests;
  }

  // GET /private-groups/pending — check if pending request exists
  async getPendingRequest(workspaceId: string) {
    const request = await this.prisma.privateGroupRequest.findFirst({
        where: { workspaceId, status: 'PENDING', expiresAt: { gt: new Date() } },
    });
    return request ?? {};
    }
}