import { Inject, Injectable } from '@nestjs/common';
import { Prisma, type Job } from '@prisma/client';
import type { JobStatus } from '@corallo/shared';

import { PrismaService } from './prisma.service.js';
import { handlePrismaError } from '../common/prisma-errors.js';
import type { AuthUser } from '../auth/types.js';

@Injectable()
export class JobService {
  constructor(@Inject(PrismaService) private prismaService: PrismaService) {}

  async searchJobs(user: AuthUser, query?: string) {
    return this.prismaService.withTenant(user.tenantId, async (tx) => {
      const statusFilter = user.role === 'CANDIDATE' ? { status: 'OPEN' as JobStatus } : {};

      if (!query) {
        return tx.job.findMany({ where: { tenantId: user.tenantId, ...statusFilter } });
      }

      const q = query.trim();
      const statusSql =
        user.role === 'CANDIDATE' ? Prisma.sql` AND "status" = 'OPEN'` : Prisma.empty;
      const rows = await tx.$queryRaw<Job[]>`
        SELECT * FROM "Job"
        WHERE "tenantId" = ${user.tenantId}
          ${statusSql}
          AND to_tsvector('english', "title" || ' ' || "description") @@ plainto_tsquery('english', ${q})
        ORDER BY "createdAt" DESC
        LIMIT 50
      `;

      return rows;
    });
  }

  async createJob(
    tenantId: string,
    data: { title: string; description: string; location?: string; status?: JobStatus },
  ) {
    try {
      return await this.prismaService.withTenant(tenantId, (tx) =>
        tx.job.create({
          data: {
            ...data,
            tenantId,
          },
        }),
      );
    } catch (error) {
      handlePrismaError(error, 'Job already exists');
    }
  }
}
