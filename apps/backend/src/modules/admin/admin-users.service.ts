// apps/backend/src/modules/admin/admin-users.service.ts

import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';

export interface UsersQuery {
  page?:         number;
  limit?:        number;
  q?:            string;
  platformRole?: string;
  active?:       string;
}

const ALLOWED_ROLES = ['USER', 'SUPPORT', 'SUPERADMIN'];

@Injectable()
export class AdminUsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: UsersQuery) {
    const { page = 1, limit = 20, q, platformRole, active } = query;
    const skip = (Math.max(1, page) - 1) * limit;

    const where: any = {};

    if (q) {
      where.OR = [
        { name:  { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q, mode: 'insensitive' } },
      ];
    }
    if (platformRole)        where.platformRole = platformRole;
    if (active === 'true')   where.isActive = true;
    if (active === 'false')  where.isActive = false;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id:              true,
          name:            true,
          email:           true,
          phone:           true,
          avatarUrl:       true,
          platformRole:    true,
          emailVerified:   true,
          isActive:        true,
          deactivatedAt:   true,
          createdAt:       true,
          memberships: {
            select: {
              role:      true,
              joinedAt:  true,
              workspace: {
                select: { id: true, name: true, slug: true, plan: true },
              },
            },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { items, total, pages: Math.ceil(total / limit) };
  }

  async setPlatformRole(id: string, role: string) {
    if (!ALLOWED_ROLES.includes(role)) {
      throw new BadRequestException(`Invalid role. Must be one of: ${ALLOWED_ROLES.join(', ')}`);
    }
    const user = await this.prisma.user.findUnique({ where: { id }, select: { id: true } });
    if (!user) throw new NotFoundException('User not found');

    return this.prisma.user.update({
      where: { id },
      data:  { platformRole: role as any },
      select: { id: true, platformRole: true },
    });
  }

  async deactivate(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id }, select: { id: true } });
    if (!user) throw new NotFoundException('User not found');
    return this.prisma.user.update({
      where: { id },
      data:  { isActive: false, deactivatedAt: new Date() },
      select: { id: true, isActive: true, deactivatedAt: true },
    });
  }

  async activate(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id }, select: { id: true } });
    if (!user) throw new NotFoundException('User not found');
    return this.prisma.user.update({
      where: { id },
      data:  { isActive: true, deactivatedAt: null },
      select: { id: true, isActive: true },
    });
  }
}