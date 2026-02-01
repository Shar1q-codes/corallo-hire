import { createRemoteJWKSet } from 'jose';

let cachedJwks: ReturnType<typeof createRemoteJWKSet> | null = null;

export function getJwks(jwksUrl: string) {
  if (!cachedJwks) {
    cachedJwks = createRemoteJWKSet(new URL(jwksUrl));
  }
  return cachedJwks;
}
