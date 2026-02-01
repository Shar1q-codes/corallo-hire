import crypto from 'node:crypto';

function base64UrlEncode(buffer: Buffer) {
  return buffer
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export function createCodeVerifier() {
  return base64UrlEncode(crypto.randomBytes(32));
}

export function createCodeChallenge(verifier: string) {
  const hash = crypto.createHash('sha256').update(verifier).digest();
  return base64UrlEncode(hash);
}

export function createState() {
  return base64UrlEncode(crypto.randomBytes(16));
}
