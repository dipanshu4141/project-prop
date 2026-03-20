import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { Agent, Prisma } from '@prisma/client';

@Injectable()
export class AgentsService {
  constructor(private prisma: PrismaService) {}

  /* ================================================================
   * RESOLVE — follows merge chain to canonical agent
   * ================================================================ */

  async getResolvedAgent(agentId: string): Promise<Agent> {
    const agent = await this.prisma.agent.findUnique({
      where: { id: agentId },
      include: { phones: true },
    });
    if (!agent) throw new NotFoundException('Agent not found');
    if (agent.mergedIntoId) return this.getResolvedAgent(agent.mergedIntoId);
    return agent;
  }

  /* ================================================================
   * LIST
   * ================================================================ */

  async getAgentsList(
    workspaceId: string,
    params: {
      page?:      number;
      limit?:     number;
      sortBy?:    'createdAt' | 'name' | 'firmName' | 'propertyCount';
      sortOrder?: 'asc' | 'desc';
      q?:         string;
    },
  ) {
    const page      = Math.max(params.page ?? 1, 1);
    const limit     = Math.min(Math.max(params.limit ?? 10, 1), 100);
    const skip      = (page - 1) * limit;
    const sortBy    = params.sortBy    ?? 'createdAt';
    const sortOrder = params.sortOrder ?? 'desc';

    const where: Prisma.AgentWhereInput = {
      workspaceId,           // ← workspace guard
      mergedIntoId: null,
      ...(params.q
        ? {
            OR: [
              { name:     { contains: params.q, mode: 'insensitive' } },
              { firmName: { contains: params.q, mode: 'insensitive' } },
              { phones:   { some: { phone: { contains: params.q } } } },
            ],
          }
        : {}),
    };

    const orderBy: Prisma.AgentOrderByWithRelationInput =
      sortBy === 'name'          ? { name:          sortOrder } :
      sortBy === 'firmName'      ? { firmName:       sortOrder } :
      sortBy === 'propertyCount' ? { propertyCount:  sortOrder } :
                                   { createdAt:      sortOrder };

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.agent.findMany({
        where,
        include:  { phones: true },
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.agent.count({ where }),
    ]);

    const items = rows.map((a) => ({
      id:            a.id,
      name:          a.name,
      firmName:      a.firmName,
      primaryPhone:  a.phones[0]?.phone ?? null,
      phoneCount:    a.phones.length,
      propertyCount: a.propertyCount,
      createdAt:     a.createdAt,
    }));

    return {
      items,
      meta: {
        page, limit, total,
        totalPages: Math.ceil(total / limit),
        sortBy, sortOrder,
        q: params.q ?? '',
      },
    };
  }

  /* ================================================================
   * GET SINGLE
   * ================================================================ */

  async getAgentById(workspaceId: string, agentId: string) {
    const resolved = await this.getResolvedAgent(agentId);

    const fullAgent = await this.prisma.agent.findFirst({
      where: { id: resolved.id, workspaceId },   // ← workspace guard
      include: {
        phones: true,
        listingAgents: {                          // was propertyAgents
          include: { listing: true },
        },
      },
    });

    if (!fullAgent) throw new NotFoundException('Agent not found');

    return {
      id:         fullAgent.id,
      name:       fullAgent.name,
      firmName:   fullAgent.firmName,
      phones:     fullAgent.phones.map((p) => p.phone),
      properties: fullAgent.listingAgents.map((la) => la.listing),
      createdAt:  fullAgent.createdAt,
    };
  }

  /* ================================================================
   * GET AGENT PROPERTIES / LISTINGS
   * ================================================================ */

  async getAgentProperties(
    workspaceId: string,
    agentId:     string,
    query:       any,
  ) {
    const normalize = (v?: string) => v?.toUpperCase();

    const where: Prisma.WorkspaceListingWhereInput = {
      workspaceId,                               // ← workspace guard
      listingAgents: { some: { agentId } },      // was propertyAgents
    };

    if (query.q) {
      where.OR = [
        { city:     { contains: query.q, mode: 'insensitive' } },
        { area:     { contains: query.q, mode: 'insensitive' } },
        { building: { contains: query.q, mode: 'insensitive' } },
      ];
    }

    if (query.minPrice || query.maxPrice) {
      where.price = {};
      if (query.minPrice) where.price.gte = BigInt(query.minPrice);
      if (query.maxPrice) where.price.lte = BigInt(query.maxPrice);
    }

    if (query.bhk)              where.bhk          = { in: query.bhk.split(',') };
    if (query.listingType)      where.listingType   = normalize(query.listingType)   as any;
    if (query.propertyCategory) where.propertyCategory = normalize(query.propertyCategory) as any;

    if (query.furnishing) {
      where.furnishing = { in: query.furnishing.split(',').map((v: string) => normalize(v)) as any };
    }

    if (query.tenantTypes) {
      where.tenantTypes = { hasSome: query.tenantTypes.split(',').map((v: string) => normalize(v)) as any };
    }

    if (query.fromDate || query.toDate) {
      where.createdAt = {};
      if (query.fromDate) where.createdAt.gte = new Date(query.fromDate);
      if (query.toDate)   where.createdAt.lte = new Date(query.toDate);
    }

    return this.prisma.workspaceListing.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  /* ================================================================
   * CREATE
   * ================================================================ */

  async createAgent(
    workspaceId: string,
    dto: {
      name?:     string | null;
      firmName?: string | null;
      phones:    string[];
    },
  ) {
    if (!Array.isArray(dto.phones) || dto.phones.length === 0) {
      throw new Error('At least one phone number is required');
    }

    // Look for existing agent in this workspace with any of these phones
    for (const phone of dto.phones) {
      const existing = await this.prisma.agentPhone.findFirst({
        where: { phone, agent: { workspaceId } },   // ← workspace-scoped
        include: { agent: true },
      });
      if (existing) return existing.agent;
    }

    return this.prisma.agent.create({
      data: {
        workspaceId,
        name:     dto.name     ?? null,
        firmName: dto.firmName ?? null,
        phones:   { create: dto.phones.map((p) => ({ phone: p })) },
      },
    });
  }

  /* ================================================================
   * UPDATE
   * ================================================================ */

  async updateAgent(
    workspaceId: string,
    agentId:     string,
    dto: {
      name?:     string | null;
      firmName?: string | null;
      phones?:   string[];
    },
  ) {
    const agent = await this.getResolvedAgent(agentId);

    // Guard: agent must belong to this workspace
    if ((agent as any).workspaceId !== workspaceId) {
      throw new NotFoundException('Agent not found');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.agent.update({
        where: { id: agent.id },
        data: {
          name:     dto.name     ?? undefined,
          firmName: dto.firmName ?? undefined,
        },
      });

      if (Array.isArray(dto.phones)) {
        const normalized = [...new Set(dto.phones.map((p) => p.trim()))];

        const existingPhones = await tx.agentPhone.findMany({
          where: { agentId: agent.id },
        });

        const existingSet  = new Set(existingPhones.map((p) => p.phone));
        const incomingSet  = new Set(normalized);
        const phonesToRemove = existingPhones.filter((p) => !incomingSet.has(p.phone)).map((p) => p.phone);
        const phonesToAdd    = normalized.filter((p) => !existingSet.has(p));

        // Conflict check — within same workspace only
        if (phonesToAdd.length > 0) {
          const conflicts = await tx.agentPhone.findMany({
            where: {
              phone:   { in: phonesToAdd },
              agentId: { not: agent.id },
              agent:   { workspaceId },       // ← workspace-scoped conflict check
            },
            include: { agent: true },
          });

          if (conflicts.length > 0) {
            throw new Error(
              `Phone conflict: ${conflicts.map((c) => `${c.phone} (agent ${c.agentId})`).join(', ')}`,
            );
          }
        }

        if (phonesToRemove.length > 0) {
          await tx.agentPhone.deleteMany({
            where: { agentId: agent.id, phone: { in: phonesToRemove } },
          });
        }

        for (const phone of phonesToAdd) {
          await tx.agentPhone.create({ data: { agentId: agent.id, phone } });
        }
      }

      return this.getResolvedAgent(agent.id);
    });
  }

  /* ================================================================
   * MERGE
   * ================================================================ */

  async mergeAgents(
    workspaceId: string,
    sourceId:    string,
    targetId:    string,
    reason?:     string,
  ) {
    if (sourceId === targetId) throw new Error('Cannot merge agent into itself');

    await this.prisma.$transaction(async (tx) => {
      const source = await tx.agent.findFirst({
        where: { id: sourceId, workspaceId },    // ← workspace guard
        include: { phones: true },
      });

      const target = await tx.agent.findFirst({
        where: { id: targetId, workspaceId },    // ← workspace guard
      });

      if (!source || !target) throw new Error('Agent not found');
      if (source.isMerged)    throw new Error('Source agent already merged');

      // Move phones
      for (const p of source.phones) {
        await tx.agentPhone.upsert({
          where:  { agentId_phone: { agentId: targetId, phone: p.phone } },
          update: { agentId: targetId },
          create: { phone: p.phone, agentId: targetId },
        });
      }

      // Move listing links (was propertyAgent)
      await tx.listingAgent.updateMany({
        where: { agentId: sourceId },
        data:  { agentId: targetId },
      });

      // Mark source merged
      await tx.agent.update({
        where: { id: sourceId },
        data:  { isMerged: true, mergedIntoId: targetId, mergedAt: new Date() },
      });

      // Audit log
      await tx.agentMergeLog.create({
        data: {
          fromAgentId: sourceId,
          toAgentId:   targetId,
          mergedBy:    workspaceId,          // replace with userId from JWT in controller
          reason:      reason ?? 'Manual merge',
        },
      });
    });

    return { success: true };
  }
}