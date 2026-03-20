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
    WhatsappModule,
    PublicModule,
  ],
  controllers: [AppController],
})
export class AppModule {}