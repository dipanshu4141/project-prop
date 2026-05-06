import { SetMetadata } from '@nestjs/common';
import { MemberRole, PlatformRole } from '@prisma/client';
import { ROLES_KEY, PLATFORM_ROLES_KEY } from '../constants';

/**
 * Restrict a route to specific workspace roles.
 *
 * Usage:
 *   @Roles(MemberRole.OWNER, MemberRole.BROKER)
 *   @UseGuards(JwtAuthGuard, RolesGuard)
 */
export const Roles = (...roles: MemberRole[]) =>
  SetMetadata(ROLES_KEY, roles);

/**
 * Restrict a route to platform-level roles (your internal staff).
 *
 * Usage:
 *   @PlatformRoles(PlatformRole.SUPERADMIN)
 *   @UseGuards(JwtAuthGuard, PlatformRolesGuard)
 */
export const PlatformRoles = (...roles: PlatformRole[]) =>
  SetMetadata(PLATFORM_ROLES_KEY, roles);