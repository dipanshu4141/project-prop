import { Module } from '@nestjs/common';
import { ShortlistsController } from './shortlists.controller';
import { ShortlistsService } from './shortlists.service';
import { PrismaModule } from '../../core/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ShortlistsController],
  providers: [ShortlistsService],
  exports: [ShortlistsService],
})
export class ShortlistsModule {}