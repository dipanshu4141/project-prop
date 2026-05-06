import { ForbiddenException } from '@nestjs/common';
import { JwtPayload } from '../jwt-payload.interface';

export function requireSuperAdmin(user: JwtPayload) {
  if (user.platformRole !== 'SUPERADMIN') {
    throw new ForbiddenException('Super admin only');
  }
}

export function requireAdmin(user: JwtPayload) {
  if (user.role !== 'OWNER' && user.platformRole !== 'SUPERADMIN') {
    throw new ForbiddenException('Admin only');
  }
}