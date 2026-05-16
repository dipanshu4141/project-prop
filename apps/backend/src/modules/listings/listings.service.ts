// apps/backend/src/modules/listings/listings.service.ts
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../core/prisma/prisma.service';
import * as crypto from 'crypto';
import { CreateListingDto } from './create-listing.dto';
import { DedupService } from '../dedup/dedup.service';

// ── Types ─────────────────────────────────────────────────────────────────────

export type AvailabilityStatus =
  | 'AVAILABLE'
  | 'UNDER_NEGOTIATION'
  | 'CLOSED'
  | 'ON_HOLD';

export interface ListingsQuery {
  workspaceId: string;
  // pagination
  page?:       number;
  limit?:      number;
  // sorting
  sort?:       'urgent' | 'most_shared';
  sortBy?:     string;
  sortOrder?:  'asc' | 'desc';
  // filters
  q?:                  string;
  listingType?:        string;
  propertyCategory?:   string;
  bhk?:                string;       // comma-separated
  furnishing?:         string;       // comma-separated
  tenantTypes?:        string;       // comma-separated
  tenantRestrictions?: string;       // comma-separated
  minPrice?:           string;
  maxPrice?:           string;
  // date filters
  datePreset?: 'TODAY' | 'LAST_7_DAYS' | 'LAST_14_DAYS' | 'LAST_30_DAYS';
  fromDate?:   string;
  toDate?:     string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseCSV(v?: string): string[] {
  if (!v) return [];
  return v.split(',').map((s) => s.trim()).filter(Boolean);
}

function datePresetToRange(
  preset: NonNullable<ListingsQuery['datePreset']>,
): { gte: Date; lte: Date } {
  const now = new Date();
  const lte = new Date(now);
  const gte = new Date(now);
  gte.setHours(0, 0, 0, 0);

  switch (preset) {
    case 'TODAY':
      break;
    case 'LAST_7_DAYS':
      gte.setDate(gte.getDate() - 7);
      break;
    case 'LAST_14_DAYS':
      gte.setDate(gte.getDate() - 14);
      break;
    case 'LAST_30_DAYS':
      gte.setDate(gte.getDate() - 30);
      break;
  }
  return { gte, lte };
}

// ── Service ───────────────────────────────────────────────────────────────────

@Injectable()
export class ListingsService {
  constructor(private readonly prisma: PrismaService, private readonly dedup:  DedupService, ) {}

  // ── List with pagination + all PropertiesClient filters ──────────────────────

  async findAll(query: ListingsQuery) {
    const {
      workspaceId,
      page  = 1,
      limit = 8,
      sort,
      sortBy    = 'createdAt',
      sortOrder = 'desc',
      q,
      listingType,
      propertyCategory,
      bhk,
      furnishing,
      tenantTypes,
      tenantRestrictions,
      minPrice,
      maxPrice,
      datePreset,
      fromDate,
      toDate,
    } = query;

    const skip = (Math.max(1, page) - 1) * limit;

    // ── WHERE clause ──────────────────────────────────────────────────────────

    const where: Prisma.WorkspaceListingWhereInput = {
      workspaceId,
    };

    if (q) {
      where.OR = [
        { area:      { contains: q, mode: 'insensitive' } },
        { city:      { contains: q, mode: 'insensitive' } },
        { building:  { contains: q, mode: 'insensitive' } },
        { refCode:   { contains: q, mode: 'insensitive' } },
        { agentName: { contains: q, mode: 'insensitive' } },
        { location:  { contains: q, mode: 'insensitive' } },
      ];
    }

    if (listingType)      where.listingType      = listingType as any;
    if (propertyCategory) where.propertyCategory = propertyCategory as any;

    const bhkArr = parseCSV(bhk);
    if (bhkArr.length > 0) where.bhk = { in: bhkArr };

    const furnishingArr = parseCSV(furnishing);
    if (furnishingArr.length > 0) where.furnishing = { in: furnishingArr as any[] };

    const tenantTypesArr = parseCSV(tenantTypes);
    if (tenantTypesArr.length > 0) where.tenantTypes = { hasSome: tenantTypesArr as any[] };

    const tenantRestrictionsArr = parseCSV(tenantRestrictions);
    if (tenantRestrictionsArr.length > 0)
      where.tenantRestrictions = { hasSome: tenantRestrictionsArr };

    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = BigInt(minPrice);
      if (maxPrice) where.price.lte = BigInt(maxPrice);
    }

    // Date filter — preset takes priority over explicit fromDate/toDate
    if (datePreset) {
      const range     = datePresetToRange(datePreset);
      where.createdAt = range;
    } else if (fromDate || toDate) {
      where.createdAt = {};
      if (fromDate) where.createdAt.gte = new Date(fromDate);
      if (toDate)   where.createdAt.lte = new Date(toDate);
    }

    // ── ORDER BY ──────────────────────────────────────────────────────────────

    let orderBy: Prisma.WorkspaceListingOrderByWithRelationInput | Prisma.WorkspaceListingOrderByWithRelationInput[];

    if (sort === 'urgent') {
      // VERY_URGENT → URGENT → NORMAL
      orderBy = [
        { urgencyLevel: 'desc' },
        { createdAt:    'desc' },
      ];
    } else if (sort === 'most_shared') {
      orderBy = [
        { shares:    { _count: 'desc' } },
        { createdAt: 'desc'             },
      ];
    } else {
      const allowedSortFields: Record<string, boolean> = {
        createdAt: true,
        price:     true,
        areaSqft:  true,
      };
      const field = allowedSortFields[sortBy] ? sortBy : 'createdAt';
      const dir   = sortOrder === 'asc' ? 'asc' : 'desc';
      orderBy     = { [field]: dir };
    }

    // ── QUERY ─────────────────────────────────────────────────────────────────

    const [items, total] = await this.prisma.$transaction([
      this.prisma.workspaceListing.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        select: {
          id:              true,
          refCode:         true,
          bhk:             true,
          propertySubType: true,
          areaSqft:        true,
          city:            true,
          area:            true,
          price:           true,
          listingType:     true,
          availability:    true,
          urgencyLevel:    true,
          createdAt:       true,
          agentName:       true,
          // first image only
          media: {
            where:  { type: 'IMAGE' },
            take:   1,
            select: { url: true },
          },
          // share count for "most_shared" sort display
          _count: { select: { shares: true } },
        },
      }),

      this.prisma.workspaceListing.count({ where }),
    ]);

    return {
      items: items.map((l) => ({
        ...l,
        price:    l.price?.toString() ?? null,  // BigInt → string
        imageUrl: l.media[0]?.url ?? null,
        shares:   l._count.shares,
        media:    undefined,
        _count:   undefined,
      })),
      total,
      pages: Math.ceil(total / limit),
    };
  }

  // ── Single listing ────────────────────────────────────────────────────────

  async findOne(id: string, workspaceId: string) {
    const listing = await this.prisma.workspaceListing.findFirst({
      where: { id, workspaceId },
      include: {
        media:        true,
        listingAgents: { include: { agent: { include: { phones: true } } } },
        activities:   { orderBy: { createdAt: 'desc' }, take: 20 },
      },
    });
    if (!listing) throw new NotFoundException('Listing not found');
    return { ...listing, price: listing.price?.toString() ?? null };
  }

  // ── Update availability ───────────────────────────────────────────────────

  async updateAvailability(
    id:           string,
    availability: AvailabilityStatus,
    workspaceId:  string,
  ) {
    const existing = await this.prisma.workspaceListing.findFirst({
      where:  { id, workspaceId },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException('Listing not found');

    const updated = await this.prisma.workspaceListing.update({
      where: { id },
      data:  { availability },
      select: { id: true, availability: true },
    });

    return updated;
  }

  // ── Update general fields (status, notes, urgency etc.) ───────────────────

  async update(
    id:          string,
    data:        Prisma.WorkspaceListingUpdateInput,
    workspaceId: string,
  ) {
    const existing = await this.prisma.workspaceListing.findFirst({
      where:  { id, workspaceId },
      select: { id: true },
    });
    if (!existing) throw new NotFoundException('Listing not found');

    return this.prisma.workspaceListing.update({ where: { id }, data });
  }

  // apps/backend/src/modules/listings/listings.service.ts
  // ─────────────────────────────────────────────────────────────────────────────
  // ADD this method to your existing ListingsService class.
  // Also add to imports at the top if not already present:
  //   import { Post, Body } from '@nestjs/common'   (controller side)
  //   import * as crypto from 'crypto';              (service side)
  //   import { CreateListingDto } from './create-listing.dto';
  // ─────────────────────────────────────────────────────────────────────────────

  /*
    ADD these imports to listings.service.ts if not already present:
      import * as crypto from 'crypto';
      import { CreateListingDto } from './create-listing.dto';
  */

  // Paste this method inside the ListingsService class:

  async create(workspaceId: string, userId: string, dto: CreateListingDto) {
    // ── 1. Generate a unique refCode for this workspace ──────────────────────
    const shortId  = crypto.randomBytes(3).toString('hex').toUpperCase(); // e.g. "A3F9C1"
    const prefix   = dto.listingType === 'RENT' ? 'R' : 'S';
    const refCode  = `${prefix}-${shortId}`;                              // e.g. "R-A3F9C1"

    // ── 2. Build a fingerprint for canonical dedup ───────────────────────────
    // Simple deterministic string: type+bhk+area+city lowercased
    // When dedup pipeline runs later, it will use this to merge duplicates.
    const fingerprintParts = [
      dto.listingType,
      dto.bhk,
      dto.area?.toLowerCase().trim(),
      dto.city?.toLowerCase().trim(),
      dto.building?.toLowerCase().trim(),
    ].filter(Boolean);
    const fingerprint = fingerprintParts.join('|') || 'manual';

    const pricePaise   = dto.price   != null ? BigInt(Math.round(dto.price   * 100)) : null;
    const depositPaise = dto.deposit != null ? BigInt(Math.round(dto.deposit * 100)) : null;

    // ── 3. Single transaction: create canonical + listing ────────────────────
    const listing = await this.prisma.$transaction(async (tx) => {
      // Create a canonical property record for this listing.
      // If the dedup pipeline later finds this is a duplicate, it will
      // update canonicalPropertyId to point to the merged record.
      const fingerprint = this.dedup.buildFingerprint({
        city: dto.city, area: dto.area, building: dto.building,
        bhk: dto.bhk, propertySubType: dto.propertySubType,
        areaSqft: dto.areaSqft, listingType: dto.listingType,
        agentPhones: dto.contacts ?? [],
      });
      const canonicalId = await this.dedup.resolveOrCreate({ fingerprint, globalRefCode: refCode });
      // then use canonicalId instead of canonical.id

      const created = await tx.workspaceListing.create({
        data: {
          canonicalPropertyId: canonicalId,
          workspaceId,
          ownerId:          userId,
          refCode,
          listingType:      dto.listingType,
          propertyCategory: dto.propertyCategory  ?? null,
          propertySubType:  dto.propertySubType   ?? null,
          bhk:              dto.bhk               ?? null,
          city:             dto.city              ?? null,
          area:             dto.area              ?? null,
          building:         dto.building          ?? null,
          location:         dto.location          ?? null,
          price:            pricePaise,
          deposit:          depositPaise,
          areaSqft:         dto.areaSqft          ?? null,
          furnishing:       dto.furnishing        ?? null,
          floor:            dto.floor             ?? null,
          totalFloors:      dto.totalFloors       ?? null,
          negotiable:       dto.negotiable        ?? null,
          availability:     dto.availability      ?? 'AVAILABLE',
          notes:            dto.notes             ?? null,
          contacts:         dto.contacts          ?? [],
          confidence:       1.0,                  // manually entered = high confidence
          listingRole:      'ORIGINATOR',
        },
        select: {
          id:               true,
          refCode:          true,
          listingType:      true,
          propertyCategory: true,
          propertySubType:  true,
          bhk:              true,
          city:             true,
          area:             true,
          building:         true,
          price:            true,
          deposit:          true,
          areaSqft:         true,
          furnishing:       true,
          availability:     true,
          notes:            true,
          createdAt:        true,
          canonicalPropertyId: true,
        },
      });

      return created;
    });

    
    // ── 4. Emit UsageEvent (non-blocking) ────────────────────────────────────
    this.prisma.usageEvent.create({
      data: {
        workspaceId,
        userId,
        event:      'listing.created',
        properties: { source: 'manual', refCode, listingType: dto.listingType },
      },
    }).catch(() => {/* fire and forget */});
    
    return {
      ...listing,
      price:   listing.price   ? Number(listing.price)   / 100 : null,
      deposit: listing.deposit ? Number(listing.deposit) / 100 : null,
    };
  }
  
      async updateListing(id: string, dto: any, workspaceId: string) {
        const existing = await this.prisma.workspaceListing.findFirst({
          where:  { id, workspaceId },
          select: { id: true },
        });
        if (!existing) throw new NotFoundException('Listing not found');
  
        const data: Prisma.WorkspaceListingUpdateInput = {};
  
        if (dto.listingType        != null) data.listingType      = dto.listingType;
        if (dto.propertyCategory   != null) data.propertyCategory = dto.propertyCategory;
        if (dto.propertySubType    != null) data.propertySubType  = dto.propertySubType;
        if (dto.bhk                != null) data.bhk              = dto.bhk;
        if (dto.areaSqft           != null) data.areaSqft         = Number(dto.areaSqft);
        if (dto.furnishing         != null) data.furnishing        = dto.furnishing;
        if (dto.floor              != null) data.floor             = Number(dto.floor);
        if (dto.totalFloors        != null) data.totalFloors       = Number(dto.totalFloors);
        if (dto.status             != null) data.status            = dto.status;
        if (dto.urgencyLevel       != null) data.urgencyLevel      = dto.urgencyLevel;
        if (dto.negotiable         != null) data.negotiable        = dto.negotiable;
        if (dto.availableFrom      != null) data.availableFrom     = new Date(dto.availableFrom);
        if (dto.country            != null) data.country           = dto.country;
        if (dto.city               != null) data.city              = dto.city;
        if (dto.area               != null) data.area              = dto.area;
        if (dto.location           != null) data.location          = dto.location;
        if (dto.building           != null) data.building          = dto.building;
        if (dto.tenantTypes        != null) data.tenantTypes       = dto.tenantTypes;
        if (dto.tenantRestrictions != null) data.tenantRestrictions = dto.tenantRestrictions;
        if (dto.notes              != null) data.notes             = dto.notes;
  
        // price/deposit come in as raw numbers (paise) from the frontend
        if (dto.price   != null) data.price   = BigInt(Math.round(Number(dto.price)));
        if (dto.deposit != null) data.deposit = BigInt(Math.round(Number(dto.deposit)));
  
        const updated = await this.prisma.workspaceListing.update({
          where: { id },
          data,
        });
  
        return { ...updated, price: updated.price?.toString() ?? null, deposit: updated.deposit?.toString() ?? null };
      }
  }
