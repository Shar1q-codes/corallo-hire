# Environment Variables

## Root
- `DATABASE_URL` (used by Prisma, API, worker, seed)
- `TEMPORAL_ADDRESS` (Temporal server address)
- `CORS_ORIGINS` (comma-separated allowlist for API CORS)
- `CORS_ALLOW_CREDENTIALS` (`true`/`false`)
- `COGNITO_REGION`
- `COGNITO_USER_POOL_ID`
- `COGNITO_CLIENT_ID`
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_COGNITO_DOMAIN`
- `NEXT_PUBLIC_COGNITO_CLIENT_ID`
- `NEXT_PUBLIC_COGNITO_REDIRECT_URI`

## apps/api
- `PORT` (default 4000)
- `DATABASE_URL`
- `TEMPORAL_ADDRESS`
- `COGNITO_REGION`
- `COGNITO_USER_POOL_ID`
- `COGNITO_CLIENT_ID` (optional audience validation)
- `CORS_ORIGINS`
- `CORS_ALLOW_CREDENTIALS`
- `S3_ENDPOINT` (S3-compatible endpoint for uploads; stubbed in MVP)
- `S3_BUCKET`
- `S3_ACCESS_KEY_ID`
- `S3_SECRET_ACCESS_KEY`
- `S3_REGION`

## apps/worker
- `DATABASE_URL`
- `TEMPORAL_ADDRESS`
- `TEMPORAL_TASK_QUEUE` (default `applications`)
- `OUTBOX_DISPATCH_INTERVAL_MS` (default `5000`)

## apps/web
- `NEXT_PUBLIC_API_URL` (default http://localhost:4000)
- `NEXT_PUBLIC_COGNITO_DOMAIN`
- `NEXT_PUBLIC_COGNITO_CLIENT_ID`
- `NEXT_PUBLIC_COGNITO_REDIRECT_URI`
