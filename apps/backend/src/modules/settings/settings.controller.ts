import { Controller, Get, Patch, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/auth.guards';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { JwtPayload } from '../../auth/jwt-payload.interface';
import { SettingsService } from './settings.service';

@Controller('settings')
@UseGuards(JwtAuthGuard)
export class SettingsController {
  constructor(private readonly svc: SettingsService) {}

  @Get('me')
  getMe(@CurrentUser() user: JwtPayload) {
    return this.svc.getMe(user.sub, user.workspaceId);
  }

  @Patch('profile')
  @HttpCode(HttpStatus.OK)
  updateProfile(
    @CurrentUser() user: JwtPayload,
    @Body() body: { name?: string; phone?: string },
  ) {
    return this.svc.updateProfile(user.sub, body);
  }

  @Patch('workspace')
  @HttpCode(HttpStatus.OK)
  updateWorkspace(
    @CurrentUser() user: JwtPayload,
    @Body() body: { name?: string },
  ) {
    return this.svc.updateWorkspace(user.workspaceId, body);
  }

  @Patch('password')
  @HttpCode(HttpStatus.OK)
  changePassword(
    @CurrentUser() user: JwtPayload,
    @Body() body: { currentPassword: string; newPassword: string },
  ) {
    return this.svc.changePassword(user.sub, body.currentPassword, body.newPassword);
  }
}