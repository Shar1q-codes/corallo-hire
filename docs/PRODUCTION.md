# Production Guide

## Architecture
Corallo Hire runs as a monorepo with dedicated services for API, worker, and web. Production builds are compiled JS only and run with Docker images built from the repo.

## Cognito auth setup
1) Create a Cognito User Pool.
2) Configure an App Client (no secret for Hosted UI + PKCE).
3) Enable Hosted UI and set redirect URIs to your web domain (e.g. `https://app.example.com/callback`).
4) Add custom attributes:
   - `custom:tenant_id` (string UUID)
   - `custom:role` (`ADMIN`, `RECRUITER`, `CANDIDATE`)
5) Ensure tokens are ID tokens (the API enforces `token_use=id`).

Required env vars (see `.env.example`):
- `COGNITO_REGION`
- `COGNITO_USER_POOL_ID`
- `COGNITO_CLIENT_ID`
- `CORS_ORIGINS`
- `CORS_ALLOW_CREDENTIALS`
- `NEXT_PUBLIC_COGNITO_DOMAIN`
- `NEXT_PUBLIC_COGNITO_CLIENT_ID`
- `NEXT_PUBLIC_COGNITO_REDIRECT_URI`

## RLS behavior
All tenant-scoped tables enforce:
```
tenantId = current_setting('app.tenant_id')::uuid
```
The API sets `app.tenant_id` for every request transaction. The worker sets `app.worker=true` while claiming outbox rows and still uses `app.tenant_id` for tenant writes.

## Outbox behavior
Application creation writes an Outbox row with a deterministic idempotency key. The worker dispatcher:
- Claims PENDING rows.
- Starts `ScoreApplicationWorkflow` with `workflowId=score-application:<applicationId>`.
- Marks rows DISPATCHED or retries with backoff.

## Deployment flow (placeholder)
1) Build images with the provided Dockerfiles.
2) Run migrations (Prisma) against your production database using `pnpm db:migrate`.
3) Deploy API/worker/web (ECS or Kubernetes).
4) Set all required env vars as secrets.

Use `.env.example` as a baseline for required production env vars.

## Recommended AWS services
- ECS Fargate for services
- RDS Postgres
- CloudWatch Logs and metrics
