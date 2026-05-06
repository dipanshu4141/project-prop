// apps/backend/src/modules/admin/admin-audit.service.ts

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';

export interface AuditQuery {
  page?:        number;
  limit?:       number;
  workspaceId?: string;
  userId?:      string;
  action?:      string;
  entity?:      string;
  fromDate?:    string;
  toDate?:      string;
}

@Injectable()
export class AdminAuditService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: AuditQuery) {
    const {
      page = 1, limit = 50,
      workspaceId, userId, action, entity, fromDate, toDate,
    } = query;
    const skip = (Math.max(1, page) - 1) * limit;

    const where: any = {};
    if (workspaceId) where.workspaceId = workspaceId;
    if (userId)      where.userId      = userId;
    if (action)      where.action      = { contains: action, mode: 'insensitive' };
    if (entity)      where.entity      = entity;
    if (fromDate || toDate) {
      where.createdAt = {};
      if (fromDate) where.createdAt.gte = new Date(fromDate);
      if (toDate)   where.createdAt.lte = new Date(toDate);
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          user: {
            select: { id: true, name: true, email: true, platformRole: true },
          },
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { items, total, pages: Math.ceil(total / limit) };
  }

  // Distinct action values for the filter dropdown
  async getActions() {
    const rows = await this.prisma.auditLog.findMany({
      distinct: ['action'],
      select:   { action: true },
      orderBy:  { action: 'asc' },
      take: 100,
    });
    return rows.map((r) => r.action);
  }

  // Distinct entity values for the filter dropdown
  async getEntities() {
    const rows = await this.prisma.auditLog.findMany({
      distinct: ['entity'],
      select:   { entity: true },
      orderBy:  { entity: 'asc' },
      take: 50,
    });
    return rows.map((r) => r.entity);
  }
}