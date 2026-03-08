import { Module } from '@nestjs/common';
import { AgentsService } from './agents.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AgentsController } from './agents.controller';

@Module({
    controllers: [AgentsController],
    providers: [AgentsService, PrismaService],
    exports: [AgentsService],
  })
export class AgentsModule {}
