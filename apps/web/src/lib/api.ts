import { createFetchClient } from '@corallo/shared';

export const apiFetch = createFetchClient({
  baseUrl: '/api/proxy',
});
