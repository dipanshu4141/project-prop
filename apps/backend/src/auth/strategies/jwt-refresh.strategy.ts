import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import * as crypto from 'crypto';
import { JWT_REFRESH_SECRET } from '../constants';
import { PrismaService } from '../../core/prisma/prisma.service';

interface RefreshPayload {
  sub:       string;
  sessionId: string;
}

function fromCookie(req: Request): string | null {
  return req?.cookies?.refresh_token ?? null;
}

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest:    ExtractJwt.fromExtractors([
        fromCookie,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      secretOrKey:       JWT_REFRESH_SECRET,
      ignoreExpiration:  false,
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: RefreshPayload) {
    const session = await this.prisma.userSession.findUnique({
      where:   { id: payload.sessionId },
      include: { user: true },
    });

    if (!session)                       throw new UnauthorizedException('Session not found');
    if (session.revokedAt)              throw new UnauthorizedException('Session revoked');
    if (session.expiresAt < new Date()) throw new UnauthorizedException('Session expired');
    if (!session.user.isActive)         throw new UnauthorizedException('User deactivated');

    return { userId: session.userId, sessionId: session.id };
  }
}