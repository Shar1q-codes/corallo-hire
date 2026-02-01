import { Injectable } from '@nestjs/common';

import { prisma, withTenant } from '@corallo/db';
import type { Prisma } from '@prisma/client';

@Injectable()
export class PrismaService {
  prisma = prisma;

  async withTenant<T>(tenantId: string, fn: (tx: Prisma.TransactionClient) => Promise<T>) {
    return withTenant(this.prisma, tenantId, fn);
  }
}
