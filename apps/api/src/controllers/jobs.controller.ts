import { Body, Controller, Get, Inject, Post, Query } from '@nestjs/common';
import { JobCreateSchema } from '@corallo/shared';

import { CurrentUser, Roles } from '../auth/decorators.js';
import { JobService } from '../services/job.service.js';
import type { AuthUser } from '../auth/types.js';

@Controller('jobs')
export class JobsController {
  constructor(@Inject(JobService) private jobService: JobService) {}

  @Get()
  @Roles('ADMIN', 'RECRUITER', 'CANDIDATE')
  async list(@CurrentUser() user: AuthUser, @Query('search') search?: string) {
    return this.jobService.searchJobs(user, search);
  }

  @Post()
  @Roles('ADMIN', 'RECRUITER')
  async create(@CurrentUser() user: AuthUser, @Body() body: unknown) {
    const input = JobCreateSchema.parse(body);
    return this.jobService.createJob(user.tenantId, input);
  }
}
