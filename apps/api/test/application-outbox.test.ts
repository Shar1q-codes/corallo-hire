import { test } from 'node:test';
import assert from 'node:assert/strict';

import { ApplicationService } from '../src/services/application.service.js';
import { getEnv } from '../src/config/env.js';

test('createApplication writes outbox entry', async () => {
  process.env.COGNITO_REGION = 'us-east-1';
  process.env.COGNITO_USER_POOL_ID = 'pool';
  process.env.COGNITO_CLIENT_ID = 'client';
  process.env.CORS_ORIGINS = 'http://localhost:3000';
  getEnv(true);

  const calls: string[] = [];
  const tx = {
    candidate: {
      findFirst: async () => ({ id: 'candidate-1' }),
    },
    job: {
      findFirst: async () => ({ id: 'job-1' }),
    },
    application: {
      create: async () => ({ id: 'app-1' }),
    },
    applicationEvent: {
      create: async () => {
        calls.push('event');
        return { id: 'event-1' };
      },
    },
    $executeRaw: async () => {
      calls.push('outbox');
      return 1;
    },
  };

  const prismaService = {
    withTenant: async (_tenantId: string, fn: any) => fn(tx),
  };
  const temporalService = {
    getClient: async () => ({
      workflow: {
        start: async () => undefined,
      },
    }),
  };

  const service = new ApplicationService(prismaService as any, temporalService as any);
  const user = { tenantId: 'tenant-1', role: 'ADMIN', sub: 'user-1', tokenUse: 'id' };

  const application = await service.createApplication(user as any, 'candidate-1', 'job-1');

  assert.equal(application.id, 'app-1');
  assert.ok(calls.includes('outbox'));
});
