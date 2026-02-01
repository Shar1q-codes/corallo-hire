import type { Request } from 'express';

import type { AuthUser } from '../auth/types.js';

export type RequestContext = Request & {
  auth?: AuthUser;
  tenantId?: string;
};
