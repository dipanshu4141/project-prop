import { Module } from '@nestjs/common';
import { AdminController }           from './admin.controller';
import { AdminPropertiesService }    from './admin-properties.service';
import { AdminWorkspacesService }    from './admin-workspaces.service';
import { AdminUsersService }         from './admin-users.service';
import { AdminSubscriptionsService } from './admin-subscriptions.service';
import { AdminAuditService }         from './admin-audit.service';
import { HealthService }             from './health.service';   // ← add
import { PrismaModule }              from '../../core/prisma/prisma.module';
import { DedupModule } from '../dedup/dedup.module';

@Module({
  imports:     [PrismaModule, DedupModule],
  controllers: [AdminController],
  providers: [
    AdminPropertiesService,
    AdminWorkspacesService,
    AdminUsersService,
    AdminSubscriptionsService,
    AdminAuditService,
    HealthService,   // ← add
  ],
})
export class AdminModule {}