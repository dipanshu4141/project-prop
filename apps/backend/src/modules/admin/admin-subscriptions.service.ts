// apps/backend/src/modules/admin/admin-subscriptions.service.ts

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';

export interface SubscriptionsQuery {
  page?:   number;
  limit?:  number;
  q?:      string;
  status?: string;
  plan?:   string;
}

@Injectable()
export class AdminSubscriptionsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: SubscriptionsQuery) {
    const { page = 1, limit = 20, q, status, plan } = query;
    const skip = (Math.max(1, page) - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (plan)   where.plan   = plan;
    if (q) {
      where.workspace = {
        OR: [
          { name:  { contains: q, mode: 'insensitive' } },
          { slug:  { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } },
        ],
      };
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.subscription.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          workspace: {
            select: {
              id:      true,
              name:    true,
              slug:    true,
              type:    true,
              email:   true,
              logoUrl: true,
              _count:  { select: { members: true } },
            },
          },
          invoices: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: { amount: true, status: true, paidAt: true },
          },
        },
      }),
      this.prisma.subscription.count({ where }),
    ]);

    return {
      items: items.map((s) => ({
        ...s,
        workspace: {
          ...s.workspace,
          memberCount: s.workspace._count.members,
          _count: undefined,
        },
        lastInvoice: s.invoices[0] ?? null,
        invoices: undefined,
      })),
      total,
      pages: Math.ceil(total / limit),
    };
  }

  async getStats() {
    const [total, trialing, active, pastDue, cancelled] = await this.prisma.$transaction([
      this.prisma.subscription.count(),
      this.prisma.subscription.count({ where: { status: 'TRIALING'  } }),
      this.prisma.subscription.count({ where: { status: 'ACTIVE'    } }),
      this.prisma.subscription.count({ where: { status: 'PAST_DUE'  } }),
      this.prisma.subscription.count({ where: { status: 'CANCELLED' } }),
    ]);
    return { total, trialing, active, pastDue, cancelled };
  }
}