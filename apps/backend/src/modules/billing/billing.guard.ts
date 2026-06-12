import {
  Injectable, CanActivate, ExecutionContext, ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class BillingGuard implements CanActivate {
  constructor(
    private prisma:    PrismaService,
    private reflector: Reflector,
    private jwt:       JwtService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
  const req = context.switchToHttp().getRequest();
  
  // DEBUG — remove after fixing
  console.log('[BillingGuard] fired, path:', req.path, 'cookies:', req.cookies);
    const skip = this.reflector.getAllAndOverride<boolean>('skipBilling', [
        context.getHandler(),
        context.getClass(),
    ]);
    if (skip) return true;

    const token = req.cookies?.access_token;
    if (!token) return true;

 let payload: any;
    try {
    // Use decode instead of verify — we only need workspaceId, not full validation
    // JwtAuthGuard handles full token validation including expiry
    payload = this.jwt.decode(token);
    } catch {
    return true;
    }

if (!payload) return true;

    const workspaceId  = payload?.workspaceId;
    const platformRole = payload?.platformRole;

    if (!workspaceId) return true;
    if (platformRole === 'SUPERADMIN' || platformRole === 'SUPPORT') return true;

   const sub = await this.prisma.subscription.findUnique({
        where:  { workspaceId },
        select: { status: true, trialEndsAt: true },
        });

        // ADD THESE TWO LINES:
        console.log('[BillingGuard] sub result:', JSON.stringify(sub));
        console.log('[BillingGuard] trial expired?', sub?.trialEndsAt ? sub.trialEndsAt < new Date() : 'no trialEndsAt');

        if (!sub) return true;
    

    // ── LOG HERE — before any throws ──
    console.log('[BillingGuard]', {
        hasToken:    !!token,
        workspaceId,
        subStatus:   sub?.status,
        trialEndsAt: sub?.trialEndsAt,
        now:         new Date(),
    });

    if (!sub) return true;
    if (sub.status === 'ACTIVE') return true;

    if (sub.status === 'TRIALING') {
        if (!sub.trialEndsAt) return true;
        if (sub.trialEndsAt > new Date()) return true;
        // Trial expired
        throw new ForbiddenException(
        JSON.stringify({ code: 'TRIAL_EXPIRED', message: 'Your trial has expired. Please subscribe to continue.' })
        );
    }

    throw new ForbiddenException(
        JSON.stringify({ code: 'SUBSCRIPTION_REQUIRED', message: 'Active subscription required.' })
    );
    }
}