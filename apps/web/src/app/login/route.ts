import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

import { getEnv } from '@/lib/env';
import { buildAuthorizeUrl } from '@/lib/auth-url';
import { createCodeChallenge, createCodeVerifier, createState } from '@/lib/pkce';

export async function GET(_request: Request) {
  const env = getEnv();

  const verifier = createCodeVerifier();
  const challenge = createCodeChallenge(verifier);
  const state = createState();

  cookies().set('pkce_verifier', verifier, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  });
  cookies().set('auth_state', state, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  });

  const url = buildAuthorizeUrl(env, state, challenge);
  return NextResponse.redirect(url);
}
