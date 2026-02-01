/** @type {import('next').NextConfig} */
if (
  !process.env.NEXT_PUBLIC_COGNITO_DOMAIN ||
  !process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID ||
  !process.env.NEXT_PUBLIC_COGNITO_REDIRECT_URI
) {
  throw new Error('Missing Cognito configuration');
}

const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@corallo/shared'],
  experimental: {
    typedRoutes: true,
  },
};

export default nextConfig;
