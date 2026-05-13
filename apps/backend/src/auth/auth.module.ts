import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAccessStrategy } from './strategies/jwt-access.strategy';
import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';
import { PrismaModule } from '../core/prisma/prisma.module';

import { GoogleStrategy }  from './strategies/google.strategy';
import { EmailModule }     from '../core/email/email.module';


@Module({
  imports: [
    PrismaModule,
    JwtModule.register({}),
    PassportModule,
    EmailModule
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtAccessStrategy,
    JwtRefreshStrategy,
    GoogleStrategy
  ],
  exports: [AuthService],
})
export class AuthModule {}