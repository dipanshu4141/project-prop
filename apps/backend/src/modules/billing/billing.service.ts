import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import Razorpay from 'razorpay';
import * as crypto from 'crypto';

const PLAN_AMOUNT = 99900; // ₹999 in paise

@Injectable()
export class BillingService {
  private razorpay: Razorpay;

  constructor(private prisma: PrismaService) {
    this.razorpay = new Razorpay({
      key_id:     process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });
  }

  // ── Get subscription status ──────────────────────────────────────────────

  async getStatus(workspaceId: string) {
    const sub = await this.prisma.subscription.findUnique({
      where: { workspaceId },
    });

    if (!sub) return { status: 'NONE', trialEndsAt: null, daysLeft: 0 };

    const now = new Date();

    if (sub.status === 'TRIALING' && sub.trialEndsAt) {
      const daysLeft = Math.ceil(
        (sub.trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      );
      return {
        status:      'TRIALING',
        trialEndsAt: sub.trialEndsAt,
        daysLeft:    Math.max(0, daysLeft),
        isExpired:   daysLeft <= 0,
      };
    }

    if (sub.status === 'ACTIVE') {
      return {
        status:             'ACTIVE',
        trialEndsAt:        null,
        daysLeft:           null,
        currentPeriodEnd:   sub.currentPeriodEnd,
        gatewaySubscriptionId: sub.gatewaySubscriptionId,
      };
    }

    return {
      status:    sub.status,
      trialEndsAt: sub.trialEndsAt,
      daysLeft:  0,
      isExpired: true,
    };
  }

  // ── Create Razorpay subscription ─────────────────────────────────────────

  async createSubscription(workspaceId: string, userId: string) {
    const sub = await this.prisma.subscription.findUnique({
      where: { workspaceId },
    });

    if (sub?.status === 'ACTIVE') {
      throw new BadRequestException('Already subscribed');
    }

    // Get user email for Razorpay customer
    const user = await this.prisma.user.findUnique({
      where:  { id: userId },
      select: { email: true, name: true, phone: true },
    });
    if (!user) throw new NotFoundException('User not found');

    // Create Razorpay subscription
    const rzpSub = await (this.razorpay.subscriptions as any).create({
      plan_id:         process.env.RAZORPAY_PLAN_ID!,
      total_count:     120, // 10 years max
      quantity:        1,
      customer_notify: 1,
      notes: {
        workspaceId,
        userId,
      },
    });

    // Update subscription in DB
    await this.prisma.subscription.upsert({
      where:  { workspaceId },
      create: {
        workspaceId,
        plan:     'INDIVIDUAL',
        status:   'TRIALING',
        interval: 'MONTHLY',
        gatewaySubscriptionId: rzpSub.id,
        trialEndsAt: sub?.trialEndsAt ?? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        seats:    1,
        seatsUsed: 1,
      },
      update: {
        gatewaySubscriptionId: rzpSub.id,
      },
    });

    return {
      subscriptionId: rzpSub.id,
      keyId:          process.env.RAZORPAY_KEY_ID,
      amount:         PLAN_AMOUNT,
      currency:       'INR',
      name:           'PropertyAI Pro',
      description:    '₹999/month — WhatsApp property management',
      prefill: {
        name:  user.name  ?? '',
        email: user.email ?? '',
        contact: user.phone ?? '',
      },
    };
  }

  // ── Verify payment after checkout ────────────────────────────────────────

  async verifyPayment(
    workspaceId: string,
    data: {
      razorpay_payment_id:    string;
      razorpay_subscription_id: string;
      razorpay_signature:     string;
    },
  ) {
    // Verify signature
    const body      = `${data.razorpay_payment_id}|${data.razorpay_subscription_id}`;
    const expected  = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(body)
      .digest('hex');

    if (expected !== data.razorpay_signature) {
      throw new BadRequestException('Invalid payment signature');
    }

    // Activate subscription
    await this.prisma.subscription.update({
      where: { workspaceId },
      data: {
        status:              'ACTIVE',
        gatewayPaymentId:    data.razorpay_payment_id,
        currentPeriodStart:  new Date(),
        currentPeriodEnd:    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    await this.prisma.workspace.update({
      where: { id: workspaceId },
      data:  { plan: 'INDIVIDUAL' },
    });

    return { success: true };
  }

  // ── Razorpay Webhook ─────────────────────────────────────────────────────

  async handleWebhook(rawBody: Buffer, signature: string) {
    // Verify webhook signature
    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET!)
      .update(rawBody)
      .digest('hex');

    if (expected !== signature) {
      throw new BadRequestException('Invalid webhook signature');
    }

    const event = JSON.parse(rawBody.toString());
    const { workspaceId } = event.payload?.subscription?.entity?.notes ?? {};

    if (!workspaceId) return { received: true };

    switch (event.event) {
      case 'subscription.charged':
        // Recurring payment succeeded
        await this.prisma.subscription.update({
          where: { workspaceId },
          data: {
            status:             'ACTIVE',
            currentPeriodStart: new Date(),
            currentPeriodEnd:   new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        });
        // Record invoice
        await this.prisma.invoice.create({
          data: {
            workspaceId,
            amount:   PLAN_AMOUNT,
            currency: 'INR',
            status:   'PAID',
            paidAt:   new Date(),
            gatewayPaymentId: event.payload?.payment?.entity?.id,
          },
        });
        break;

      case 'subscription.halted':
      case 'subscription.cancelled':
        await this.prisma.subscription.update({
          where: { workspaceId },
          data:  { status: 'CANCELLED', cancelledAt: new Date() },
        });
        await this.prisma.workspace.update({
          where: { id: workspaceId },
          data:  { plan: 'FREE' },
        });
        break;

      case 'subscription.pending':
        // Payment failed — grace period
        await this.prisma.subscription.update({
          where: { workspaceId },
          data:  { status: 'PAST_DUE' },
        });
        break;
    }

    return { received: true };
  }

  // ── Cancel subscription ──────────────────────────────────────────────────

  async cancelSubscription(workspaceId: string) {
    const sub = await this.prisma.subscription.findUnique({
      where: { workspaceId },
    });
    if (!sub?.gatewaySubscriptionId) {
      throw new NotFoundException('No active subscription');
    }

    await (this.razorpay.subscriptions as any).cancel(
      sub.gatewaySubscriptionId,
      { cancel_at_cycle_end: 1 }, // cancel at end of billing period
    );

    await this.prisma.subscription.update({
      where: { workspaceId },
      data:  { cancelledAt: new Date() },
    });

    return { cancelled: true };
  }

  // ── Trial expiry check (called by cron) ──────────────────────────────────

  async expireTrials() {
    const expired = await this.prisma.subscription.findMany({
      where: {
        status:      'TRIALING',
        trialEndsAt: { lte: new Date() },
      },
      select: { workspaceId: true },
    });

    for (const sub of expired) {
      await this.prisma.subscription.update({
        where: { workspaceId: sub.workspaceId },
        data:  { status: 'PAST_DUE' },
      });
    }

    return { expired: expired.length };
  }
}