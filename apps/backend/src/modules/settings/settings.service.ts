import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  async getMe(userId: string, workspaceId: string) {
    const [user, workspace, subscription] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id:            true,
          name:          true,
          email:         true,
          phone:         true,
          avatarUrl:     true,
          emailVerified: true,
          platformRole:  true,
          createdAt:     true,
          googleId:      true,
          passwordHash:  true,
        },
      }),
      this.prisma.workspace.findUnique({
        where: { id: workspaceId },
        select: { id: true, name: true, slug: true, plan: true, createdAt: true },
      }),
      this.prisma.subscription.findUnique({
        where: { workspaceId },
        select: { status: true, plan: true, trialEndsAt: true, currentPeriodEnd: true, gatewaySubscriptionId: true },
      }),
    ]);

    if (!user) throw new NotFoundException('User not found');

    return {
      user: {
        ...user,
        hasPassword: !!user.passwordHash,
        hasGoogle:   !!user.googleId,
        passwordHash: undefined, // never expose
      },
      workspace,
      subscription,
    };
  }

  async updateProfile(userId: string, data: { name?: string; phone?: string }) {
    if (data.phone) {
      const existing = await this.prisma.user.findFirst({
        where: { phone: data.phone, NOT: { id: userId } },
      });
      if (existing) throw new BadRequestException('This phone number is already registered');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.name  ? { name:  data.name  } : {}),
        ...(data.phone ? { phone: data.phone } : {}),
      },
      select: { id: true, name: true, email: true, phone: true, avatarUrl: true },
    });
  }

  async updateWorkspace(workspaceId: string, data: { name?: string }) {
    return this.prisma.workspace.update({
      where: { id: workspaceId },
      data:  { name: data.name },
      select: { id: true, name: true, slug: true },
    });
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true, googleId: true },
    });
    if (!user) throw new NotFoundException('User not found');

    if (user.passwordHash) {
      const valid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!valid) throw new BadRequestException('Current password is incorrect');
    }

    if (newPassword.length < 8) throw new BadRequestException('Password must be at least 8 characters');

    const hash = await bcrypt.hash(newPassword, 12);
    await this.prisma.user.update({
      where: { id: userId },
      data:  { passwordHash: hash },
    });

    return { message: 'Password updated successfully' };
  }
}