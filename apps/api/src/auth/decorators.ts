import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common';

import type { AuthUser } from './types.js';

export const ROLES_KEY = 'roles';
export const PUBLIC_KEY = 'public';

export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
export const Public = () => SetMetadata(PUBLIC_KEY, true);

export const CurrentUser = createParamDecorator((_, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  return request.auth as AuthUser | undefined;
});
