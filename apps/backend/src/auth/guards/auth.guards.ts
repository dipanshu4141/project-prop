import {
  Injectable,
  ExecutionContext,
  CanActivate,
  ForbiddenException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { MemberRole, PlatformRole } from '@prisma/client';
import { ROLES_KEY, PLATFORM_ROLES_KEY } from '../constants';
import { JwtPayload } from '../jwt-payload.interface';

/** Validates the JWT access token on every protected route. */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}

/** Validates the JWT refresh token (used only on /auth/refresh). */
@Injectable()
export class JwtRefreshGuard extends AuthGuard('jwt-refresh') {}

/**
 * Enforces workspace-level roles.
 * Always use AFTER JwtAuthGuard.
 *
 * @UseGuards(JwtAuthGuard, RolesGuard)
 * @Roles(MemberRole.OWNER)
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<MemberRole[]>(ROLES_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);

    if (!required || required.length === 0) return true;

    const user: JwtPayload = ctx.switchToHttp().getRequest().user;

    // SUPERADMIN bypasses all workspace role checks
    if (user.platformRole === PlatformRole.SUPERADMIN) return true;

     if (!required.includes(user.role as MemberRole)) {
      throw new ForbiddenException(
        `Requires one of: ${required.join(', ')}. You have: ${user.role}`,
      );
    }
    return true;
  }
}

/**
 * Enforces platform-level roles (your internal staff only).
 * Always use AFTER JwtAuthGuard.
 *
 * @UseGuards(JwtAuthGuard, PlatformRolesGuard)
 * @PlatformRoles(PlatformRole.SUPERADMIN)
 */
@Injectable()
export class PlatformRolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<PlatformRole[]>(
      PLATFORM_ROLES_KEY,
      [ctx.getHandler(), ctx.getClass()],
    );

    if (!required || required.length === 0) return true;

    const user: JwtPayload = ctx.switchToHttp().getRequest().user;

     if (!required.includes(user.platformRole as PlatformRole)) {
      throw new ForbiddenException('Platform access only.');
    }
    return true;
  }
}