import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

import { getEnv } from '@/lib/env';

export async function GET(request: Request) {
  const env = getEnv();
  cookies().delete('access_token');
  cookies().delete('id_token');
  cookies().delete('refresh_token');

  const redirectUri = env.cognitoRedirectUri ?? new URL('/', request.url).toString();
  const params = new URLSearchParams({
    client_id: env.cognitoClientId,
    logout_uri: redirectUri,
  });

  const logoutUrl = `https://${env.cognitoDomain}/logout?${params.toString()}`;
  return NextResponse.redirect(logoutUrl);
}
