import { BadRequestException, Inject, Injectable } from '@nestjs/common';

import { PrismaService } from './prisma.service.js';

@Injectable()
export class TenantService {
  constructor(@Inject(PrismaService) private prismaService: PrismaService) {}

  async createTenant(name: string) {
    if (!name) {
      throw new BadRequestException('name required');
    }
    return this.prismaService.prisma.tenant.create({ data: { name } });
  }
}
