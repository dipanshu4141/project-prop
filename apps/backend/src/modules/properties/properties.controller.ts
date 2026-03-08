import {
  Controller,
  Get,
  Param,
  Patch,
  Delete,
  Body,
  Query,
  Post,
} from '@nestjs/common';
import { PropertyStatus } from '@prisma/client';
import { PropertiesService } from './properties.service';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { AttachAgentByPhoneDto } from './dto/attach-agent.dto';

@Controller('properties')
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  // ================================
  // 📄 PROPERTY LISTING
  // ================================

  @Get()
  findAll(@Query() query: any) {
    return this.propertiesService.findAll(query);
  }

  // ================================
  // 📜 LEAD PIPELINE VIEWS (GLOBAL)
  // ================================

  @Get('leads/followups-today')
  getFollowups() {
    return this.propertiesService.getFollowUpsToday();
  }

  @Get('leads/open')
  getOpenLeads() {
    return this.propertiesService.getOpenLeads();
  }

  @Get('leads/closed')
  getClosedLeads() {
    return this.propertiesService.getClosedLeads();
  }

  // ================================
  // 📜 ACTIVITY LOG
  // ================================

  // ⚠️ Must be before :id
  @Get(':id/activities')
  getActivities(@Param('id') id: string) {
    return this.propertiesService.getActivities(id);
  }

  // ================================
  // 🧑‍💼 LEADS FOR A PROPERTY
  // ================================

  @Get('leads')
  getAllLeads(@Query() query: any) {
    return this.propertiesService.getAllLeads(query);
  }


  // List leads of a property
  @Get(':id/leads')
  getLeads(@Param('id') id: string) {
    return this.propertiesService.getLeads(id);
  }

  // Create lead manually
  @Post(':id/leads')
  createLead(
    @Param('id') id: string,
    @Body() dto: CreateLeadDto,
  ) {
    return this.propertiesService.createLead(id, dto);
  }

  // Update a lead (stage, follow-up, notes)
  @Patch('leads/:leadId')
  updateLeadById(
    @Param('leadId') leadId: string,
    @Body() dto: UpdateLeadDto,
  ) {
    return this.propertiesService.updateLead(leadId, dto);
  }

  // @Get('leads/followups-today')
  // getTodayFollowups() {
  //   return this.propertiesService.getFollowUpsToday();
  // }

  @Get('leads/followups-overdue')
  getOverdueFollowups() {
    return this.propertiesService.getOverdueFollowUps();
  }

  // ================================
  // 🏠 PROPERTY CORE
  // ================================

  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.propertiesService.getPropertyWithDistribution(id);
  }

  @Get(':id/neighbors')
  getNeighbors(
    @Param('id') id: string,
    @Query() query: any,
  ) {
    return this.propertiesService.getNeighbors(id, query);
  }


  @Post(':id/revert/:activityId')
  revertToVersion(
    @Param('id') id: string,
    @Param('activityId') activityId: string,
  ) {
    return this.propertiesService.revertToActivity(id, activityId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePropertyDto) {
    return this.propertiesService.update(id, dto);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: { status: PropertyStatus },
  ) {
    return this.propertiesService.updateStatus(id, dto.status);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.propertiesService.delete(id);
  }

  @Post(':id/share')
  shareProperty(
    @Param('id') id: string,
    @Body()
    body: {
      platform: 'WHATSAPP';
      clientName?: string;
      clientPhone: string;
      teamMemberIds: string[];
    },
  ) {
    return this.propertiesService.shareProperty(id, body);
  }

  @Post('manual')
  createManual(@Body() body: any) {
    return this.propertiesService.createManualProperty(body);
  }

  @Post(':id/agents/:agentId')
  attachAgent(
    @Param('id') propertyId: string,
    @Param('agentId') agentId: string,
  ) {
    return this.propertiesService.attachAgent(propertyId, agentId);
  }

  @Post(':id/attach-agent')
  attachAgentByPhone(
    @Param('id') propertyId: string,
    @Body('phone') phone: string,
  ) {
    console.log('BACKEND URL HIT');
    console.log('PROPERTY ID:', propertyId);
    console.log('PHONE:', phone);
    return this.propertiesService.attachAgentByPhone(propertyId, phone);
  }

  @Delete(':id/agents/:agentId')
  detachAgent(
    @Param('id') propertyId: string,
    @Param('agentId') agentId: string,
  ) {
    return this.propertiesService.detachAgent(propertyId, agentId);
  }
  


}
