import { Body, Controller, Get, Inject, Param, Post, Query } from '@nestjs/common';
import { ApplicationCreateSchema, StatusUpdateSchema } from '@corallo/shared';

import { CurrentUser, Roles } from '../auth/decorators.js';
import { ApplicationService } from '../services/application.service.js';
import type { AuthUser } from '../auth/types.js';

@Controller('applications')
export class ApplicationsController {
  constructor(@Inject(ApplicationService) private applicationService: ApplicationService) {}

  @Get()
  @Roles('ADMIN', 'RECRUITER', 'CANDIDATE')
  async list(@CurrentUser() user: AuthUser, @Query('list') list?: string) {
    if (list) {
      return this.applicationService.listApplications(user, list);
    }
    return [];
  }

  @Post()
  @Roles('ADMIN', 'RECRUITER', 'CANDIDATE')
  async create(@CurrentUser() user: AuthUser, @Body() body: unknown) {
    const input = ApplicationCreateSchema.parse(body);
    return this.applicationService.createApplication(user, input.candidateId, input.jobId);
  }

  @Get(':id')
  @Roles('ADMIN', 'RECRUITER', 'CANDIDATE')
  async get(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.applicationService.getApplication(user, id);
  }

  @Post(':id/status')
  @Roles('ADMIN', 'RECRUITER')
  async updateStatus(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() body: unknown) {
    const input = StatusUpdateSchema.parse(body);
    return this.applicationService.updateStatus(user.tenantId, id, input.status, {
      reason: input.reason ?? null,
    });
  }
}
