import { test } from 'node:test';
import assert from 'node:assert/strict';

import { buildCorsOptions } from '../src/config/cors.js';

test('cors allowlist permits configured origin and blocks others', async () => {
  const cors = buildCorsOptions({
    port: 4000,
    corsOrigins: ['https://allowed.example'],
    corsAllowCredentials: true,
  } as any);

  const originFn = cors.origin as (origin: string | undefined, cb: (err: Error | null, ok?: boolean) => void) => void;

  await new Promise<void>((resolve, reject) => {
    originFn('https://allowed.example', (err, ok) => {
      if (err) return reject(err);
      assert.equal(ok, true);
      resolve();
    });
  });

  await new Promise<void>((resolve) => {
    originFn('https://evil.example', (err, ok) => {
      assert.ok(err);
      assert.equal(ok, false);
      resolve();
    });
  });
});
