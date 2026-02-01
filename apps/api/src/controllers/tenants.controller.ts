import { Body, Controller, Inject, Post } from '@nestjs/common';
import { TenantCreateSchema } from '@corallo/shared';

import { Public } from '../auth/decorators.js';
import { TenantService } from '../services/tenant.service.js';

@Controller('tenants')
export class TenantsController {
  constructor(@Inject(TenantService) private tenantService: TenantService) {}

  @Post()
  @Public()
  async create(@Body() body: unknown) {
    const input = TenantCreateSchema.parse(body);
    return this.tenantService.createTenant(input.name);
  }
}
