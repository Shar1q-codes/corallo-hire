import { test } from 'node:test';
import assert from 'node:assert/strict';
import { WorkflowExecutionAlreadyStartedError } from '@temporalio/client';

import { dispatchOutboxOnce } from '../src/outbox/dispatcher.js';

test('dispatchOutboxOnce marks dispatched on success', async () => {
  const updates: Array<{ id: string; status: string }> = [];
  let callCount = 0;
  const prisma = {
    $transaction: async (fn: any) => fn(prisma),
    $executeRawUnsafe: async () => 1,
    $executeRaw: async (_query: any) => {
      callCount += 1;
      if (callCount > 1 && callCount % 2 === 1) {
        updates.push({ id: '1', status: 'DISPATCHED' });
      }
      return 1;
    },
    $queryRaw: async () => [
      {
        id: '1',
        tenantId: 't1',
        type: 'START_SCORE_WORKFLOW',
        payloadJson: { applicationId: 'app1' },
        attempts: 1,
      },
    ],
  };

  const temporalClient = {
    workflow: {
      start: async () => undefined,
    },
  };

  const count = await dispatchOutboxOnce({
    prisma: prisma as any,
    temporalClient: temporalClient as any,
    taskQueue: 'applications',
  });

  assert.equal(count, 1);
  assert.deepEqual(updates, [{ id: '1', status: 'DISPATCHED' }]);
});

test('dispatchOutboxOnce treats already-started as success', async () => {
  const updates: Array<{ id: string; status: string }> = [];
  let callCount = 0;
  const prisma = {
    $transaction: async (fn: any) => fn(prisma),
    $executeRawUnsafe: async () => 1,
    $executeRaw: async () => {
      callCount += 1;
      if (callCount > 1 && callCount % 2 === 1) {
        updates.push({ id: '2', status: 'DISPATCHED' });
      }
      return 1;
    },
    $queryRaw: async () => [
      {
        id: '2',
        tenantId: 't1',
        type: 'START_SCORE_WORKFLOW',
        payloadJson: { applicationId: 'app2' },
        attempts: 1,
      },
    ],
  };

  const temporalClient = {
    workflow: {
      start: async () => {
        throw new WorkflowExecutionAlreadyStartedError('already started');
      },
    },
  };

  await dispatchOutboxOnce({
    prisma: prisma as any,
    temporalClient: temporalClient as any,
    taskQueue: 'applications',
  });

  assert.deepEqual(updates, [{ id: '2', status: 'DISPATCHED' }]);
});

test('dispatchOutboxOnce retries on failure', async () => {
  const updates: Array<{ id: string; status: string }> = [];
  let callCount = 0;
  const prisma = {
    $transaction: async (fn: any) => fn(prisma),
    $executeRawUnsafe: async () => 1,
    $executeRaw: async () => {
      callCount += 1;
      if (callCount > 1 && callCount % 2 === 1) {
        updates.push({ id: '3', status: 'PENDING' });
      }
      return 1;
    },
    $queryRaw: async () => [
      {
        id: '3',
        tenantId: 't1',
        type: 'START_SCORE_WORKFLOW',
        payloadJson: { applicationId: 'app3' },
        attempts: 2,
      },
    ],
  };

  const temporalClient = {
    workflow: {
      start: async () => {
        throw new Error('boom');
      },
    },
  };

  await dispatchOutboxOnce({
    prisma: prisma as any,
    temporalClient: temporalClient as any,
    taskQueue: 'applications',
    maxAttempts: 5,
  });

  assert.deepEqual(updates, [{ id: '3', status: 'PENDING' }]);
});
