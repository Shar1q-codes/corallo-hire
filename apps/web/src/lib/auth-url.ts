import type { WebEnv } from '@/lib/env';

export function buildAuthorizeUrl(env: WebEnv, state: string, challenge: string) {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: env.cognitoClientId,
    redirect_uri: env.cognitoRedirectUri,
    scope: 'openid email profile',
    code_challenge: challenge,
    code_challenge_method: 'S256',
    state,
  });

  return `https://${env.cognitoDomain}/oauth2/authorize?${params.toString()}`;
}
