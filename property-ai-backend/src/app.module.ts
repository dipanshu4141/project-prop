// import { Module } from '@nestjs/common';
// import { AppController } from './app.controller';
// import { AppService } from './app.service';

// @Module({
//   imports: [],
//   controllers: [AppController],
//   providers: [AppService],
// })
// export class AppModule {}

import { Module } from '@nestjs/common';
import { PropertiesModule } from './modules/properties/properties.module';
import { TeamModule } from './modules/team/team.module';
import { PrismaModule } from './prisma/prisma.module';
import { AppController } from './app.controller';
import { WhatsappModule } from './modules/whatsapp/whatsapp.module';
import { MessagesModule } from './modules/messages/messages.module';
import { AgentsModule } from './modules/agents/agents.module';
import { ClientsModule } from './modules/clients/clients.module';

@Module({
  imports: [PrismaModule , MessagesModule, PropertiesModule, AgentsModule, WhatsappModule, TeamModule, ClientsModule],
  controllers: [AppController],
})
export class AppModule {}
