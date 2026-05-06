// apps/backend/src/modules/dashboard/dashboard.service.ts

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats(workspaceId: string) {
    const now = new Date();

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date(now);
    endOfToday.setHours(23, 59, 59, 999);

    const [
      totalClients,
      activeClients,
      listingsThisMonth,
      dealsInProgress,
      completedDealsThisMonth,
    ] = await this.prisma.$transaction([

      // Total clients in workspace
      this.prisma.client.count({
        where: { workspaceId },
      }),

      // Active clients = have at least one ClientProperty not CLOSED/LOST
      this.prisma.client.count({
        where: {
          workspaceId,
          properties: {
            some: {
              status: { notIn: ['CLOSED', 'LOST'] },
            },
          },
        },
      }),

      // Listings added this month
      this.prisma.workspaceListing.count({
        where: {
          workspaceId,
          createdAt: { gte: startOfMonth },
        },
      }),

      // Deals in progress (not closed)
      this.prisma.propertyDeal.count({
        where: {
          chain: { some: { workspaceId } },
          status: { in: ['INITIATED', 'NEGOTIATING', 'AGREED'] },
        },
      }),

      // Deals completed this month — for commission sum
      this.prisma.propertyDeal.findMany({
        where: {
          chain: { some: { workspaceId } },
          status: 'COMPLETED',
          completedAt: { gte: startOfMonth },
        },
        select: { totalCommission: true },
      }),
    ]);

    // Sum commission earned this month (paise → rupees)
    const commissionPaise = completedDealsThisMonth.reduce(
      (sum, d) => sum + (d.totalCommission ? Number(d.totalCommission) : 0),
      0,
    );
    const commissionRupees = Math.round(commissionPaise / 100);

    return {
      totalClients,
      activeClients,
      listingsThisMonth,
      dealsInProgress,
      commissionThisMonth: commissionRupees,
    };
  }
}