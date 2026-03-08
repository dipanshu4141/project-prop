import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Agent } from '@prisma/client';
import { Prisma } from "@prisma/client";

@Injectable()
export class AgentsService {
  constructor(private prisma: PrismaService) {}

  

  // ✅ Always returns the canonical agent (follows merge chain)
  async getResolvedAgent(agentId: string): Promise<Agent> {
    const agent = await this.prisma.agent.findUnique({
      where: { id: agentId },
      include: { phones: true },
    });

    if (!agent) {
      throw new NotFoundException('Agent not found');
    }
    
    if (agent.mergedIntoId) {
      // 🔁 Follow the chain until we reach the final agent
      return this.getResolvedAgent(agent.mergedIntoId);
}

    return agent;
  }

  async mergeAgents(sourceId: string, targetId: string, reason?: string) {
    if (sourceId === targetId) {
      throw new Error("Cannot merge agent into itself");
    }
  
    await this.prisma.$transaction(async (tx) => {
      const source = await tx.agent.findUnique({
        where: { id: sourceId },
        include: { phones: true },
      });
  
      const target = await tx.agent.findUnique({
        where: { id: targetId },
      });
  
      if (!source || !target) throw new Error("Agent not found");
  
      if (source.isMerged) throw new Error("Source agent already merged");
  
      // 1️⃣ Move phones
      for (const p of source.phones) {
        await tx.agentPhone.upsert({
          where: { phone: p.phone },
          update: { agentId: targetId },
          create: { phone: p.phone, agentId: targetId },
        });
      }
  
      // 2️⃣ Move property links
      await tx.propertyAgent.updateMany({
        where: { agentId: sourceId },
        data: { agentId: targetId },
      });
  
      // 3️⃣ Mark source as merged
      await tx.agent.update({
        where: { id: sourceId },
        data: {
          isMerged: true,
          mergedIntoId: targetId,
          mergedAt: new Date(),
        },
      });
  
      // 4️⃣ Log merge
      await tx.agentMergeLog.create({
        data: {
          fromAgentId: sourceId,
          toAgentId: targetId,
          mergedBy: "Dipanshu (Admin)",
          reason: reason || "Manual merge",
        },
      });
    });
  
    return { success: true };
  }

  async createAgent(dto: {
    name?: string | null;
    firmName?: string | null;
    phones: string[];
  }) {
    if (!Array.isArray(dto.phones) || dto.phones.length === 0) {
      throw new Error("At least one phone number is required");
    }
  
    // 🔍 Try to find existing agent by phone
    for (const phone of dto.phones) {
      const existing = await this.prisma.agentPhone.findUnique({
        where: { phone },
        include: { agent: true },
      });
  
      if (existing) {
        return existing.agent; // ✅ reuse existing
      }
    }
  
    // ✅ Create new agent
    return this.prisma.agent.create({
      data: {
        name: dto.name ?? null,
        firmName: dto.firmName ?? null,
        phones: {
          create: dto.phones.map((p) => ({ phone: p })),
        },
      },
    });
  }
  
  
    async updateAgent(
    agentId: string,
    dto: {
      name?: string | null;
      firmName?: string | null;
      phones?: string[];
    },
  ) {
    // 🔁 Always operate on canonical agent
    const agent = await this.getResolvedAgent(agentId);

    return this.prisma.$transaction(async (tx) => {
      // -------------------------
      // Update core fields
      // -------------------------
      await tx.agent.update({
        where: { id: agent.id },
        data: {
          name: dto.name ?? undefined,
          firmName: dto.firmName ?? undefined,
        },
      });

      // -------------------------
      // Phone update logic (SAFE)
      // -------------------------
      if (Array.isArray(dto.phones)) {
        const normalizedPhones = [...new Set(dto.phones.map(p => p.trim()))];

        // Existing phones on this agent
        const existingPhones = await tx.agentPhone.findMany({
          where: { agentId: agent.id },
        });

        const existingSet = new Set(existingPhones.map(p => p.phone));
        const incomingSet = new Set(normalizedPhones);

        // Phones to remove
        const phonesToRemove = existingPhones
          .filter(p => !incomingSet.has(p.phone))
          .map(p => p.phone);

        // Phones to add
        const phonesToAdd = normalizedPhones
          .filter(p => !existingSet.has(p));

        // 🔴 Conflict check
        if (phonesToAdd.length > 0) {
          const conflicts = await tx.agentPhone.findMany({
            where: {
              phone: { in: phonesToAdd },
              agentId: { not: agent.id },
            },
            include: { agent: true },
          });

          if (conflicts.length > 0) {
            throw new Error(
              `Phone conflict: ${conflicts
                .map(c => `${c.phone} (agent ${c.agentId})`)
                .join(', ')}`
            );
          }
        }

        // Remove phones
        if (phonesToRemove.length > 0) {
          await tx.agentPhone.deleteMany({
            where: {
              agentId: agent.id,
              phone: { in: phonesToRemove },
            },
          });
        }

        // Add phones
        for (const phone of phonesToAdd) {
          await tx.agentPhone.create({
            data: {
              agentId: agent.id,
              phone,
            },
          });
        }
      }

      return this.getResolvedAgent(agent.id);
    });
  }



    async getAgentsList(params: {
      page?: number;
      limit?: number;
      sortBy?: "createdAt" | "name" | "firmName" | "propertyCount";
      sortOrder?: "asc" | "desc";
      q?: string;
    }) {
      /* ===============================
      * Pagination
      * =============================== */
      const page = Math.max(params.page ?? 1, 1);
      const limit = Math.min(Math.max(params.limit ?? 10, 1), 100);
      const skip = (page - 1) * limit;

      /* ===============================
      * Sorting
      * =============================== */
      const sortBy = params.sortBy ?? "createdAt";
      const sortOrder: "asc" | "desc" = params.sortOrder ?? "desc";

      /* ===============================
      * Filtering (search)
      * =============================== */
      const where: Prisma.AgentWhereInput = {
        mergedIntoId: null,
        ...(params.q
          ? {
              OR: [
                { name: { contains: params.q, mode: "insensitive" } },
                { firmName: { contains: params.q, mode: "insensitive" } },
                {
                  phones: {
                    some: {
                      phone: { contains: params.q },
                    },
                  },
                },
              ],
            }
          : {}),
      };

      /* ===============================
      * DB-level sorting (Prisma-safe)
      * =============================== */
      const orderBy: Prisma.AgentOrderByWithRelationInput =
        sortBy === "name"
          ? { name: sortOrder }
          : sortBy === "firmName"
          ? { firmName: sortOrder }
          : sortBy === "propertyCount"
          ? { propertyCount: sortOrder }
          : { createdAt: sortOrder };

      /* ===============================
      * Fetch data + count (atomic)
      * =============================== */
      const [rows, total] = await this.prisma.$transaction([
        this.prisma.agent.findMany({
          where,
          include: {
            phones: true,
          },
          orderBy,
          skip,
          take: limit,
        }),
        this.prisma.agent.count({ where }),
      ]);

      /* ===============================
      * Shape data
      * =============================== */
      let items = rows.map((a) => ({
        id: a.id,
        name: a.name,
        firmName: a.firmName,
        primaryPhone: a.phones[0]?.phone ?? null,
        phoneCount: a.phones.length,
        propertyCount: a.propertyCount,
        createdAt: a.createdAt,
      }));

      /* ===============================
      * Response
      * =============================== */
      return {
        items,
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          sortBy,
          sortOrder,
          q: params.q ?? "",
        },
      };
    }




    
    async getAgentProperties(agentId: string, query: any) {
  const where: Prisma.PropertyWhereInput = {
    propertyAgents: {
      some: { agentId },
    },
  };

  const normalize = (v?: string) => v?.toUpperCase();

  /* 🔍 SEARCH */
  if (query.q) {
    where.OR = [
      { city: { contains: query.q, mode: "insensitive" } },
      { area: { contains: query.q, mode: "insensitive" } },
      { building: { contains: query.q, mode: "insensitive" } },
    ];
  }

  /* 💰 PRICE (BigInt-safe) */
  if (query.minPrice || query.maxPrice) {
    where.price = {};
    if (query.minPrice) where.price.gte = BigInt(query.minPrice);
    if (query.maxPrice) where.price.lte = BigInt(query.maxPrice);
  }

  /* 🏠 BHK */
  if (query.bhk) {
    where.bhk = {
      in: query.bhk.split(","),
    };
  }

  /* 🏷 ENUMS */
  if (query.listingType) {
    where.listingType = normalize(query.listingType) as any;
  }

  if (query.propertyCategory) {
    where.propertyCategory = normalize(query.propertyCategory) as any;
  }

  if (query.furnishing) {
    where.furnishing = {
      in: query.furnishing
        .split(",")
        .map((v: string) => normalize(v)) as any,
    };
  }

  /* 👥 ARRAY ENUMS */
  if (query.tenantTypes) {
    where.tenantTypes = {
      hasSome: query.tenantTypes
        .split(",")
        .map((v: string) => normalize(v)) as any,
    };
  }

  if (query.tenantRestrictions) {
    where.tenantRestrictions = {
      hasSome: query.tenantRestrictions
        .split(",")
        .map((v: string) => normalize(v)),
    };
  }

  /* 📅 DATE */
  if (query.fromDate || query.toDate) {
    where.createdAt = {};
    if (query.fromDate) where.createdAt.gte = new Date(query.fromDate);
    if (query.toDate) where.createdAt.lte = new Date(query.toDate);
  }

  console.log("AGENT PROPERTY FILTER WHERE", where);

  return this.prisma.property.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });
}



    async getAgentById(agentId: string) {
    const agent = await this.getResolvedAgent(agentId);

    const fullAgent = await this.prisma.agent.findUnique({
      where: { id: agent.id },
      include: {
        phones: true,
        properties: {
          include: {
            property: true,
          },
        },
      },
    });

    if (!fullAgent) {
      throw new NotFoundException('Agent not found');
    }

    return {
      id: fullAgent.id,
      name: fullAgent.name,
      firmName: fullAgent.firmName,
      phones: fullAgent.phones.map((p) => p.phone),
      properties: fullAgent.properties.map((pa) => pa.property),
      createdAt: fullAgent.createdAt,
    };
  }
}
