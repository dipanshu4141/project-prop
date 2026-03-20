import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { JWT_ACCESS_SECRET } from '../constants';
import { JwtPayload } from '../jwt-payload.interface';
import { PrismaService } from '../../core/prisma/prisma.service';

/** Extract JWT from the httpOnly cookie set by /auth/login */
function fromCookie(req: Request): string | null {
  return req?.cookies?.access_token ?? null;
}

@Injectable()
export class JwtAccessStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private prisma: PrismaService) {
    super({
      // Try cookie first, fall back to Bearer header (useful for API clients / mobile)
      jwtFromRequest:   ExtractJwt.fromExtractors([
        fromCookie,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      secretOrKey:      JWT_ACCESS_SECRET,
      ignoreExpiration: false,
      passReqToCallback: false,
    });
  }

  async validate(payload: JwtPayload): Promise<JwtPayload> {
    const member = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: payload.workspaceId,
          userId:      payload.sub,
        },
      },
      include: {
        user:      { select: { isActive: true, platformRole: true } },
        workspace: { select: { isActive: true } },
      },
    });

    if (!member)                    throw new UnauthorizedException('Membership not found');
    if (!member.user.isActive)      throw new UnauthorizedException('User deactivated');
    if (!member.workspace.isActive) throw new UnauthorizedException('Workspace suspended');

    // Fire-and-forget lastActiveAt update
    this.prisma.workspaceMember
      .update({ where: { id: member.id }, data: { lastActiveAt: new Date() } })
      .catch(() => {});

    return {
      sub:          payload.sub,
      email:        payload.email,
      workspaceId:  payload.workspaceId,
      role:         member.role,
      platformRole: member.user.platformRole,
    };
  }
}