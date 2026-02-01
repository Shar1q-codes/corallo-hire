import { test } from 'node:test';
import assert from 'node:assert/strict';

import { getEnv } from '../src/config/env.js';

function withEnv(vars: Record<string, string | undefined>, fn: () => void) {
  const original = { ...process.env };
  Object.assign(process.env, vars);
  try {
    fn();
  } finally {
    process.env = original;
  }
}

test('requires cognito configuration and CORS_ORIGINS', () => {
  withEnv(
    {
      NODE_ENV: 'production',
      COGNITO_REGION: '',
      COGNITO_USER_POOL_ID: '',
      COGNITO_CLIENT_ID: '',
      CORS_ORIGINS: '',
    },
    () => {
      assert.throws(() => getEnv(true), /COGNITO_REGION and COGNITO_USER_POOL_ID are required/);
    },
  );
});

test('requires CORS_ORIGINS', () => {
  withEnv(
    {
      COGNITO_REGION: 'us-east-1',
      COGNITO_USER_POOL_ID: 'pool',
      COGNITO_CLIENT_ID: 'client',
      CORS_ORIGINS: '',
    },
    () => {
      assert.throws(() => getEnv(true), /CORS_ORIGINS must be set/);
    },
  );
});
