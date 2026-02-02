import type { WebEnv } from '@/lib/env';

type AuthorizeOptions = {
  screenHint?: 'signup' | 'login';
};

export function buildAuthorizeUrl(
  env: WebEnv,
  state: string,
  challenge: string,
  options?: AuthorizeOptions,
) {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: env.cognitoClientId,
    redirect_uri: env.cognitoRedirectUri,
    scope: 'openid email profile',
    code_challenge: challenge,
    code_challenge_method: 'S256',
    state,
  });
  if (options?.screenHint) {
    params.set('screen_hint', options.screenHint);
  }

  return `https://${env.cognitoDomain}/oauth2/authorize?${params.toString()}`;
}
