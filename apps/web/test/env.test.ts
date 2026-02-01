import { test } from 'node:test';
import assert from 'node:assert/strict';

import { getEnv } from '../src/lib/env';

function withEnv(vars: Record<string, string | undefined>, fn: () => void) {
  const original = { ...process.env };
  Object.assign(process.env, vars);
  try {
    fn();
  } finally {
    process.env = original;
  }
}

test('requires Cognito env vars', () => {
  withEnv(
    {
      NODE_ENV: 'production',
      NEXT_PUBLIC_COGNITO_DOMAIN: '',
      NEXT_PUBLIC_COGNITO_CLIENT_ID: '',
      NEXT_PUBLIC_COGNITO_REDIRECT_URI: '',
    },
    () => {
      assert.throws(() => getEnv(), /Missing Cognito configuration/);
    },
  );
});
