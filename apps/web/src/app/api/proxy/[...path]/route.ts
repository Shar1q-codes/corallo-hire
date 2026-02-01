import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

import { getEnv } from '@/lib/env';

async function proxy(request: NextRequest) {
  const env = getEnv();
  const url = new URL(request.url);
  const path = url.pathname.replace('/api/proxy', '');
  const targetUrl = `${env.apiUrl}${path}${url.search}`;

  const headers = new Headers(request.headers);
  headers.delete('host');

  const accessToken = cookies().get('access_token')?.value ?? cookies().get('id_token')?.value;
  if (accessToken) {
    headers.set('authorization', `Bearer ${accessToken}`);
  }

  const body =
    request.method === 'GET' || request.method === 'HEAD' ? undefined : await request.arrayBuffer();

  const response = await fetch(targetUrl, {
    method: request.method,
    headers,
    body,
    cache: 'no-store',
  });

  return new NextResponse(response.body, {
    status: response.status,
    headers: response.headers,
  });
}

export async function GET(request: NextRequest) {
  return proxy(request);
}
export async function POST(request: NextRequest) {
  return proxy(request);
}
export async function PUT(request: NextRequest) {
  return proxy(request);
}
export async function PATCH(request: NextRequest) {
  return proxy(request);
}
export async function DELETE(request: NextRequest) {
  return proxy(request);
}
