// apps/backend/src/modules/onboarding/onboarding.controller.ts

import {
  Controller, Get, Post, Body, Request, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import {
  IsString, IsNotEmpty, IsIn, IsOptional, IsArray, IsEmail, MaxLength, ArrayMaxSize,
} from 'class-validator';
import { JwtAuthGuard } from '../../auth/guards/auth.guards';
import { OnboardingService } from './onboarding.service';
import { SkipBilling } from '../billing/skip-billing.decorator';

class CreateWorkspaceDto {
  @IsString() @IsNotEmpty() @MaxLength(80)
  name: string;

  @IsIn(['INDIVIDUAL', 'FIRM'])
  type: 'INDIVIDUAL' | 'FIRM';

  @IsOptional() @IsString() @MaxLength(60)
  city?: string;
}

class SelectPlanDto {
  @IsIn(['FREE', 'INDIVIDUAL', 'FIRM_5', 'FIRM_20', 'ENTERPRISE'])
  plan: string;

  @IsOptional() @IsIn(['MONTHLY', 'ANNUAL'])
  interval?: 'MONTHLY' | 'ANNUAL';
}

class InviteMembersDto {
  @IsArray() @ArrayMaxSize(19)
  @IsEmail({}, { each: true })
  emails: string[];
}

@SkipBilling()
@Controller('onboarding')
@UseGuards(JwtAuthGuard)
export class OnboardingController {
  constructor(private readonly svc: OnboardingService) {}

  /** GET /onboarding/status — does this user need onboarding? */
  @Get('status')
  status(@Request() req: any) {
    return this.svc.getStatus(req.user.sub);
  }

  /** POST /onboarding/workspace — Step 1 */
  @Post('workspace')
  @HttpCode(HttpStatus.CREATED)
  createWorkspace(@Body() body: CreateWorkspaceDto, @Request() req: any) {
    return this.svc.createWorkspace(req.user.sub, body);
  }

  /** POST /onboarding/plan — Step 2 */
  @Post('plan')
  @HttpCode(HttpStatus.OK)
  selectPlan(@Body() body: SelectPlanDto, @Request() req: any) {
    return this.svc.selectPlan(req.user.sub, body.plan, body.interval ?? 'MONTHLY');
  }

  /** POST /onboarding/invite — Step 3 (FIRM only) */
  @Post('invite')
  @HttpCode(HttpStatus.OK)
  inviteMembers(@Body() body: InviteMembersDto, @Request() req: any) {
    return this.svc.inviteMembers(req.user.sub, body.emails);
  }
}