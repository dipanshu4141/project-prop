// apps/backend/src/modules/onboarding/onboarding.service.ts

import {
  Injectable,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';

@Injectable()
export class OnboardingService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Check if user needs onboarding ─────────────────────────────────────────
  // Called on every authenticated request to decide whether to redirect.

  async getStatus(userId: string) {
    const membership = await this.prisma.workspaceMember.findFirst({
      where: { userId },
      select: {
        workspace: {
          select: { id: true, name: true, plan: true, planSelected: true },
        },
      },
    });

    return {
          hasWorkspace:  !!membership,
          workspaceId:   membership?.workspace.id           ?? null,
          workspaceName: membership?.workspace.name         ?? null,
          plan:          membership?.workspace.plan          ?? null,
          planSelected:  membership?.workspace.planSelected ?? false,
        };
  }

  // ── Step 1: Create workspace ────────────────────────────────────────────────

  async createWorkspace(
    userId: string,
    data: {
      name:  string;
      type:  'INDIVIDUAL' | 'FIRM';
      city?: string;
    },
  ) {
    // One workspace per user during onboarding
    const existing = await this.prisma.workspaceMember.findFirst({
      where: { userId },
    });
    if (existing) {
      throw new ConflictException('You already have a workspace');
    }

    // Generate a URL-safe slug from workspace name
    const baseSlug = data.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 40);

    // Ensure slug uniqueness
    let slug = baseSlug;
    let suffix = 1;
    while (await this.prisma.workspace.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${suffix++}`;
    }

    const workspace = await this.prisma.workspace.create({
      data: {
        name:  data.name,
        slug,
        type:  data.type,
        city:  data.city ?? null,
        plan:  'FREE',
        members: {
          create: {
            userId,
            role: 'OWNER',
          },
        },
      },
      select: {
        id:   true,
        name: true,
        slug: true,
        type: true,
        plan: true,
      },
    });

    return workspace;
  }

  // ── Step 2: Select plan ─────────────────────────────────────────────────────
  // Records the plan choice. Actual billing wired separately with Razorpay.

  async selectPlan(
    userId:      string,
    plan:        string,
    interval:    'MONTHLY' | 'ANNUAL' = 'MONTHLY',
  ) {
    const membership = await this.prisma.workspaceMember.findFirst({
      where: { userId, role: 'OWNER' },
      select: { workspaceId: true },
    });

    if (!membership) {
      throw new BadRequestException('Complete workspace setup first');
    }

    const { workspaceId } = membership;

    const VALID_PLANS = ['FREE', 'INDIVIDUAL', 'FIRM_5', 'FIRM_20', 'ENTERPRISE'];
    if (!VALID_PLANS.includes(plan)) {
      throw new BadRequestException(`Invalid plan. Choose: ${VALID_PLANS.join(', ')}`);
    }

    // Update workspace plan
    await this.prisma.workspace.update({
      where: { id: workspaceId },
      data:  { plan, planSelected: true },
    });

    // Create or update subscription record
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 14); // 14-day trial

    await this.prisma.subscription.upsert({
      where:  { workspaceId },
      create: {
        workspaceId,
        plan,
        status:   plan === 'FREE' ? 'ACTIVE' : 'TRIALING',
        interval,
        trialEndsAt: plan === 'FREE' ? null : trialEndsAt,
        seats:    this.seatsForPlan(plan),
        seatsUsed: 1,
      },
      update: {
        plan,
        interval,
        status:   plan === 'FREE' ? 'ACTIVE' : 'TRIALING',
        trialEndsAt: plan === 'FREE' ? null : trialEndsAt,
        seats:    this.seatsForPlan(plan),
      },
    });

    return { workspaceId, plan, interval };
  }

  // ── Step 3: Invite team members ─────────────────────────────────────────────
  // Creates pending invites. Actual email sending wired separately.

  async inviteMembers(
    userId:  string,
    emails:  string[],
  ) {
    const membership = await this.prisma.workspaceMember.findFirst({
      where: { userId, role: 'OWNER' },
      select: { workspaceId: true },
    });

    if (!membership) {
      throw new BadRequestException('Complete workspace setup first');
    }

    const { workspaceId } = membership;

    // Deduplicate and validate
    const uniqueEmails = [...new Set(emails.map((e) => e.toLowerCase().trim()))].filter(Boolean);
    if (uniqueEmails.length === 0) return { invited: [] };

    // Check seat limit
    const workspace = await this.prisma.workspace.findUnique({
      where:  { id: workspaceId },
      select: { plan: true },
    });
    const maxSeats = this.seatsForPlan(workspace?.plan ?? 'FREE');
    const current  = await this.prisma.workspaceMember.count({ where: { workspaceId } });
    const pending  = await this.prisma.workspaceInvite.count({
      where: { workspaceId, status: 'PENDING' },
    });
    if (current + pending + uniqueEmails.length > maxSeats) {
      throw new BadRequestException(
        `Your plan allows ${maxSeats} seats. You have ${current + pending} used/pending.`,
      );
    }

    // Create invites
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const created = await Promise.all(
      uniqueEmails.map((email) =>
        this.prisma.workspaceInvite.upsert({
          where:  { token: `${workspaceId}-${email}` }, // temp unique key
          create: {
            workspaceId,
            email,
            role:       'BROKER',
            token:      `${workspaceId}-${email}-${Date.now()}`,
            status:     'PENDING',
            expiresAt,
            invitedById: userId,
          },
          update: {
            status:   'PENDING',
            expiresAt,
          },
        }),
      ),
    );

    return { invited: created.map((i) => i.email) };
  }

  // ── Helper ──────────────────────────────────────────────────────────────────

  private seatsForPlan(plan: string): number {
    const map: Record<string, number> = {
      FREE:       1,
      INDIVIDUAL: 1,
      FIRM_5:     5,
      FIRM_20:    20,
      ENTERPRISE: 999,
    };
    return map[plan] ?? 1;
  }
}