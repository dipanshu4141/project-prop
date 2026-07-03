import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../core/prisma/prisma.service';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class ActivityMiddleware implements NestMiddleware {
    constructor(
        private prisma: PrismaService,
        private jwt: JwtService,
    ) {}
    use(req: Request, res: Response, next: NextFunction) {
    try {
        const token = req.cookies?.access_token;
        if (token) {
        const payload = jwt.decode(token) as any;
        const workspaceId = payload?.workspaceId;
        if (workspaceId) {
            this.prisma.workspace.update({
            where: { id: workspaceId },
            data:  { lastActiveAt: new Date() },
            }).catch(() => {});
        }
        }
    } catch {}
    next();
    }

}