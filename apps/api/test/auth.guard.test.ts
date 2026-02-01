import { test } from 'node:test';
import assert from 'node:assert/strict';
import { UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { AuthGuard } from '../src/auth/auth.guard.js';
import { RolesGuard } from '../src/auth/roles.guard.js';
import { ROLES_KEY } from '../src/auth/decorators.js';
import { getEnv } from '../src/config/env.js';

const handler = () => undefined;
const controller = class Dummy {};

function createContext(request: any) {
  return {
    switchToHttp: () => ({ getRequest: () => request }),
    getHandler: () => handler,
    getClass: () => controller,
  } as any;
}

test('AuthGuard rejects missing token in cognito mode', async () => {
  process.env.COGNITO_REGION = 'us-east-1';
  process.env.COGNITO_USER_POOL_ID = 'pool';
  process.env.COGNITO_CLIENT_ID = 'client';
  process.env.CORS_ORIGINS = 'http://localhost:3000';
  getEnv(true);

  const reflector = new Reflector();
  const authService = {
    verifyToken: async () => ({
      sub: 'user',
      tenantId: 'tenant',
      role: 'ADMIN',
      tokenUse: 'id',
    }),
  };
  const guard = new AuthGuard(reflector, authService as any);

  const ctx = createContext({ headers: {}, path: '/jobs' });

  await assert.rejects(() => guard.canActivate(ctx), UnauthorizedException);
});

test('AuthGuard rejects token without tenant', async () => {
  process.env.COGNITO_REGION = 'us-east-1';
  process.env.COGNITO_USER_POOL_ID = 'pool';
  process.env.COGNITO_CLIENT_ID = 'client';
  process.env.CORS_ORIGINS = 'http://localhost:3000';
  getEnv(true);

  const reflector = new Reflector();
  const authService = {
    verifyToken: async () => ({
      sub: 'user',
      tenantId: '',
      role: 'ADMIN',
      tokenUse: 'id',
    }),
  };
  const guard = new AuthGuard(reflector, authService as any);
  const ctx = createContext({ headers: { authorization: 'Bearer token' }, path: '/jobs' });

  await assert.rejects(() => guard.canActivate(ctx), ForbiddenException);
});

test('RolesGuard rejects role mismatch', () => {
  const reflector = {
    getAllAndOverride: () => ['ADMIN'],
  } as unknown as Reflector;
  const guard = new RolesGuard(reflector);
  const ctx = createContext({ auth: { role: 'CANDIDATE' } });

  assert.throws(() => guard.canActivate(ctx), ForbiddenException);
});
