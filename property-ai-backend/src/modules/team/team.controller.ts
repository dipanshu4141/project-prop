import { Controller, Get, Post, Body, Delete, Param } from '@nestjs/common';
import { TeamService } from './team.service';

@Controller('team')
export class TeamController {
  constructor(private readonly teamService: TeamService) {}

  @Get()
  getAll() {
    return this.teamService.getAll();
  }

  @Post()
  create(@Body() body: { name: string; phone: string }) {
    return this.teamService.create(body);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.teamService.delete(id);
  }
}
