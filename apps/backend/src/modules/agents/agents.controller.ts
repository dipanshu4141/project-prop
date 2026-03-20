import {
  Controller,
  Post,
  Patch,
  Get,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AgentsService } from './agents.service';
import { JwtAuthGuard } from '../../auth/guards/auth.guards';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { JwtPayload } from '../../auth/jwt-payload.interface';

@Controller('agents')
@UseGuards(JwtAuthGuard)
export class AgentsController {
  constructor(private agentsService: AgentsService) {}

  // ================================================================
  // LIST
  // ================================================================

  @Get()
  getAgents(
    @CurrentUser() user: JwtPayload,
    @Query('page')      page?:      string,
    @Query('limit')     limit?:     string,
    @Query('sortBy')    sortBy?:    string,
    @Query('sortOrder') sortOrder?: string,
    @Query('q')         q?:         string,
  ) {
    return this.agentsService.getAgentsList(user.workspaceId, {
      page:      page      ? Number(page)  : undefined,
      limit:     limit     ? Number(limit) : undefined,
      sortBy:    sortBy    as any,
      sortOrder: sortOrder as any,
      q,
    });
  }

  // ================================================================
  // SINGLE
  // ================================================================

  @Get(':id')
  getAgentById(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.agentsService.getAgentById(user.workspaceId, id);
  }

  // ================================================================
  // AGENT PROPERTIES / LISTINGS
  // ================================================================

  @Get(':id/properties')
  getAgentProperties(
    @CurrentUser() user: JwtPayload,
    @Param('id') agentId: string,
    @Query() query: any,
  ) {
    return this.agentsService.getAgentProperties(user.workspaceId, agentId, query);
  }

  // ================================================================
  // CREATE
  // ================================================================

  @Post()
  createAgent(
    @CurrentUser() user: JwtPayload,
    @Body() body: { name?: string | null; firmName?: string | null; phones: string[] },
  ) {
    return this.agentsService.createAgent(user.workspaceId, body);
  }

  // ================================================================
  // UPDATE
  // ================================================================

  @Patch(':id')
  updateAgent(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() body: { name?: string | null; firmName?: string | null; phones?: string[] },
  ) {
    return this.agentsService.updateAgent(user.workspaceId, id, body);
  }

  // ================================================================
  // MERGE
  // ================================================================

  @Post(':sourceId/merge/:targetId')
  mergeAgents(
    @CurrentUser() user: JwtPayload,
    @Param('sourceId') sourceId: string,
    @Param('targetId') targetId: string,
    @Body() body: { reason?: string },
  ) {
    return this.agentsService.mergeAgents(user.workspaceId, sourceId, targetId, body?.reason);
  }
}