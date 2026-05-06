// apps/backend/src/modules/deals/deals.controller.ts

import {
  Controller, Get, Post, Patch,
  Param, Body, Query,
  UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { DealsService }     from './deals.service';
import { JwtAuthGuard }     from '../../auth/guards/auth.guards';
import { CurrentUser }      from '../../auth/decorators/current-user.decorator';
import { JwtPayload }       from '../../auth/jwt-payload.interface';
import { DealStatus }       from '@prisma/client';

@Controller('deals')
@UseGuards(JwtAuthGuard)
export class DealsController {
  constructor(private readonly deals: DealsService) {}

  // GET /api/deals
  @Get()
  findAll(
    @CurrentUser() user: JwtPayload,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.deals.findAll(user.workspaceId, {
      status,
      page:  page  ? Number(page)  : 1,
      limit: limit ? Number(limit) : 20,
    });
  }

  // GET /api/deals/:id
  @Get(':id')
  findOne(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.deals.findOne(user.workspaceId, id);
  }

  // POST /api/deals
  @Post()
  create(
    @CurrentUser() user: JwtPayload,
    @Body() body: {
      listingId:      string;
      clientId?:      string;
      dealValue?:     number;
      commissionRate?: number;
      notes?:         string;
    },
  ) {
    return this.deals.create(user.workspaceId, user.sub, body);
  }

  // PATCH /api/deals/:id/status
  @Patch(':id/status')
  @HttpCode(HttpStatus.OK)
  updateStatus(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() body: { status: DealStatus; notes?: string },
  ) {
    return this.deals.updateStatus(user.workspaceId, id, body.status, body.notes);
  }

  // PATCH /api/deals/:id/financials
  @Patch(':id/financials')
  @HttpCode(HttpStatus.OK)
  updateFinancials(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() body: { dealValue?: number; commissionRate?: number; notes?: string },
  ) {
    return this.deals.updateFinancials(user.workspaceId, id, body);
  }
}