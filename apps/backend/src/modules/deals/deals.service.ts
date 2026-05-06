// apps/backend/src/modules/deals/deals.service.ts

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { DealStatus, AvailabilityStatus, ChainRole } from '@prisma/client';

// ── Status transition map ────────────────────────────────────────────────────
const VALID_TRANSITIONS: Record<DealStatus, DealStatus[]> = {
  INITIATED:        ['NEGOTIATING', 'FALLEN_THROUGH'],
  NEGOTIATING:      ['AGREED', 'FALLEN_THROUGH', 'DISPUTED'],
  AGREED:           ['COMPLETED', 'FALLEN_THROUGH', 'DISPUTED'],
  COMPLETED:        [],
  FALLEN_THROUGH:   [],
  DISPUTED:         ['NEGOTIATING', 'FALLEN_THROUGH'],
};

// DealStatus → WorkspaceListing AvailabilityStatus
const AVAILABILITY_MAP: Partial<Record<DealStatus, AvailabilityStatus>> = {
  NEGOTIATING:    'UNDER_NEGOTIATION',
  COMPLETED:      'CLOSED',
  FALLEN_THROUGH: 'AVAILABLE',
};

function paiseToRupees(paise: bigint | null): number | null {
  if (paise === null) return null;
  return Number(paise) / 100;
}

@Injectable()
export class DealsService {
  constructor(private readonly prisma: PrismaService) {}

  // ── List deals for workspace ─────────────────────────────────────────────
  async findAll(workspaceId: string, query: { status?: string; page?: number; limit?: number }) {
    const { status, page = 1, limit = 20 } = query;
    const skip = (Math.max(1, page) - 1) * limit;

    const where: any = {
      chain: { some: { workspaceId } },
    };
    if (status) where.status = status;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.propertyDeal.findMany({
        where,
        orderBy: { initiatedAt: 'desc' },
        skip,
        take: limit,
        include: {
          client: { select: { name: true } },
          canonicalProperty: {
            include: {
              listings: {
                where: { workspaceId },
                take: 1,
                select: {
                  id: true, bhk: true, city: true, area: true,
                  listingType: true, price: true, availability: true,
                },
              },
            },
          },
          chain: {
            where: { workspaceId },
            include: { commission: true },
          },
        },
      }),
      this.prisma.propertyDeal.count({ where }),
    ]);

    return {
      items: items.map((d) => this.formatDeal(d)),
      total,
      pages: Math.ceil(total / limit),
    };
  }

  // ── Single deal ──────────────────────────────────────────────────────────
  async findOne(workspaceId: string, dealId: string) {
    const deal = await this.prisma.propertyDeal.findFirst({
      where: {
        id: dealId,
        chain: { some: { workspaceId } },
      },
      include: {
        client: { select: { name: true } },
        canonicalProperty: {
          include: {
            listings: {
              where: { workspaceId },
              take: 1,
              select: {
                id: true, bhk: true, city: true, area: true, building: true,
                listingType: true, price: true, availability: true,
              },
            },
          },
        },
        chain: {
          include: {
            workspace: { select: { id: true, name: true, slug: true } },
            commission: true,
          },
          orderBy: { position: 'asc' },
        },
        commissions: true,
      },
    });

    if (!deal) throw new NotFoundException('Deal not found');
    return this.formatDeal(deal);
  }

  // ── Start a deal from a WorkspaceListing ─────────────────────────────────
  async create(workspaceId: string, userId: string, dto: {
    listingId: string;
    clientId?: string;
    dealValue?: number;    // rupees — we convert to paise
    commissionRate?: number;
    notes?: string;
  }) {
    // Resolve listing → canonical property
    const listing = await this.prisma.workspaceListing.findFirst({
      where: { id: dto.listingId, workspaceId },
      select: { id: true, canonicalPropertyId: true, availability: true },
    });
    if (!listing) throw new NotFoundException('Listing not found in your workspace');
    if (!listing.canonicalPropertyId) {
      throw new BadRequestException(
        'This listing has not been linked to a canonical property yet. Contact support.',
      );
    }

    // Prevent duplicate active deals on the same canonical property from this workspace
    const existing = await this.prisma.propertyDeal.findFirst({
      where: {
        canonicalPropertyId: listing.canonicalPropertyId,
        status: { in: ['INITIATED', 'NEGOTIATING', 'AGREED'] },
        chain: { some: { workspaceId } },
      },
      select: { id: true },
    });
    if (existing) {
      throw new BadRequestException(
        'An active deal already exists for this property. Update the existing deal instead.',
      );
    }

    const dealValuePaise = dto.dealValue ? BigInt(Math.round(dto.dealValue * 100)) : null;
    const totalCommission =
      dealValuePaise && dto.commissionRate
        ? BigInt(Math.round(Number(dealValuePaise) * (dto.commissionRate / 100)))
        : null;

    const deal = await this.prisma.propertyDeal.create({
      data: {
        canonicalPropertyId: listing.canonicalPropertyId,
        initiatorListingId:  listing.id,
        clientId:            dto.clientId ?? null,
        status:              'INITIATED',
        dealValue:           dealValuePaise,
        totalCommission,
        commissionRate:      dto.commissionRate ?? null,
        notes:               dto.notes ?? null,
        chain: {
          create: {
            workspaceId,
            listingId: listing.id,
            role:      ChainRole.CLOSER,
            position:  0,
            addedBy:   userId,
          },
        },
      },
      include: {
        chain: { include: { commission: true } },
        canonicalProperty: {
          include: {
            listings: {
              where: { workspaceId },
              take: 1,
              select: { id: true, bhk: true, city: true, area: true, listingType: true, price: true },
            },
          },
        },
      },
    });

    return this.formatDeal(deal);
  }

  // ── Advance deal status ──────────────────────────────────────────────────
  async updateStatus(workspaceId: string, dealId: string, newStatus: DealStatus, notes?: string) {
    const deal = await this.prisma.propertyDeal.findFirst({
      where: { id: dealId, chain: { some: { workspaceId } } },
      select: { id: true, status: true, initiatorListingId: true },
    });
    if (!deal) throw new NotFoundException('Deal not found');

    const allowed = VALID_TRANSITIONS[deal.status];
    if (!allowed.includes(newStatus)) {
      throw new BadRequestException(
        `Cannot move from ${deal.status} to ${newStatus}. Allowed: ${allowed.join(', ') || 'none'}`,
      );
    }

    const now = new Date();
    const timestamps: any = {};
    if (newStatus === 'AGREED')           timestamps.agreedAt     = now;
    if (newStatus === 'COMPLETED')        timestamps.completedAt  = now;
    if (newStatus === 'FALLEN_THROUGH')   timestamps.fallenAt     = now;

    // Update deal status
    const updated = await this.prisma.propertyDeal.update({
      where: { id: dealId },
      data: {
        status: newStatus,
        notes:  notes ?? undefined,
        ...timestamps,
      },
    });

    // Sync listing availability
    const availabilityChange = AVAILABILITY_MAP[newStatus];
    if (availabilityChange && deal.initiatorListingId) {
      await this.prisma.workspaceListing.update({
        where: { id: deal.initiatorListingId },
        data:  { availability: availabilityChange },
      });
    }

    return { id: updated.id, status: updated.status };
  }

  // ── Update financials ────────────────────────────────────────────────────
  async updateFinancials(workspaceId: string, dealId: string, dto: {
    dealValue?: number;
    commissionRate?: number;
    notes?: string;
  }) {
    const deal = await this.prisma.propertyDeal.findFirst({
      where: { id: dealId, chain: { some: { workspaceId } } },
      select: { id: true, status: true },
    });
    if (!deal) throw new NotFoundException('Deal not found');
    if (deal.status === 'COMPLETED' || deal.status === 'FALLEN_THROUGH') {
      throw new ForbiddenException('Cannot edit a closed deal');
    }

    const dealValuePaise = dto.dealValue != null ? BigInt(Math.round(dto.dealValue * 100)) : undefined;
    const totalCommission =
      dealValuePaise != null && dto.commissionRate != null
        ? BigInt(Math.round(Number(dealValuePaise) * (dto.commissionRate / 100)))
        : undefined;

    const updated = await this.prisma.propertyDeal.update({
      where: { id: dealId },
      data: {
        dealValue:       dealValuePaise,
        totalCommission,
        commissionRate:  dto.commissionRate ?? undefined,
        notes:           dto.notes ?? undefined,
      },
    });

    return {
      id:             updated.id,
      dealValue:      paiseToRupees(updated.dealValue),
      commissionRate: updated.commissionRate,
      totalCommission: paiseToRupees(updated.totalCommission),
    };
  }

  // ── Format helper ────────────────────────────────────────────────────────
  private formatDeal(deal: any) {
    const listing = deal.canonicalProperty?.listings?.[0] ?? null;
    return {
      id:             deal.id,
      status:         deal.status,
      clientName:     deal.client?.name ?? null,
      dealValue:      paiseToRupees(deal.dealValue),
      commissionRate: deal.commissionRate,
      totalCommission: paiseToRupees(deal.totalCommission),
      notes:          deal.notes,
      initiatedAt:    deal.initiatedAt,
      agreedAt:       deal.agreedAt,
      completedAt:    deal.completedAt,
      fallenAt:       deal.fallenAt,
      canonicalPropertyId: deal.canonicalPropertyId,
      listing: listing
        ? {
            id:          listing.id,
            bhk:         listing.bhk,
            city:        listing.city,
            area:        listing.area,
            building:    listing.building ?? null,
            listingType: listing.listingType,
            price:       listing.price?.toString() ?? null,
            availability: listing.availability ?? null,
          }
        : null,
      chain: (deal.chain ?? []).map((link: any) => ({
        id:          link.id,
        workspaceId: link.workspaceId,
        workspaceName: link.workspace?.name ?? null,
        role:        link.role,
        position:    link.position,
        joinedAt:    link.joinedAt,
        commission:  link.commission
          ? {
              percentage: link.commission.percentage,
              amount:     paiseToRupees(link.commission.amount),
              status:     link.commission.status,
            }
          : null,
      })),
    };
  }
}