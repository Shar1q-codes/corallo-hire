# Corallo Hire ATS MVP

## Quickstart (production-only)

```bash
pnpm i
pnpm infra:up
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Services:
- API: http://localhost:4000/health
- Web: http://localhost:3000
- Temporal UI: http://localhost:8233

## API usage (production-only)

1) Create a tenant
```bash
curl -X POST http://localhost:4000/tenants \
  -H "content-type: application/json" \
  -d '{"name":"Acme Recruiting"}'
```

2) Use a valid Cognito ID token for protected requests:
```bash
export AUTH_TOKEN=<id-token>
```

3) Create a job
```bash
curl -X POST http://localhost:4000/jobs \
  -H "content-type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -d '{"title":"Backend Engineer","location":"Remote","description":"Build hiring workflows","status":"OPEN"}'
```

4) Create a candidate
```bash
curl -X POST http://localhost:4000/candidates \
  -H "content-type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -d '{"email":"candidate@acme.test","fullName":"Jamie Candidate","phone":"555-0100"}'
```

5) Create an application (writes outbox row)
```bash
curl -X POST http://localhost:4000/applications \
  -H "content-type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -d '{"candidateId":"<candidate-id>","jobId":"<job-id>"}'
```

6) Fetch application after a few seconds
```bash
curl -X GET http://localhost:4000/applications/<application-id> \
  -H "Authorization: Bearer $AUTH_TOKEN"
```

## Production compose (local)

```bash
docker compose -f infra/docker/docker-compose.prod.yml up -d --build
```
Use `.env.example` as a baseline for required production env vars.

## Production-mode check

```bash
pnpm -r build
pnpm -r test
pnpm -C apps/api start:prod
pnpm -C apps/worker start:prod
```

## Production Verification Checklist

```bash
# 1) Start prod compose
docker compose -f infra/docker/docker-compose.prod.yml up -d --build

# 2) Open landing page
open http://localhost:3000

# 3) Login via Cognito (Hosted UI configured in env)
#    Visit http://localhost:3000/login and complete auth.

# 4) Call API endpoints with Authorization token
export AUTH_TOKEN=<id-token>
curl http://localhost:4000/jobs -H "Authorization: Bearer $AUTH_TOKEN"

# 5) x-tenant-id ignored (tenant derived from token only)
curl http://localhost:4000/jobs \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "x-tenant-id: 00000000-0000-0000-0000-000000000000"

# 6) Demonstrate RLS (cross-tenant read blocked)
#    Use two different tenant tokens and verify data isolation.

# 7) Create application and verify outbox + workflow
curl -X POST http://localhost:4000/applications \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "content-type: application/json" \
  -d '{"candidateId":"<candidate-id>","jobId":"<job-id>"}'

# 8) Migration + CORS checks
pnpm db:migrate
curl -I -H "Origin: https://evil.com" http://localhost:4000/health
```

## Docs
- `docs/ARCHITECTURE.md`
- `docs/ENV.md`
- `docs/PRODUCTION.md`
