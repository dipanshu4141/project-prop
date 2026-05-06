// FULL FILE REPLACEMENT:
import { Module } from '@nestjs/common';
import { IngestionService } from './ingestion.service';
import { IngestionController, IngestionAdminController } from './ingestion.controller';
import { PrismaModule } from '../../core/prisma/prisma.module';
import { AiParserModule } from '../../ai/property-parser/ai-parser/ai-parser.module';
import { PropertiesModule } from '../properties/properties.module';
import { PreClassifierService } from '../messages/pre-classifier.service';

@Module({
  imports: [PrismaModule, AiParserModule, PropertiesModule],
  controllers: [IngestionController, IngestionAdminController],
  providers: [IngestionService, PreClassifierService],
  exports: [IngestionService],
})
export class IngestionModule {}