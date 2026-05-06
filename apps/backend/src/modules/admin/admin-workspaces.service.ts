// apps/backend/src/modules/admin/admin-workspaces.service.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';

export interface WorkspacesQuery {
  page?:    number;
  limit?:   number;
  q?:       string;
  type?:    string;
  plan?:    string;
  active?:  string; // 'true' | 'false'
}

@Injectable()
export class AdminWorkspacesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: WorkspacesQuery) {
    const { page = 1, limit = 20, q, type, plan, active } = query;
    const skip = (Math.max(1, page) - 1) * limit;

    const where: any = {};

    if (q) {
      where.OR = [
        { name:  { contains: q, mode: 'insensitive' } },
        { slug:  { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { city:  { contains: q, mode: 'insensitive' } },
      ];
    }
    if (type)            where.type     = type;
    if (plan)            where.plan     = plan;
    if (active === 'true')  where.isActive = true;
    if (active === 'false') where.isActive = false;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.workspace.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id:              true,
          name:            true,
          slug:            true,
          type:            true,
          email:           true,
          phone:           true,
          city:            true,
          plan:            true,
          isActive:        true,
          suspendedAt:     true,
          suspendedReason: true,
          logoUrl:         true,
          createdAt:       true,
          _count: {
            select: {
              members:  true,
              listings: true,
              clients:  true,
            },
          },
          subscription: {
            select: {
              status:   true,
              interval: true,
              seats:    true,
              seatsUsed: true,
              trialEndsAt: true,
              currentPeriodEnd: true,
            },
          },
        },
      }),
      this.prisma.workspace.count({ where }),
    ]);

    return {
      items: items.map((w) => ({
        ...w,
        memberCount:  w._count.members,
        listingCount: w._count.listings,
        clientCount:  w._count.clients,
        _count: undefined,
      })),
      total,
      pages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: {
              select: {
                id:        true,
                name:      true,
                email:     true,
                avatarUrl: true,
                isActive:  true,
                createdAt: true,
              },
            },
          },
          orderBy: { joinedAt: 'asc' },
        },
        subscription: true,
        invoices: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        _count: {
          select: {
            listings: true,
            clients:  true,
            agents:   true,
          },
        },
      },
    });
    if (!workspace) throw new NotFoundException('Workspace not found');
    return workspace;
  }

  async suspend(id: string, reason: string) {
    const w = await this.prisma.workspace.findUnique({ where: { id }, select: { id: true } });
    if (!w) throw new NotFoundException('Workspace not found');
    return this.prisma.workspace.update({
      where: { id },
      data: {
        isActive:        false,
        suspendedAt:     new Date(),
        suspendedReason: reason ?? 'Suspended by admin',
      },
      select: { id: true, isActive: true, suspendedAt: true, suspendedReason: true },
    });
  }

  async unsuspend(id: string) {
    const w = await this.prisma.workspace.findUnique({ where: { id }, select: { id: true } });
    if (!w) throw new NotFoundException('Workspace not found');
    return this.prisma.workspace.update({
      where: { id },
      data: {
        isActive:        true,
        suspendedAt:     null,
        suspendedReason: null,
      },
      select: { id: true, isActive: true },
    });
  }
}