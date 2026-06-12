import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { BillingService } from './billing.service';
import { BillingController } from './billing.controller';
import { BillingGuard } from './billing.guard';
import { PrismaModule } from '../../core/prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    JwtModule.register({ secret: process.env.JWT_SECRET }),
  ],
  controllers: [BillingController],
  providers:   [BillingService, BillingGuard],
  exports:     [BillingService, BillingGuard],
})
export class BillingModule {}