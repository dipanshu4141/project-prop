import { Module } from '@nestjs/common';
import { TeamController, InviteController } from './team.controller';
import { TeamService } from './team.service';
import { EmailService } from './email.service';
import { PrismaModule } from '../../core/prisma/prisma.module';

@Module({
  imports:     [PrismaModule],
  controllers: [TeamController, InviteController],
  providers:   [TeamService, EmailService],
  exports:     [TeamService, EmailService],
})
export class TeamModule {}