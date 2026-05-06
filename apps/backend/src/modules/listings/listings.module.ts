// apps/backend/src/modules/listings/listings.module.ts
import { Module } from '@nestjs/common';
import { ListingsController } from './listings.controller';
import { ListingsService } from './listings.service';
import { PrismaModule } from '../../core/prisma/prisma.module';
import { DedupService } from '../dedup/dedup.service';
import { DedupModule } from '../dedup/dedup.module';

@Module({
  imports:     [PrismaModule, DedupModule],
  controllers: [ListingsController],
  providers:   [ListingsService, DedupService],
  exports:     [ListingsService],
})
export class ListingsModule {}

// ── Register in AppModule ─────────────────────────────────────────────────────
// import { ListingsModule } from './modules/listings/listings.module';
// @Module({ imports: [..., ListingsModule] })