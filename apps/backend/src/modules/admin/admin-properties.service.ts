// apps/backend/src/modules/admin/admin-properties.service.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';

export interface CanonicalListQuery {
  page?:           number;
  limit?:          number;
  q?:              string;
  verified?:       'true' | 'false';
  duplicatesOnly?: 'true';
  sortBy?:         string;
  sortOrder?:      string;
}

@Injectable()
export class AdminPropertiesService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Paginated list ──────────────────────────────────────────────────────────

  async findAll(query: CanonicalListQuery) {
    const {
      page  = 1,
      limit = 20,
      q,
      verified,
      duplicatesOnly,
      sortBy,
      sortOrder = 'desc',
    } = query;

    const skip = (Math.max(1, page) - 1) * limit;
    const where: any = {};

    if (q) {
      where.OR = [
        { globalRefCode: { contains: q, mode: 'insensitive' } },
        {
          listings: {
            some: {
              OR: [
                { city:     { contains: q, mode: 'insensitive' } },
                { area:     { contains: q, mode: 'insensitive' } },
                { building: { contains: q, mode: 'insensitive' } },
                { refCode:  { contains: q, mode: 'insensitive' } },
              ],
            },
          },
        },
      ];
    }

    if (verified === 'true')  where.verified = true;
    if (verified === 'false') where.verified = false;
      if (duplicatesOnly === 'true') {
      where.listings = { some: { id: { not: undefined } } };
      // Prisma can't filter by _count in where directly,
      // so post-filter after fetch or use raw:
    }
    const dir = sortOrder === 'asc' ? 'asc' : 'desc';
    const allowed: Record<string, object> = {
      listingCount:        { listingCount:        dir },
      totalDealsCompleted: { totalDealsCompleted: dir },
      createdAt:           { createdAt:           dir },
      price:               { createdAt:           dir }, // price on listing — fallback to date
    };
    const primary = sortBy && allowed[sortBy] ? allowed[sortBy] : { listingCount: 'desc' };
    const secondary = sortBy === 'createdAt' ? [] : [{ createdAt: 'desc' as const }];
    const orderBy = [primary, ...secondary];

    const [items, total] = await this.prisma.$transaction([
      this.prisma.canonicalProperty.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        select: {
          id:                  true,
          globalRefCode:       true,
          verified:            true,
          verifiedAt:          true,
          totalDealsCompleted: true,
          lastDealAt:          true,
          createdAt:           true,
          fingerprint:         true,
          _count: {
            select: { listings: true },
          },
          listings: {
            take:    1,
            orderBy: { createdAt: 'asc' },
            select: {
              bhk:             true,
              city:            true,
              area:            true,
              propertySubType: true,
              listingType:     true,
              price:           true,
              availability:    true,
            },
          },
          duplicateLinks: {
            where:  { confirmed: null },
            select: { id: true },
          },
        },

      }),
      this.prisma.canonicalProperty.count({ where }),
    ]);

    return {
      items: items.map((cp) => {
        const listing = cp.listings[0];
        return {
          id:                  cp.id,
          globalRefCode:       cp.globalRefCode,
          verified:            cp.verified,
          verifiedAt:          cp.verifiedAt,
          listingCount:        cp._count.listings,
          totalDealsCompleted: cp.totalDealsCompleted,
          lastDealAt:          cp.lastDealAt,
          createdAt:           cp.createdAt,
          bhk:             listing?.bhk             ?? null,
          city:            listing?.city            ?? null,
          area:            listing?.area            ?? null,
          propertySubType: listing?.propertySubType ?? null,
          listingType:     listing?.listingType     ?? null,
          price:           listing?.price?.toString() ?? null,
          availability:    listing?.availability    ?? null,
          pendingDuplicates: cp.duplicateLinks.length,
        };
      }),
      total,
      pages: Math.ceil(total / limit),
    };
  }

  // ── Single canonical property — full detail ─────────────────────────────────

  async findOne(id: string) {
    const cp = await this.prisma.canonicalProperty.findUnique({
      where: { id },
      include: {
        listings: {
          include: {
            workspace: {
              select: {
                id:      true,
                name:    true,
                slug:    true,
                logoUrl: true,
                type:    true,
                plan:    true,
              },
            },
            // Source WhatsApp message — field names from schema:
            // Message.rawText, Message.groupName, Message.receivedAt
            message: {
              select: {
                id:         true,
                rawText:    true,   // the actual WhatsApp text
                groupName:  true,   // which WhatsApp group it came from
                receivedAt: true,
              },
            },
            listingAgents: {
              include: {
                agent: {
                  include: { phones: true },
                },
              },
            },
            media:  { take: 3, select: { url: true, type: true } },
            _count: { select: { clientProperties: true, shares: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
        duplicateLinks: {
          include: {
            canonicalProperty: { select: { globalRefCode: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        deals: {
          orderBy: { initiatedAt: 'desc' },
          take:    10,
          include: {
            chain: {
              include: {
                workspace: { select: { id: true, name: true } },
              },
              orderBy: { position: 'asc' },
            },
          },
        },
      },
    });

    if (!cp) throw new NotFoundException('Canonical property not found');

    return {
      ...cp,
      listings: cp.listings.map((l) => ({
        ...l,
        price:       l.price?.toString()   ?? null,
        deposit:     l.deposit?.toString() ?? null,
        clientCount: l._count.clientProperties,
        shareCount:  l._count.shares,
        _count:      undefined,
      })),
    };
  }

  // ── Mark as verified ────────────────────────────────────────────────────────

  async verify(id: string, adminUserId: string) {
    const existing = await this.prisma.canonicalProperty.findUnique({
      where:  { id },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException('Canonical property not found');

    return this.prisma.canonicalProperty.update({
      where: { id },
      data: {
        verified:     true,
        verifiedAt:   new Date(),
        verifiedById: adminUserId,
      },
      select: { id: true, verified: true, verifiedAt: true },
    });
  }

  // ── Stats ───────────────────────────────────────────────────────────────────

  async getStats() {
    const [totalCanonical, verified, multiListed, pendingDuplicates] =
      await this.prisma.$transaction([
        this.prisma.canonicalProperty.count(),
        this.prisma.canonicalProperty.count({ where: { verified: true } }),
        this.prisma.canonicalProperty.count({ where: { listingCount: { gte: 2 } } }),
        this.prisma.duplicateLink.count({ where: { confirmed: null } }),
      ]);

    return {
      totalCanonical,
      verified,
      unverified:       totalCanonical - verified,
      multiListed,
      pendingDuplicates,
    };
  }
}