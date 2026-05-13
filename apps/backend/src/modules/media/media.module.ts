import { Module } from '@nestjs/common';
import { MediaService } from './media.service';
import { MediaController } from './media.controller';
import { PrismaModule } from '../../core/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [MediaController],
  providers: [MediaService],
  exports: [MediaService], // export so ingestion pipeline can call ingestWhatsappMedia
})
export class MediaModule {}