import { Module } from '@nestjs/common';
import { PrivateGroupsService } from './private-groups.service';
import { PrivateGroupsController } from './private-groups.controller';
import { PrismaModule } from '../../core/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PrivateGroupsController],
  providers: [PrivateGroupsService],
  exports: [PrivateGroupsService],
})
export class PrivateGroupsModule {}