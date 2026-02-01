import { test } from 'node:test';
import assert from 'node:assert/strict';

import { AppModule } from '../src/app.module';

test('app module loads', () => {
  assert.ok(AppModule);
});
