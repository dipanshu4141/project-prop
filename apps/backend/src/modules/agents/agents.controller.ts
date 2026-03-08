import { Controller, Post, Patch, Get, Param, Body, Query } from '@nestjs/common';
import { AgentsService } from './agents.service';

@Controller('agents')
export class AgentsController {
  constructor(private agentsService: AgentsService) {}

  // ✅ GET /agents
  @Get()
  async getAgents(
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("sortBy") sortBy?: string,
    @Query("sortOrder") sortOrder?: string,
  ) {
    return this.agentsService.getAgentsList({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      sortBy: sortBy as any,
      sortOrder: sortOrder as any,
    });
  }


  // ✅ GET /agents/:id
  @Get(':id')
  async getAgentById(@Param('id') id: string) {
    return this.agentsService.getAgentById(id);
  }

  // POST /agents/:sourceId/merge/:targetId
  @Post(':sourceId/merge/:targetId')
  async mergeAgents(
    @Param('sourceId') sourceId: string,
    @Param('targetId') targetId: string,
    @Body() body: { reason?: string }
  ) {
    return this.agentsService.mergeAgents(sourceId, targetId, body?.reason);
  }

  @Post()
  createAgent(
    @Body()
    body: {
      name?: string | null;
      firmName?: string | null;
      phones: string[];
    },
  ) {
    return this.agentsService.createAgent(body);
  }

  @Patch(':id')
  updateAgent(
    @Param('id') id: string,
    @Body()
    body: {
      name?: string | null;
      firmName?: string | null;
      phones?: string[];
    },
  ) {
    return this.agentsService.updateAgent(id, body);
  }

  // GET /agents/:id/properties
  @Get(':id/properties')
  async getAgentProperties(
    @Param('id') agentId: string,
    @Query() query: any,
  ) {
    return this.agentsService.getAgentProperties(agentId, query);
  }


}
