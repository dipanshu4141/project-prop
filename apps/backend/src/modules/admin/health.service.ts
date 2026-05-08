import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  async getPlatformHealth() {
    const now = new Date();

    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const start7d = new Date(now);
    start7d.setDate(now.getDate() - 7);

    const start30d = new Date(now);
    start30d.setDate(now.getDate() - 30);

    const endOfWeek = new Date(now);
    endOfWeek.setDate(now.getDate() + 7);

    // ── Signups ────────────────────────────────────────────────────────────
    const [signupsToday, signups7d, signups30d] = await Promise.all([
      this.prisma.user.count({ where: { createdAt: { gte: startOfToday } } }),
      this.prisma.user.count({ where: { createdAt: { gte: start7d } } }),
      this.prisma.user.count({ where: { createdAt: { gte: start30d } } }),
    ]);

    // ── Active workspaces — any ClientEvent, new listing, or new client in last 7d
    const [activeEventRows, recentListingWorkspaces, recentClientWorkspaces] = await Promise.all([
      this.prisma.clientEvent.groupBy({
        by: ['clientId'],
        where: { createdAt: { gte: start7d } },
      }),
      this.prisma.workspaceListing.findMany({
        where: { createdAt: { gte: start7d } },
        select: { workspaceId: true },
        distinct: ['workspaceId'],
      }),
      this.prisma.client.findMany({
        where: { createdAt: { gte: start7d } },
        select: { workspaceId: true },
        distinct: ['workspaceId'],
      }),
    ]);

    const activeClientIds = activeEventRows.map((r) => r.clientId);
    const clientEventWorkspaces = activeClientIds.length > 0
      ? await this.prisma.client.findMany({
          where: { id: { in: activeClientIds } },
          select: { workspaceId: true },
          distinct: ['workspaceId'],
        })
      : [];

    const activeWorkspaceIds = [
      ...new Set([
        ...clientEventWorkspaces.map((c) => c.workspaceId),
        ...recentListingWorkspaces.map((l) => l.workspaceId),
        ...recentClientWorkspaces.map((c) => c.workspaceId),
      ]),
    ];

    // ── Activity counts (30d) — real tables ───────────────────────────────
    const [newProperties, clientsAdded, sharePortalsSent, sharePortalsViewed] =
      await Promise.all([
        this.prisma.canonicalProperty.count({ where: { createdAt: { gte: start30d } } }),
        this.prisma.client.count({ where: { createdAt: { gte: start30d } } }),
        this.prisma.clientShareToken.count({ where: { createdAt: { gte: start30d } } }),
        this.prisma.clientEvent.count({
          where: { type: 'PORTAL_VIEWED', createdAt: { gte: start30d } },
        }),
      ]);

    // Messages from WhatsApp ingestion — graceful fallback
    const messagesIngested = await this.prisma.globalMessageCache
      .count({ where: { createdAt: { gte: start30d } } })
      .catch(() => 0);


    // ── All workspaces ────────────────────────────────────────────────────
    const allWorkspaces = await this.prisma.workspace.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        createdAt: true,
        subscription: { select: { plan: true, status: true, trialEndsAt: true } },
        members: {
          select: { user: { select: { email: true } } },
          where: { role: 'OWNER' },
          take: 1,
        },
      },
    });

    const atRiskWorkspaces = allWorkspaces
      .filter((ws) => !activeWorkspaceIds.includes(ws.id))
      .map((ws) => ({
        id:         ws.id,
        name:       ws.name,
        slug:       ws.slug,
        ownerEmail: ws.members[0]?.user?.email ?? null,
        plan:       ws.subscription?.plan ?? 'FREE',
        createdAt:  ws.createdAt,
      }));

    // ── Trials ending this week ───────────────────────────────────────────
    const trialsEndingThisWeek = await this.prisma.subscription.findMany({
      where: { trialEndsAt: { gte: now, lte: endOfWeek }, status: 'TRIALING' },
      select: {
        trialEndsAt: true,
        plan: true,
        workspace: {
          select: {
            id: true, name: true, slug: true,
            members: {
              select: { user: { select: { email: true } } },
              where: { role: 'OWNER' },
              take: 1,
            },
          },
        },
      },
    });

    return {
      signups: { today: signupsToday, last7d: signups7d, last30d: signups30d },
      workspaces: { total: allWorkspaces.length, activeLast7d: activeWorkspaceIds.length },
      activity30d: { messagesIngested, newProperties, clientsAdded, sharePortalsSent, sharePortalsViewed },
      atRisk: atRiskWorkspaces,
      trialsEndingThisWeek: trialsEndingThisWeek.map((s) => ({
        workspaceId:   s.workspace.id,
        workspaceName: s.workspace.name,
        workspaceSlug: s.workspace.slug,
        ownerEmail:    s.workspace.members[0]?.user?.email ?? null,
        plan:          s.plan,
        trialEndsAt:   s.trialEndsAt,
      })),
      generatedAt: now,
    };
  }
}