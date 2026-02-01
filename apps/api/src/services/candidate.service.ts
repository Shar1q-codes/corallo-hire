import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { Candidate } from '@prisma/client';

import { PrismaService } from './prisma.service.js';
import { handlePrismaError } from '../common/prisma-errors.js';

@Injectable()
export class CandidateService {
  constructor(@Inject(PrismaService) private prismaService: PrismaService) {}

  async searchCandidates(tenantId: string, query?: string) {
    return this.prismaService.withTenant(tenantId, async (tx) => {
      if (!query) {
        return tx.candidate.findMany({ where: { tenantId } });
      }

      const q = query.trim();
      const rows = await tx.$queryRaw<Candidate[]>`
        SELECT * FROM "Candidate"
        WHERE "tenantId" = ${tenantId}
          AND to_tsvector('english', "fullName" || ' ' || "email") @@ plainto_tsquery('english', ${q})
        ORDER BY "createdAt" DESC
        LIMIT 50
      `;

      return rows;
    });
  }

  async createCandidate(
    tenantId: string,
    data: { email: string; fullName: string; phone?: string | null },
  ) {
    try {
      return await this.prismaService.withTenant(tenantId, (tx) =>
        tx.candidate.create({
          data: {
            ...data,
            tenantId,
          },
        }),
      );
    } catch (error) {
      handlePrismaError(error, 'Candidate already exists');
    }
  }

  async getCandidateByEmail(tenantId: string, email: string) {
    if (!email) {
      throw new NotFoundException('candidate not found');
    }
    const candidate = await this.prismaService.withTenant(tenantId, (tx) =>
      tx.candidate.findFirst({ where: { tenantId, email } }),
    );
    if (!candidate) {
      throw new NotFoundException('candidate not found');
    }
    return candidate;
  }

  async updateCandidateByEmail(
    tenantId: string,
    email: string,
    data: { fullName?: string; phone?: string | null },
  ) {
    if (!email) {
      throw new NotFoundException('candidate not found');
    }
    const result = await this.prismaService.withTenant(tenantId, async (tx) =>
      tx.candidate.updateMany({ where: { tenantId, email }, data }),
    );
    if (result.count === 0) {
      throw new NotFoundException('candidate not found');
    }
    return this.getCandidateByEmail(tenantId, email);
  }
}
