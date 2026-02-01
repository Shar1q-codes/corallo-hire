/** @type {import('next').NextConfig} */
const requiredEnv = [
  'NEXT_PUBLIC_COGNITO_DOMAIN',
  'NEXT_PUBLIC_COGNITO_CLIENT_ID',
  'NEXT_PUBLIC_COGNITO_REDIRECT_URI',
  'NEXT_PUBLIC_API_URL',
];

const missing = requiredEnv.filter((key) => !process.env[key]);
const isStrict =
  Boolean(process.env.CI) &&
  process.env.NODE_ENV === 'production' &&
  (Boolean(process.env.NETLIFY) || process.env.CONTEXT === 'production');

if (missing.length > 0) {
  if (isStrict) {
    throw new Error(`Missing required env vars: ${missing.join(', ')}`);
  }
  console.warn(`Warning: missing env vars for web build: ${missing.join(', ')}`);
}

const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@corallo/shared'],
  experimental: {
    typedRoutes: true,
  },
};

export default nextConfig;
