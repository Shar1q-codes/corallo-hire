import { WorkflowExecutionAlreadyStartedError } from '@temporalio/client';
import type { Client } from '@temporalio/client';
import { Prisma, type PrismaClient } from '@prisma/client';

export type OutboxRow = {
  id: string;
  tenantId: string;
  type: string;
  payloadJson: { applicationId?: string };
  status: string;
  idempotencyKey: string;
  attempts: number;
  nextRunAt: Date;
};

type DispatcherOptions = {
  prisma: PrismaClient;
  temporalClient: Client;
  taskQueue: string;
  maxAttempts?: number;
  batchSize?: number;
};

async function withWorker<T>(prisma: PrismaClient, fn: (tx: Prisma.TransactionClient) => Promise<T>) {
  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    await tx.$executeRaw`SELECT set_config('app.worker', 'true', true)`;
    return fn(tx);
  });
}

async function claimOutboxBatch(prisma: PrismaClient, batchSize: number) {
  return withWorker(prisma, (tx) =>
    tx.$queryRaw<OutboxRow[]>`
      UPDATE "Outbox"
      SET "attempts" = "attempts" + 1,
          "nextRunAt" = NOW() + INTERVAL '1 minute'
      WHERE "id" IN (
        SELECT "id"
        FROM "Outbox"
        WHERE "status" = 'PENDING'
          AND "nextRunAt" <= NOW()
        ORDER BY "createdAt" ASC
        FOR UPDATE SKIP LOCKED
        LIMIT ${batchSize}
      )
      RETURNING *
    `,
  );
}

async function markDispatched(prisma: PrismaClient, id: string) {
  return withWorker(prisma, (tx) =>
    tx.$executeRaw`
      UPDATE "Outbox"
      SET "status" = 'DISPATCHED'
      WHERE "id" = ${id}
    `,
  );
}

async function markFailed(prisma: PrismaClient, id: string, status: 'PENDING' | 'FAILED', nextRunAt: Date) {
  return withWorker(prisma, (tx) =>
    tx.$executeRaw`
      UPDATE "Outbox"
      SET "status" = ${status}, "nextRunAt" = ${nextRunAt}
      WHERE "id" = ${id}
    `,
  );
}

export async function dispatchOutboxOnce({
  prisma,
  temporalClient,
  taskQueue,
  maxAttempts = 5,
  batchSize = 10,
}: DispatcherOptions) {
  const rows = await claimOutboxBatch(prisma, batchSize);

  for (const row of rows) {
    const applicationId = row.payloadJson?.applicationId;
    if (row.type !== 'START_SCORE_WORKFLOW' || !applicationId) {
      await markFailed(prisma, row.id, 'FAILED', new Date());
      continue;
    }

    try {
      await temporalClient.workflow.start('ScoreApplicationWorkflow', {
        taskQueue,
        args: [applicationId, row.tenantId],
        workflowId: `score-application:${applicationId}`,
      });
      await markDispatched(prisma, row.id);
    } catch (error) {
      if (error instanceof WorkflowExecutionAlreadyStartedError) {
        await markDispatched(prisma, row.id);
        continue;
      }

      const attempts = row.attempts;
      const shouldFail = attempts >= maxAttempts;
      const delayMs = Math.min(10 * 60_000, Math.pow(2, attempts) * 1000);
      const nextRunAt = new Date(Date.now() + delayMs);
      await markFailed(prisma, row.id, shouldFail ? 'FAILED' : 'PENDING', nextRunAt);
    }
  }

  return rows.length;
}
