import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { jwtVerify } from 'jose';
import { USER_ROLES, type UserRole } from '@corallo/shared';

import { getEnv } from '../config/env.js';
import { getJwks } from './jwks.js';
import type { AuthUser } from './types.js';

@Injectable()
export class AuthService {
  async verifyToken(token: string): Promise<AuthUser> {
    const env = getEnv();

    if (!env.cognitoIssuer || !env.cognitoJwksUrl) {
      throw new UnauthorizedException('Cognito issuer not configured');
    }

    const { payload } = await jwtVerify(token, getJwks(env.cognitoJwksUrl), {
      issuer: env.cognitoIssuer,
      audience: env.cognitoClientId ? [env.cognitoClientId] : undefined,
    });

    const tokenUse = String(payload['token_use'] ?? '');
    if (tokenUse !== 'id') {
      throw new UnauthorizedException('unauthorized');
    }

    const tenantId = String(payload['custom:tenant_id'] ?? '');
    const role = String(payload['custom:role'] ?? '') as UserRole;
    const sub = String(payload['sub'] ?? '');
    const email = payload['email'] ? String(payload['email']) : undefined;

    if (!tenantId) {
      throw new ForbiddenException('forbidden');
    }
    if (!sub) {
      throw new UnauthorizedException('unauthorized');
    }
    if (!USER_ROLES.includes(role)) {
      throw new ForbiddenException('forbidden');
    }

    return { sub, email, role, tenantId, tokenUse };
  }
}
