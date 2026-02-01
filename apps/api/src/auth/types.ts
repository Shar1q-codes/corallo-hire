import type { UserRole } from '@corallo/shared';

export type AuthUser = {
  sub: string;
  email?: string;
  role: UserRole;
  tenantId: string;
  tokenUse: string;
};
