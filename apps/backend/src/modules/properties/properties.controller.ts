import {
  Controller,
  Get,
  Param,
  Patch,
  Delete,
  Body,
  Query,
  Post,
  UseGuards,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PropertyStatus } from '@prisma/client';
import { PropertiesService } from './properties.service';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { JwtAuthGuard } from '../../auth/guards/auth.guards';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { JwtPayload } from '../../auth/jwt-payload.interface';

@Controller('properties')
@UseGuards(JwtAuthGuard)   // ← every route in this controller requires a valid JWT
export class PropertiesController {
  private readonly logger = new Logger(PropertiesController.name);

  constructor(private readonly propertiesService: PropertiesService) {}

  // ================================================================
  // LIST
  // ================================================================

  @Get()
  findAll(
    @CurrentUser() user: JwtPayload,
    @Query() query: any,
  ) {
    return this.propertiesService.findAll(user.workspaceId, query);
  }

  // ================================================================
  // FOLLOW-UPS
  // ================================================================

  @Get('leads/followups-today')
  getFollowupsToday(@CurrentUser() user: JwtPayload) {
    return this.propertiesService.getFollowUpsToday(user.workspaceId);
  }

  // ================================================================
  // ACTIVITY LOG  (before :id to avoid route conflict)
  // ================================================================

  @Get(':id/activities')
  getActivities(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.propertiesService.getActivities(user.workspaceId, id);
  }

  // ================================================================
  // SINGLE PROPERTY
  // ================================================================

  @Get(':id')
  async getOne(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    this.logger.log(`getOne called: id=${id} workspaceId=${user.workspaceId}`);
    const property = await this.propertiesService.getPropertyWithDistribution(user.workspaceId, id);
    this.logger.log(`getPropertyWithDistribution result: ${property ? 'found' : 'null'}`);
    if (!property) throw new NotFoundException('Property not found');
    return property;
  }

  @Get(':id/neighbors')
  getNeighbors(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Query() query: any,
  ) {
    return this.propertiesService.getNeighbors(user.workspaceId, id, query);
  }

  // ================================================================
  // MUTATE
  // ================================================================

  @Patch(':id')
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: any,
  ) {
    return this.propertiesService.update(user.workspaceId, id, dto);
  }

  @Patch(':id/status')
  updateStatus(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: { status: PropertyStatus },
  ) {
    return this.propertiesService.updateStatus(user.workspaceId, id, dto.status);
  }

  @Delete(':id')
  delete(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.propertiesService.delete(user.workspaceId, id);
  }

  @Post(':id/revert/:activityId')
  revertToVersion(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Param('activityId') activityId: string,
  ) {
    return this.propertiesService.revertToActivity(user.workspaceId, id, activityId);
  }

  // ================================================================
  // SHARE
  // ================================================================

  @Post(':id/share')
  shareProperty(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() body: {
      platform:      'WHATSAPP';
      clientName?:   string;
      clientPhone:   string;
      teamMemberIds: string[];
    },
  ) {
    return this.propertiesService.shareProperty(user.workspaceId, id, body);
  }

  // ================================================================
  // MANUAL CREATION
  // ================================================================

  @Post('manual')
  createManual(
    @CurrentUser() user: JwtPayload,
    @Body() body: any,
  ) {
    return this.propertiesService.createManualProperty(user.workspaceId, body);
  }

  // ================================================================
  // AGENT LINKS
  // ================================================================

  @Post(':id/agents/:agentId')
  attachAgent(
    @CurrentUser() user: JwtPayload,
    @Param('id') listingId: string,
    @Param('agentId') agentId: string,
  ) {
    return this.propertiesService.attachAgent(user.workspaceId, listingId, agentId);
  }

  @Delete(':id/agents/:agentId')
  detachAgent(
    @CurrentUser() user: JwtPayload,
    @Param('id') listingId: string,
    @Param('agentId') agentId: string,
  ) {
    return this.propertiesService.detachAgent(user.workspaceId, listingId, agentId);
  }
  
}