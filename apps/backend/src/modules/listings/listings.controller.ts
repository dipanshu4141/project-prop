// apps/backend/src/modules/listings/listings.controller.ts
import {
  Controller,
  Get,
  Patch,
  Post,
  Param,
  Query,
  Body,
  Request,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { IsIn, IsNotEmpty } from 'class-validator';
import { JwtAuthGuard } from '../../auth/guards/auth.guards';
import { ListingsService, type AvailabilityStatus } from './listings.service';
import { CreateListingDto } from './create-listing.dto';
import { UpdateListingDto } from './update-listing.dto';

// ── DTOs ──────────────────────────────────────────────────────────────────────

class UpdateAvailabilityDto {
  @IsNotEmpty()
  @IsIn(['AVAILABLE', 'UNDER_NEGOTIATION', 'CLOSED', 'ON_HOLD'])
  availability!: AvailabilityStatus;
}

class ListingsQueryDto {
  page?:               string;
  limit?:              string;
  sort?:               string;
  sortBy?:             string;
  sortOrder?:          string;
  q?:                  string;
  listingType?:        string;
  propertyCategory?:   string;
  bhk?:                string;
  furnishing?:         string;
  tenantTypes?:        string;
  tenantRestrictions?: string;
  minPrice?:           string;
  maxPrice?:           string;
  datePreset?:         string;
  fromDate?:           string;
  toDate?:             string;
}

// ── Controller ────────────────────────────────────────────────────────────────
//
// Route prefix is /properties (not /listings) to match the existing
// PropertiesClient frontend which calls apiGet('/properties?...')
//

@Controller('properties')
@UseGuards(JwtAuthGuard)
export class ListingsController {
  constructor(private readonly listingsService: ListingsService) {}

  /**
   * GET /properties
   * Paginated listing index for the broker's workspace.
   * Query params mirror what PropertiesClient sends.
   */
  @Get()
  findAll(@Query() query: ListingsQueryDto, @Request() req: any) {
    const workspaceId: string = req.user.workspaceId;

    const DATE_PRESETS = ['TODAY', 'LAST_7_DAYS', 'LAST_14_DAYS', 'LAST_30_DAYS'] as const;
    type DatePreset = (typeof DATE_PRESETS)[number];

    return this.listingsService.findAll({
      workspaceId,
      page:        query.page  ? parseInt(query.page,  10) : 1,
      limit:       query.limit ? parseInt(query.limit, 10) : 8,
      sort:        (query.sort === 'urgent' || query.sort === 'most_shared')
                     ? query.sort : undefined,
      sortBy:      query.sortBy,
      sortOrder:   (query.sortOrder === 'asc' || query.sortOrder === 'desc')
                     ? query.sortOrder : 'desc',
      q:                  query.q,
      listingType:        query.listingType,
      propertyCategory:   query.propertyCategory,
      bhk:                query.bhk,
      furnishing:         query.furnishing,
      tenantTypes:        query.tenantTypes,
      tenantRestrictions: query.tenantRestrictions,
      minPrice:           query.minPrice,
      maxPrice:           query.maxPrice,
      datePreset:         DATE_PRESETS.includes(query.datePreset as DatePreset)
                            ? (query.datePreset as DatePreset) : undefined,
      fromDate:           query.fromDate,
      toDate:             query.toDate,
    });
  }

  /**
   * GET /properties/:id
   * Full listing detail — includes media, agents, activity log.
   */
  @Get(':id')
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.listingsService.findOne(id, req.user.workspaceId);
  }

  /**
   * PATCH /properties/:id/availability
   * One-tap availability update — used by PropertyStatusSelect on cards.
   * Only updates the `availability` field; nothing else is touched.
   */
  @Patch(':id/availability')
  @HttpCode(HttpStatus.OK)
  updateAvailability(
    @Param('id') id: string,
    @Body() body: UpdateAvailabilityDto,
    @Request() req: any,
  ) {
    return this.listingsService.updateAvailability(
      id,
      body.availability,
      req.user.workspaceId,
    );
  }

  @Post()
  createListing(@Body() body: CreateListingDto, @Request() req: any) {
    return this.listingsService.create(
      req.user.workspaceId,
      req.user.sub,
      body,
    );
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  updateListing(@Param('id') id: string, @Body() body: UpdateListingDto, @Request() req: any) {
    console.log('>>> updateListing hit', id, body);
    return this.listingsService.updateListing(id, body, req.user.workspaceId);
  }
 
}