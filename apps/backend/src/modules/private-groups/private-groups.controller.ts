import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { PrivateGroupsService } from './private-groups.service';
import { JwtAuthGuard } from '../../auth/guards/auth.guards';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { JwtPayload } from '../../auth/jwt-payload.interface';

@Controller('private-groups')
@UseGuards(JwtAuthGuard)
export class PrivateGroupsController {
  constructor(private readonly svc: PrivateGroupsService) {}

  @Post('request')
  createRequest(@CurrentUser() user: JwtPayload) {
    return this.svc.createRequest(user.workspaceId);
  }

  @Get()
  getPrivateGroups(@CurrentUser() user: JwtPayload) {
    return this.svc.getPrivateGroups(user.workspaceId);
  }

  @Get('pending')
  getPendingRequest(@CurrentUser() user: JwtPayload) {
    return this.svc.getPendingRequest(user.workspaceId);
  }
}