import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  /* ================================================================
   * PLATFORM STATS — the overview numbers on /admin
   * ================================================================ */

  async getPlatformStats() {
    const [
      totalWorkspaces,
      activeWorkspaces,
      totalUsers,
      totalListings,
      totalClients,
      totalAgents,
      totalDeals,
      recentWorkspaces,
      usageToday,
    ] = await Promise.all([
      this.prisma.workspace.count(),
      this.prisma.workspace.count({ where: { isActive: true } }),
      this.prisma.user.count({ where: { isActive: true } }),
      this.prisma.workspaceListing.count(),
      this.prisma.client.count(),
      this.prisma.agent.count({ where: { isMerged: false } }),
      this.prisma.propertyDeal.count(),

      // Workspaces created in last 30 days
      this.prisma.workspace.count({
        where: { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
      }),

      // Usage events fired today
      this.prisma.usageEvent.count({
        where: { occurredAt: { gte: startOfDay(new Date()) } },
      }),
    ]);

    // Workspaces by plan
    const byPlan = await this.prisma.workspace.groupBy({
      by:     ['plan'],
      _count: { id: true },
    });

    // Workspaces by type
    const byType = await this.prisma.workspace.groupBy({
      by:     ['type'],
      _count: { id: true },
    });

    // Daily new workspaces — last 14 days
    const last14 = await this.prisma.$queryRaw<{ date: string; count: bigint }[]>`
      SELECT DATE(created_at)::text AS date, COUNT(*)::bigint AS count
      FROM "Workspace"
      WHERE created_at >= NOW() - INTERVAL '14 days'
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;

    return {
      totalWorkspaces,
      activeWorkspaces,
      suspendedWorkspaces: totalWorkspaces - activeWorkspaces,
      totalUsers,
      totalListings,
      totalClients,
      totalAgents,
      totalDeals,
      recentWorkspaces,      // last 30 days
      usageToday,
      byPlan:  byPlan.map((r)  => ({ plan: r.plan,  count: r._count.id })),
      byType:  byType.map((r)  => ({ type: r.type,  count: r._count.id })),
      last14:  last14.map((r)  => ({ date: r.date,  count: Number(r.count) })),
    };
  }

  /* ================================================================
   * ALL WORKSPACES — paginated, searchable, filterable
   * ================================================================ */

  async getWorkspaces(params: {
    page?:    number;
    limit?:   number;
    q?:       string;
    plan?:    string;
    type?:    string;
    active?:  string;
    sortBy?:  string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const page      = Math.max(params.page  ?? 1, 1);
    const limit     = Math.min(params.limit ?? 20, 100);
    const skip      = (page - 1) * limit;
    const sortOrder = params.sortOrder ?? 'desc';

    const where: Prisma.WorkspaceWhereInput = {
      ...(params.q ? {
        OR: [
          { name:  { contains: params.q, mode: 'insensitive' } },
          { slug:  { contains: params.q, mode: 'insensitive' } },
          { email: { contains: params.q, mode: 'insensitive' } },
        ],
      } : {}),
      ...(params.plan   ? { plan:     params.plan              } : {}),
      ...(params.type   ? { type:     params.type as any        } : {}),
      ...(params.active !== undefined
        ? { isActive: params.active === 'true' }
        : {}),
    };

    const orderBy: Prisma.WorkspaceOrderByWithRelationInput =
      params.sortBy === 'name'    ? { name:      sortOrder } :
      params.sortBy === 'plan'    ? { plan:      sortOrder } :
                                    { createdAt: sortOrder };

    // Replace the getWorkspaces $transaction block with two separate calls:
    const [rows, total] = await Promise.all([
      this.prisma.workspace.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          _count: {
            select: {
              members:  true,
              listings: true,   // ← was "properties"
              clients:  true,
              agents:   true,
            },
          },
          subscription: {
            select: { status: true, plan: true, trialEndsAt: true, currentPeriodEnd: true },
          },
        },
      }),
      this.prisma.workspace.count({ where }),
    ]);

    const items = rows.map((w) => ({
      id:          w.id,
      name:        w.name,
      slug:        w.slug,
      type:        w.type,
      plan:        w.plan,
      isActive:    w.isActive,
      email:       w.email,
      city:        w.city,
      createdAt:   w.createdAt,
      memberCount:   w._count.members,
      listingCount:  w._count.listings,
      clientCount:   w._count.clients,
      agentCount:    w._count.agents,
      subscription:  w.subscription,
    }));

    return {
      items,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  /* ================================================================
   * SINGLE WORKSPACE — full detail view
   * ================================================================ */

  async getWorkspace(workspaceId: string) {
    const workspace = await this.prisma.workspace.findUnique({
      where:   { id: workspaceId },
      include: {
        members: {
          include: { user: { select: { id: true, email: true, name: true, platformRole: true, isActive: true, createdAt: true } } },
          orderBy: { joinedAt: 'asc' },
        },
        subscription: true,
        invoices: {
          orderBy: { createdAt: 'desc' },
          take:    5,
        },
        _count: {
          select: { listings: true, clients: true, agents: true },
        },
      },
    });

    if (!workspace) throw new NotFoundException('Workspace not found');

    // Recent listings
    const recentListings = await this.prisma.workspaceListing.findMany({
      where:   { workspaceId },
      orderBy: { createdAt: 'desc' },
      take:    10,
      select: {
        id: true, bhk: true, propertySubType: true,
        city: true, area: true, price: true,
        status: true, createdAt: true,
      },
    });

    // Recent usage events
    const recentUsage = await this.prisma.usageEvent.findMany({
      where:   { workspaceId },
      orderBy: { occurredAt: 'desc' },
      take:    20,
      select:  { event: true, occurredAt: true, userId: true },
    });

    // Usage breakdown last 30 days
    const usageBreakdown = await this.prisma.usageEvent.groupBy({
      by:     ['event'],
      where:  {
        workspaceId,
        occurredAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
      _count: { event: true },
      orderBy: { _count: { event: 'desc' } },
      take:   10,
    });

    return {
      ...workspace,
      recentListings: recentListings.map((l) => ({
        ...l,
        price: l.price ? l.price.toString() : null,
      })),
      recentUsage,
      usageBreakdown: usageBreakdown.map((u) => ({
        event: u.event,
        count: u._count.event,
      })),
    };
  }

  /* ================================================================
   * SUSPEND / REACTIVATE WORKSPACE
   * ================================================================ */

  async setWorkspaceActive(workspaceId: string, isActive: boolean, reason?: string, adminUserId?: string) {
    const workspace = await this.prisma.workspace.update({
      where: { id: workspaceId },
      data: {
        isActive,
        suspendedAt:     isActive ? null : new Date(),
        suspendedReason: isActive ? null : (reason ?? 'Suspended by admin'),
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId:     adminUserId,
        workspaceId,
        action:     isActive ? 'WORKSPACE_REACTIVATED' : 'WORKSPACE_SUSPENDED',
        entity:     'Workspace',
        entityId:   workspaceId,
        after:      { isActive, reason },
      },
    });

    return workspace;
  }

  /* ================================================================
   * ALL USERS — paginated, searchable
   * ================================================================ */

  async getUsers(params: {
    page?:         number;
    limit?:        number;
    q?:            string;
    platformRole?: string;
    active?:       string;
  }) {
    const page  = Math.max(params.page  ?? 1, 1);
    const limit = Math.min(params.limit ?? 20, 100);
    const skip  = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {
      ...(params.q ? {
        OR: [
          { email: { contains: params.q, mode: 'insensitive' } },
          { name:  { contains: params.q, mode: 'insensitive' } },
          { phone: { contains: params.q } },
        ],
      } : {}),
      ...(params.platformRole ? { platformRole: params.platformRole as any } : {}),
      ...(params.active !== undefined ? { isActive: params.active === 'true' } : {}),
    };

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          id: true, email: true, name: true, phone: true,
          platformRole: true, isActive: true, emailVerified: true,
          createdAt: true,
          memberships: {
            select: {
              role: true,
              workspace: { select: { id: true, name: true, type: true, plan: true } },
            },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      items: rows,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  /* ================================================================
   * UPDATE USER (deactivate, change platformRole)
   * ================================================================ */

  async updateUser(
    targetUserId: string,
    dto:          { isActive?: boolean; platformRole?: string },
    adminUserId?: string,
  ) {
    const before = await this.prisma.user.findUnique({ where: { id: targetUserId } });
    if (!before) throw new NotFoundException('User not found');

    const updated = await this.prisma.user.update({
      where: { id: targetUserId },
      data: {
        ...(dto.isActive     !== undefined ? { isActive:     dto.isActive,                  deactivatedAt: dto.isActive ? null : new Date() } : {}),
        ...(dto.platformRole !== undefined ? { platformRole: dto.platformRole as any } : {}),
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId:   adminUserId,
        action:   'USER_UPDATED',
        entity:   'User',
        entityId: targetUserId,
        before:   { isActive: before.isActive, platformRole: before.platformRole },
        after:    dto,
      },
    });

    return { id: updated.id, email: updated.email, isActive: updated.isActive, platformRole: updated.platformRole };
  }

  /* ================================================================
   * SUBSCRIPTION OVERVIEW
   * ================================================================ */

  async getSubscriptionOverview() {
    const [byStatus, byPlan, mrr, trialEnding] = await Promise.all([
      this.prisma.subscription.groupBy({
        by:     ['status'],
        _count: { id: true },
      }),

      this.prisma.subscription.groupBy({
        by:     ['plan'],
        _count: { id: true },
      }),

      // MRR: count ACTIVE subscriptions × plan price (simplified)
      this.prisma.subscription.count({
        where: { status: 'ACTIVE' },
      }),

      // Trials ending in the next 7 days
      this.prisma.subscription.findMany({
        where: {
          status:      'TRIALING',
          trialEndsAt: {
            gte: new Date(),
            lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          },
        },
        include: {
          workspace: { select: { id: true, name: true, email: true, type: true } },
        },
        orderBy: { trialEndsAt: 'asc' },
      }),
    ]);

    return {
      byStatus: byStatus.map((r) => ({ status: r.status, count: r._count.id })),
      byPlan:   byPlan.map((r)   => ({ plan: r.plan,     count: r._count.id })),
      activeSubscriptions: mrr,
      trialEnding,
    };
  }

  /* ================================================================
   * AUDIT LOG — recent platform actions
   * ================================================================ */

  async getAuditLog(params: { page?: number; limit?: number; workspaceId?: string }) {
    const page  = Math.max(params.page  ?? 1, 1);
    const limit = Math.min(params.limit ?? 50, 200);
    const skip  = (page - 1) * limit;

    const where: Prisma.AuditLogWhereInput = params.workspaceId
      ? { workspaceId: params.workspaceId }
      : {};

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      items: rows,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }
}

/* ── Helpers ── */
function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}