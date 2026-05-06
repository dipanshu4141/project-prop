// apps/backend/src/modules/dedup/dedup.module.ts

import { Module } from '@nestjs/common';
import { DedupService } from './dedup.service';
import { PrismaModule } from '../../core/prisma/prisma.module';

@Module({
  imports:   [PrismaModule],
  providers: [DedupService],
  exports:   [DedupService],   // exported so AdminModule + ListingsModule can import it
})
export class DedupModule {}