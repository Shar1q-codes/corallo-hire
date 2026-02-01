# Netlify Web Deploy

This repo deploys the Next.js app located at `apps/web` using Netlify Next Runtime.

## Netlify settings
- Base directory: `apps/web`
- Build command: `turbo run build --filter @corallo/web`
- Publish directory: `apps/web/.next`
- Node version: `20`

## Required Netlify environment variables (production)
```
NEXT_PUBLIC_COGNITO_DOMAIN=your-domain.auth.us-east-1.amazoncognito.com
NEXT_PUBLIC_COGNITO_CLIENT_ID=your-client-id
NEXT_PUBLIC_COGNITO_REDIRECT_URI=https://your-domain/callback
NEXT_PUBLIC_API_URL=https://api.your-domain
NODE_VERSION=20
```

Notes:
- `NEXT_PUBLIC_API_URL` can be a placeholder to pass build, but runtime API calls will fail until the API is deployed.
- Cognito settings must match the Hosted UI configuration.
