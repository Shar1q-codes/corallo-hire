import { test } from 'node:test';
import assert from 'node:assert/strict';

import { ScoreApplicationWorkflow } from '../src/workflows/score-application';

test('workflow module loads', () => {
  assert.ok(ScoreApplicationWorkflow);
});
