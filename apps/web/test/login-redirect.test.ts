import { test } from 'node:test';
import assert from 'node:assert/strict';

import { buildAuthorizeUrl } from '../src/lib/auth-url';
import type { WebEnv } from '../src/lib/env';

test('login redirect uses Cognito domain and includes redirect_uri', () => {
  const env: WebEnv = {
    apiUrl: 'https://api.example.com',
    cognitoDomain: 'auth.example.com',
    cognitoClientId: 'client-id',
    cognitoRedirectUri: 'https://acme.example/callback',
  };

  const url = buildAuthorizeUrl(env, 'state-1', 'challenge-1');
  assert.ok(url.startsWith('https://auth.example.com/oauth2/authorize?'));
  assert.ok(url.includes('redirect_uri=https%3A%2F%2Facme.example%2Fcallback'));
});
