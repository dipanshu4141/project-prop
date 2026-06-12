import {
  Controller, Get, Post, Body, RawBodyRequest,
  Req, UseGuards, HttpCode, HttpStatus, Headers,
} from '@nestjs/common';
import { Request } from 'express';
import { BillingService } from './billing.service';
import { JwtAuthGuard } from '../../auth/guards/auth.guards';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { JwtPayload } from '../../auth/jwt-payload.interface';
import { SkipBilling } from './skip-billing.decorator';

@SkipBilling()
@Controller('billing')
export class BillingController {
  constructor(private readonly svc: BillingService) {}

  // GET /billing/status — trial days left, subscription status
  @Get('status')
  @UseGuards(JwtAuthGuard)
  getStatus(@CurrentUser() user: JwtPayload) {
    return this.svc.getStatus(user.workspaceId);
  }

  // POST /billing/subscribe — create Razorpay subscription
  @Post('subscribe')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  createSubscription(@CurrentUser() user: JwtPayload) {
    return this.svc.createSubscription(user.workspaceId, user.sub);
  }

  // POST /billing/verify — verify payment after checkout
  @Post('verify')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  verifyPayment(
    @CurrentUser() user: JwtPayload,
    @Body() body: {
      razorpay_payment_id:      string;
      razorpay_subscription_id: string;
      razorpay_signature:       string;
    },
  ) {
    return this.svc.verifyPayment(user.workspaceId, body);
  }

  // POST /billing/cancel
  @Post('cancel')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  cancel(@CurrentUser() user: JwtPayload) {
    return this.svc.cancelSubscription(user.workspaceId);
  }

  // POST /billing/webhook — Razorpay webhook (no auth)
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  webhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('x-razorpay-signature') signature: string,
  ) {
    return this.svc.handleWebhook(req.rawBody!, signature);
  }
}