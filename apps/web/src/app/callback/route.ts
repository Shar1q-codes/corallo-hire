import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

import { getEnv } from '@/lib/env';

export async function GET(request: Request) {
  const env = getEnv();

  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const expectedState = cookies().get('auth_state')?.value;
  const verifier = cookies().get('pkce_verifier')?.value;

  if (!code || !verifier || !state || !expectedState || state !== expectedState) {
    return NextResponse.json({ error: 'Invalid callback state' }, { status: 400 });
  }


  const tokenUrl = `https://${env.cognitoDomain}/oauth2/token`;
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: env.cognitoClientId,
    code,
    redirect_uri: env.cognitoRedirectUri,
    code_verifier: verifier,
  });

  const tokenRes = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body,
  });

  if (!tokenRes.ok) {
    const text = await tokenRes.text();
    return NextResponse.json({ error: 'Token exchange failed', details: text }, { status: 500 });
  }

  const tokenJson = (await tokenRes.json()) as {
    access_token: string;
    id_token?: string;
    refresh_token?: string;
    expires_in?: number;
    token_type?: string;
  };

  const response = NextResponse.redirect(new URL('/app', request.url));
  const secure = process.env.NODE_ENV === 'production';

  response.cookies.set('access_token', tokenJson.access_token, {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/',
  });
  if (tokenJson.id_token) {
    response.cookies.set('id_token', tokenJson.id_token, {
      httpOnly: true,
      secure,
      sameSite: 'lax',
      path: '/',
    });
  }
  if (tokenJson.refresh_token) {
    response.cookies.set('refresh_token', tokenJson.refresh_token, {
      httpOnly: true,
      secure,
      sameSite: 'lax',
      path: '/',
    });
  }

  response.cookies.delete('pkce_verifier');
  response.cookies.delete('auth_state');

  return response;
}
