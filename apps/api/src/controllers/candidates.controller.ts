import { Body, Controller, Get, Inject, Patch, Post, Query } from '@nestjs/common';
import { CandidateCreateSchema, CandidateSelfUpdateSchema } from '@corallo/shared';

import { CurrentUser, Roles } from '../auth/decorators.js';
import { CandidateService } from '../services/candidate.service.js';
import type { AuthUser } from '../auth/types.js';

@Controller('candidates')
export class CandidatesController {
  constructor(@Inject(CandidateService) private candidateService: CandidateService) {}

  @Get()
  @Roles('ADMIN', 'RECRUITER')
  async list(@CurrentUser() user: AuthUser, @Query('search') search?: string) {
    return this.candidateService.searchCandidates(user.tenantId, search);
  }

  @Post()
  @Roles('ADMIN', 'RECRUITER')
  async create(@CurrentUser() user: AuthUser, @Body() body: unknown) {
    const input = CandidateCreateSchema.parse(body);
    return this.candidateService.createCandidate(user.tenantId, input);
  }

  @Get('me')
  @Roles('CANDIDATE')
  async me(@CurrentUser() user: AuthUser) {
    return this.candidateService.getCandidateByEmail(user.tenantId, user.email ?? '');
  }

  @Patch('me')
  @Roles('CANDIDATE')
  async updateMe(@CurrentUser() user: AuthUser, @Body() body: unknown) {
    const input = CandidateSelfUpdateSchema.parse(body);
    return this.candidateService.updateCandidateByEmail(user.tenantId, user.email ?? '', input);
  }
}
