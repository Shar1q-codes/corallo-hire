import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { getEnv } from '../config/env.js';
import { PUBLIC_KEY } from './decorators.js';
import { AuthService } from './auth.service.js';
const PUBLIC_PATHS = new Set(['/health', '/', '/favicon.ico']);

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext) {
    const isPublic =
      this.reflector.getAllAndOverride<boolean>(PUBLIC_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? false;

    const request = context.switchToHttp().getRequest();
    if (request.method === 'OPTIONS') {
      return true;
    }
    if (isPublic || PUBLIC_PATHS.has(request.path)) {
      return true;
    }

    const authHeader = request.headers.authorization;
    if (!authHeader) {
      throw new UnauthorizedException('unauthorized');
    }

    const token = authHeader.replace('Bearer ', '');
    if (!token) {
      throw new UnauthorizedException('unauthorized');
    }

    const user = await this.authService.verifyToken(token);
    if (!user.tenantId) {
      throw new ForbiddenException('forbidden');
    }

    request.auth = user;
    request.tenantId = user.tenantId;
    return true;
  }
}
