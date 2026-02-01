import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

function decodeJwt(token: string) {
  const [, payload] = token.split('.');
  if (!payload) return null;
  const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
  const json = Buffer.from(normalized, 'base64').toString('utf-8');
  return JSON.parse(json) as Record<string, unknown>;
}

export async function GET() {
  const idToken = cookies().get('id_token')?.value ?? cookies().get('access_token')?.value;
  if (!idToken) {
    return NextResponse.json({});
  }

  try {
    const payload = decodeJwt(idToken);
    if (!payload) {
      return NextResponse.json({});
    }
    return NextResponse.json({
      tenantId: payload['custom:tenant_id'],
      role: payload['custom:role'],
      email: payload['email'],
    });
  } catch {
    return NextResponse.json({});
  }
}
