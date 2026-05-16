import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as path from 'path';

import { PrismaModule }     from './core/prisma/prisma.module';
import { AuthModule }       from './auth/auth.module';
import { AdminModule }      from './modules/admin/admin.module';
import { BillingModule }    from './modules/billing/billing.module';
import { MessagesModule }   from './modules/messages/messages.module';
import { PropertiesModule } from './modules/properties/properties.module';
import { AgentsModule }     from './modules/agents/agents.module';
import { ClientsModule }    from './modules/clients/clients.module';
import { TeamModule }       from './modules/team/team.module';
import { WhatsappModule }   from './ingestion/whatsapp/whatsapp.module';
import { AppController }    from './app.controller';
import { PublicModule } from './modules/public/public.module'; 
import { ListingsModule } from './modules/listings/listings.module'; 
import { OnboardingModule } from './modules/onboarding/onboarding.module';
import { HealthService } from './modules/admin/health.service';
import { DealsController } from './modules/deals/deals.controller';
import { DealsService } from './modules/deals/deals.service';
import { DedupModule } from './modules/dedup/dedup.module';
import { DashboardController } from './modules/dashboard/dashboard.controller';
import { DashboardService }    from './modules/dashboard/dashboard.service';
import { PreClassifierService } from './modules/messages/pre-classifier.service';
import { MessageCacheService } from './modules/messages/message-cache.service';
import { MediaModule } from './modules/media/media.module';
import { CollectionsModule } from './modules/collections/collections.module';
import { ShortlistsModule }  from './modules/shortlists/shortlists.module';
import { IngestionModule } from './modules/ingestion/ingestion.module';




@Module({
  imports: [
    // Loads apps/backend/.env regardless of where the process is started from
    ConfigModule.forRoot({
      isGlobal:    true,
      envFilePath: path.resolve(__dirname, '../../.env'),
    }),

    PrismaModule,
    AuthModule,
    AdminModule,
    BillingModule,
    MessagesModule,
    PropertiesModule,
    AgentsModule,
    ClientsModule,
    TeamModule,
    MediaModule,
    // WhatsappModule,
    PublicModule,
    ListingsModule, 
    OnboardingModule,
    DedupModule,
    IngestionModule,
    CollectionsModule,
    ShortlistsModule,
  ],
  controllers: [AppController, DealsController, DashboardController],
  providers:   [DealsService, DashboardService],

})
export class AppModule {}