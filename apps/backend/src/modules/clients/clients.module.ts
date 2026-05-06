import { Module } from '@nestjs/common';
import { ClientsController } from './clients.controller';
import { ClientsService } from './clients.service';
import { PrismaService } from '../../core/prisma/prisma.service';
import { ClientPropertiesController } from './client-properties.controller';

@Module({
  controllers: [ClientsController, ClientPropertiesController],
  providers: [ClientsService, PrismaService],
  exports: [ClientsService],
})
export class ClientsModule {}
