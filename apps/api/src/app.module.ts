import { Module } from '@nestjs/common';

import { HealthController } from './controllers/health.controller.js';
import { TenantsController } from './controllers/tenants.controller.js';
import { JobsController } from './controllers/jobs.controller.js';
import { CandidatesController } from './controllers/candidates.controller.js';
import { ApplicationsController } from './controllers/applications.controller.js';
import { PrismaService } from './services/prisma.service.js';
import { ApplicationService } from './services/application.service.js';
import { JobService } from './services/job.service.js';
import { CandidateService } from './services/candidate.service.js';
import { TenantService } from './services/tenant.service.js';
import { TemporalService } from './services/temporal.service.js';
import { StorageService } from './services/storage.service.js';
import { AuthModule } from './auth/auth.module.js';

@Module({
  imports: [AuthModule],
  controllers: [
    HealthController,
    TenantsController,
    JobsController,
    CandidatesController,
    ApplicationsController,
  ],
  providers: [
    PrismaService,
    ApplicationService,
    JobService,
    CandidateService,
    TenantService,
    TemporalService,
    StorageService,
  ],
})
export class AppModule {}
