import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../core/prisma/prisma.service';
import { RegisterDto, LoginDto, TokenResponseDto } from './dto/auth.dto';
import {
  JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET,
  JWT_ACCESS_EXPIRES,
  JWT_REFRESH_EXPIRES,
} from './constants';
import { JwtPayload } from './jwt-payload.interface';
import { MemberRole } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private prisma:     PrismaService,
    private jwtService: JwtService,
  ) {}

  // ─────────────────────────────────────────────────────────────
  // REGISTER
  // ─────────────────────────────────────────────────────────────

  async register(dto: RegisterDto, req?: Request): Promise<TokenResponseDto> {
    // 1. Check email not already taken
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });
    if (existing) throw new ConflictException('Email already registered');

    // 2. Hash password
    const passwordHash = await bcrypt.hash(dto.password, 12);

    // 3. Generate workspace slug from name
    const slug = await this.generateUniqueSlug(dto.workspaceName);

    // 4. Create everything in a transaction
    const { user, workspace, member } = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email:        dto.email.toLowerCase(),
          passwordHash,
          name:         dto.name,
          phone:        dto.phone,
        },
      });

      const workspace = await tx.workspace.create({
        data: {
          name: dto.workspaceName,
          slug,
          type: dto.workspaceType,
          plan: 'FREE',
        },
      });

      const member = await tx.workspaceMember.create({
        data: {
          workspaceId: workspace.id,
          userId:      user.id,
          role:        MemberRole.OWNER,
        },
      });

      // Create a FREE subscription record
      await tx.subscription.create({
        data: {
          workspaceId: workspace.id,
          plan:        'FREE',
          status:      'TRIALING',
          seats:       dto.workspaceType === 'INDIVIDUAL' ? 1 : 5,
          seatsUsed:   1,
          trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
        },
      });

      return { user, workspace, member };
    });

    // 5. Issue tokens
    return this.issueTokens(
      { sub: user.id, email: user.email, workspaceId: workspace.id, role: member.role, platformRole: user.platformRole },
      workspace,
      user,
      member.role,
      req,
    );
  }

  // ─────────────────────────────────────────────────────────────
  // LOGIN
  // ─────────────────────────────────────────────────────────────

  async login(dto: LoginDto, req?: Request): Promise<TokenResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (!user || !user.isActive) throw new UnauthorizedException('Invalid credentials');

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordValid) throw new UnauthorizedException('Invalid credentials');

    // Get the user's primary workspace membership (OWNER first, then any)
    const member = await this.prisma.workspaceMember.findFirst({
      where:   { userId: user.id },
      orderBy: { joinedAt: 'asc' },
      include: { workspace: true },
    });

    if (!member) throw new BadRequestException('No workspace found for this user');
    if (!member.workspace.isActive) throw new UnauthorizedException('Workspace suspended');

    const payload: JwtPayload = {
      sub:          user.id,
      email:        user.email,
      workspaceId:  member.workspaceId,
      role:         member.role,
      platformRole: user.platformRole,
    };

    return this.issueTokens(payload, member.workspace, user, member.role, req);
  }

  // ─────────────────────────────────────────────────────────────
  // REFRESH
  // ─────────────────────────────────────────────────────────────

  async refresh(userId: string, sessionId: string, req?: Request): Promise<TokenResponseDto> {
    const member = await this.prisma.workspaceMember.findFirst({
      where:   { userId },
      orderBy: { joinedAt: 'asc' },
      include: {
        workspace: true,
        user: true,
      },
    });

    if (!member) throw new UnauthorizedException();

    const payload: JwtPayload = {
      sub:          userId,
      email:        member.user.email,
      workspaceId:  member.workspaceId,
      role:         member.role,
      platformRole: member.user.platformRole,
    };

    // Rotate refresh token — revoke old session, create new one
    await this.prisma.userSession.update({
      where: { id: sessionId },
      data:  { revokedAt: new Date() },
    });

    return this.issueTokens(payload, member.workspace, member.user, member.role, req);
  }

  // ─────────────────────────────────────────────────────────────
  // LOGOUT
  // ─────────────────────────────────────────────────────────────

  async logout(sessionId: string): Promise<void> {
    await this.prisma.userSession.updateMany({
      where: { id: sessionId, revokedAt: null },
      data:  { revokedAt: new Date() },
    });
  }

  // ─────────────────────────────────────────────────────────────
  // HELPERS
  // ─────────────────────────────────────────────────────────────

  private async issueTokens(
    payload: JwtPayload,
    workspace: any,
    user: any,
    memberRole: MemberRole,
    req?: Request,
  ): Promise<TokenResponseDto> {
    // Sign access token (short-lived)
    const accessToken = this.jwtService.sign(payload, {
      secret:    JWT_ACCESS_SECRET,
      expiresIn: JWT_ACCESS_EXPIRES,
    });

    // Sign refresh token (long-lived, contains only userId + sessionId)
    // We'll create the session first to get its ID
    const rawRefresh   = crypto.randomBytes(64).toString('hex');
    const refreshHash  = crypto.createHash('sha256').update(rawRefresh).digest('hex');

    const session = await this.prisma.userSession.create({
      data: {
        userId:       payload.sub,
        refreshToken: refreshHash,
        userAgent:    req?.headers['user-agent'],
        ipAddress:    req?.ip,
        expiresAt:    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    });

    const refreshToken = this.jwtService.sign(
      { sub: payload.sub, sessionId: session.id },
      { secret: JWT_REFRESH_SECRET, expiresIn: JWT_REFRESH_EXPIRES },
    );

    return {
      accessToken,
      refreshToken,
      user: {
        id:           user.id,
        email:        user.email,
        name:         user.name,
        platformRole: user.platformRole,
      },
      workspace: {
        id:   workspace.id,
        name: workspace.name,
        slug: workspace.slug,
        type: workspace.type,
        role: memberRole,
      },
    };
  }

  private async generateUniqueSlug(name: string): Promise<string> {
    const base = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 40);

    let slug      = base;
    let attempts  = 0;

    while (true) {
      const exists = await this.prisma.workspace.findUnique({ where: { slug } });
      if (!exists) return slug;
      attempts++;
      slug = `${base}-${attempts}`;
    }
  }
}