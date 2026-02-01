import { randomUUID } from 'node:crypto';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ApplicationStatus, Prisma } from '@prisma/client';

import { PrismaService } from './prisma.service.js';
import { TemporalService } from './temporal.service.js';
import { handlePrismaError } from '../common/prisma-errors.js';
import type { AuthUser } from '../auth/types.js';

@Injectable()
export class ApplicationService {
  constructor(
    @Inject(PrismaService) private prismaService: PrismaService,
    @Inject(TemporalService) private temporalService: TemporalService,
  ) {}

  async listApplications(user: AuthUser, listFlag?: string) {
    if (!listFlag) {
      return [];
    }
    return this.prismaService.withTenant(user.tenantId, async (tx) => {
      const candidateId =
        user.role === 'CANDIDATE' ? await this.getCandidateIdForUser(tx, user) : undefined;
      return tx.application.findMany({
        where: {
          tenantId: user.tenantId,
          ...(candidateId ? { candidateId } : {}),
        },
        include: {
          candidate: true,
          job: true,
          scores: true,
          explanations: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    });
  }

  async createApplication(user: AuthUser, candidateId: string, jobId: string) {
    const tenantId = user.tenantId;

    const application = await this.prismaService.withTenant(tenantId, async (tx) => {
      const resolvedCandidateId =
        user.role === 'CANDIDATE' ? await this.getCandidateIdForUser(tx, user) : candidateId;

      const candidate = await tx.candidate.findFirst({
        where: { id: resolvedCandidateId, tenantId },
      });
      if (!candidate) {
        throw new NotFoundException('candidate not found');
      }

      const job = await tx.job.findFirst({
        where: { id: jobId, tenantId },
      });
      if (!job) {
        throw new NotFoundException('job not found');
      }

      let application;
      try {
        application = await tx.application.create({
          data: {
            tenantId,
            candidateId: resolvedCandidateId,
            jobId,
            status: 'APPLIED',
          },
        });
      } catch (error) {
        handlePrismaError(error, 'Application already exists');
      }
      if (!application) {
        throw new Error('Application not created');
      }

      await tx.applicationEvent.create({
        data: {
          tenantId,
          applicationId: application.id,
          type: 'APPLIED',
          payloadJson: { source: 'api' },
        },
      });

      const outboxId = randomUUID();
      await tx.$executeRaw`
        INSERT INTO "Outbox" ("id", "tenantId", "type", "payloadJson", "idempotencyKey")
        VALUES (
          ${outboxId},
          ${tenantId},
          'START_SCORE_WORKFLOW',
          ${JSON.stringify({ applicationId: application.id })}::jsonb,
          ${`score-workflow:${application.id}`}
        )
      `;

      return application;
    });

    return application;
  }

  async updateStatus(
    tenantId: string,
    applicationId: string,
    status: ApplicationStatus,
    payload: Prisma.InputJsonValue,
  ) {
    const result = await this.prismaService.withTenant(tenantId, async (tx) => {
      const result = await tx.application.updateMany({
        where: { id: applicationId, tenantId },
        data: { status },
      });

      if (result.count === 0) {
        throw new NotFoundException('application not found');
      }

      await tx.applicationEvent.create({
        data: {
          tenantId,
          applicationId,
          type: `STATUS_${status}`,
          payloadJson: payload,
        },
      });

      return result;
    });

    if (!result) {
      throw new NotFoundException('application not found');
    }

    return this.prismaService.withTenant(tenantId, (tx) =>
      tx.application.findFirst({
        where: { id: applicationId, tenantId },
        include: {
          candidate: true,
          job: true,
          events: true,
          scores: true,
          explanations: true,
        },
      }),
    );
  }

  async getApplication(user: AuthUser, applicationId: string) {
    return this.prismaService.withTenant(user.tenantId, async (tx) => {
      const candidateId =
        user.role === 'CANDIDATE' ? await this.getCandidateIdForUser(tx, user) : undefined;
      return tx.application.findFirst({
        where: {
          id: applicationId,
          tenantId: user.tenantId,
          ...(candidateId ? { candidateId } : {}),
        },
        include: {
          candidate: true,
          job: true,
          events: true,
          scores: true,
          explanations: true,
        },
      });
    });
  }

  private async getCandidateIdForUser(tx: Prisma.TransactionClient, user: AuthUser) {
    if (!user.email) {
      throw new NotFoundException('candidate not found');
    }
    const candidate = await tx.candidate.findFirst({
      where: { tenantId: user.tenantId, email: user.email },
    });
    if (!candidate) {
      throw new NotFoundException('candidate not found');
    }
    return candidate.id;
  }
}
