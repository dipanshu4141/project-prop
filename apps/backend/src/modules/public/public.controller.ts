import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { IsIn, IsString, IsNotEmpty } from 'class-validator';
import { PublicService } from './public.service';
import { SkipBilling } from '../billing/skip-billing.decorator';

class RespondDto {
  @IsString()
  @IsNotEmpty()
  clientPropertyId!: string;

  @IsIn(['INTERESTED', 'NOT_INTERESTED'])
  status!: 'INTERESTED' | 'NOT_INTERESTED';
}

/**
 * Public controller — NO JwtAuthGuard on any route.
 * Token-based ownership validation is handled in PublicService.
 */

@SkipBilling()
@Controller('public')
export class PublicController {
  constructor(private readonly publicService: PublicService) {}

  /**
   * GET /public/share/:token
   * Returns client name, workspace/broker name, and array of ClientProperty
   * with embedded listing details. Marks viewedAt on first access.
   * Returns 404 if token is unknown or expired.
   */
  @Get('share/:token')
  getShareData(@Param('token') token: string) {
    return this.publicService.getShareData(token);
  }

  /**
   * POST /public/share/:token/respond
   * Body: { clientPropertyId, status: "INTERESTED" | "NOT_INTERESTED" }
   * Validates that clientPropertyId belongs to the token's client.
   */
  @Post('share/:token/respond')
  @HttpCode(HttpStatus.OK)
  respond(
    @Param('token') token: string,
    @Body() body: RespondDto,
  ) {
    return this.publicService.respond(token, body.clientPropertyId, body.status);
  }
}