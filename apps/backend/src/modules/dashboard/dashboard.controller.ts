// apps/backend/src/modules/dashboard/dashboard.controller.ts

import { Controller, Get, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard }     from '../../auth/guards/auth.guards';
import { CurrentUser }      from '../../auth/decorators/current-user.decorator';
import { JwtPayload }       from '../../auth/jwt-payload.interface';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  // GET /api/dashboard/stats
  @Get('stats')
  getStats(@CurrentUser() user: JwtPayload) {
    return this.dashboard.getStats(user.workspaceId);
  }
}