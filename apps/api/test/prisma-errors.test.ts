import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Prisma } from '@prisma/client';
import { ConflictException } from '@nestjs/common';

import { handlePrismaError } from '../src/common/prisma-errors';

function makeP2002(target: string[]) {
  return new Prisma.PrismaClientKnownRequestError('Unique constraint', {
    code: 'P2002',
    clientVersion: '5.22.0',
    meta: { target },
  } as any);
}

test('handlePrismaError maps P2002 to ConflictException with code/meta', () => {
  const err = makeP2002(['tenantId', 'email']);
  let thrown: ConflictException | undefined;

  try {
    handlePrismaError(err, 'Candidate already exists');
  } catch (error) {
    thrown = error as ConflictException;
  }

  assert.ok(thrown);
  const response = thrown?.getResponse() as any;
  assert.equal(response.statusCode, 409);
  assert.equal(response.code, 'DUPLICATE');
  assert.deepEqual(response.meta.target, ['tenantId', 'email']);
});

test('handlePrismaError uses message override', () => {
  const err = makeP2002(['tenantId', 'candidateId', 'jobId']);
  let thrown: ConflictException | undefined;

  try {
    handlePrismaError(err, 'Application already exists');
  } catch (error) {
    thrown = error as ConflictException;
  }

  assert.ok(thrown);
  const response = thrown?.getResponse() as any;
  assert.equal(response.message, 'Application already exists');
});
