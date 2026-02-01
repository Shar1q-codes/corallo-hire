# Production Shortcomings Audit

## 0. Executive Summary
- Auth bypass via dev mode is removed; Cognito JWT is mandatory and tenant identity is derived from claims only. (Critical) FIXED
- Web /login redirect now preserves the current host and always uses Cognito Hosted UI. (High) FIXED
- Production migrations now use `prisma migrate deploy` via `pnpm db:migrate`. (High) FIXED
- API now enforces an explicit CORS allowlist (required in production). (High) FIXED
- RLS is enabled, but tenant context relies on app-layer and lacks a hard fail if not set. (Medium)
- Outbox dispatch is functional but lacks DLQ/alerting; retries are implicit. (Medium)
- Docker images run as root and include full node_modules (dev deps) in runtime images. (Medium)
- Observability is minimal: no trace exporter configured; logs lack tenant/user correlation. (Medium)
- UX gaps: no token refresh, no auth error UI, and candidate self-service relies on email claim. (Low/Medium)

## 1. Critical (must fix before any deployment)

### AUD-CRIT-0001 -- Auth bypass in production defaults (dev mode + tenant header) FIXED
Severity: Critical

Impact: Any request could spoof x-tenant-id and bypass JWT auth if dev bypass exists. This enables cross-tenant access and defeats authentication.

Evidence (fixed state):
- `apps/api/src/auth/auth.guard.ts` (~lines 26-44)
  ```ts
  const authHeader = request.headers.authorization;
  if (!authHeader) {
    throw new UnauthorizedException('unauthorized');
  }
  ```
- `apps/api/src/config/env.ts` (~lines 12-25)
  ```ts
  const env = {
    nodeEnv,
    port: Number(process.env.PORT ?? 4000),
    corsOrigins: splitCommaList(process.env.CORS_ORIGINS ?? ''),
    cognitoRegion: requireEnv('COGNITO_REGION'),
    cognitoUserPoolId: requireEnv('COGNITO_USER_POOL_ID'),
    cognitoClientId: requireEnv('COGNITO_CLIENT_ID'),
  };
  ```
- `apps/web/src/middleware.ts` (~lines 7-15)
  ```ts
  const token = request.cookies.get('access_token')?.value ?? request.cookies.get('id_token')?.value;
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }
  ```

Root Cause: Production defaults previously allowed dev mode without guardrails.

Resolution: Dev mode removed entirely; API/Web require Cognito envs and do not accept tenant headers.

Verification:
1) `curl http://localhost:4000/jobs` returns 401.
2) `curl http://localhost:4000/jobs -H "Authorization: Bearer <token>"` returns 200.

## 2. High (fix before beta)

### AUD-HIGH-0001 -- /login redirects to localhost in non-cognito mode FIXED
Severity: High

Impact: /login could redirect to http://localhost:3000 in production, breaking auth on real hosts.

Evidence (fixed state):
- `apps/web/src/app/login/route.ts` (~lines 6-15)
  ```ts
  const env = getEnv();
  const redirect = new URL('/callback', request.url);
  redirect.searchParams.set('redirect_uri', env.cognitoRedirectUri);
  ```

Root Cause: Prior redirect used a hardcoded localhost base in non-cognito mode.

Resolution: /login always uses request.url as the base and redirects to Cognito Hosted UI.

Verification:
1) Visit `http://<your-host>/login`.
2) Redirect stays on the same host.

### AUD-HIGH-0002 -- Production migration command uses prisma migrate dev FIXED
Severity: High

Impact: migrate dev is destructive and intended for development only.

Evidence (fixed state):
- `package.json` (~line 15)
  ```json
  "db:migrate": "pnpm -C packages/db prisma migrate deploy"
  ```

Root Cause: Dev-only migration command was wired as the primary migration script.

Resolution: Production migration uses `prisma migrate deploy` via `pnpm db:migrate`.

Verification:
1) `pnpm db:migrate` runs `prisma migrate deploy`.

### AUD-HIGH-0003 -- API CORS is wide open (no origin allowlist) FIXED
Severity: High

Impact: Any origin could call the API; if tokens leak to a hostile origin, calls can succeed.

Evidence (fixed state):
- `apps/api/src/config/cors.ts` (~lines 9-24)
  ```ts
  return {
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) {
        return callback(null, true);
      }
      return callback(new Error('CORS origin not allowed'), false);
    },
    allowedHeaders: ['Authorization', 'Content-Type', 'x-request-id'],
  };
  ```

Root Cause: CORS enabled globally without origin control.

Resolution: Env-driven allowlist required in production.

Verification:
1) `curl -I -H "Origin: https://evil.com" http://localhost:4000/health` has no ACAO for evil origin.

## 3. Medium (fix soon)

### AUD-MED-0001 -- Cognito token type & claim handling not documented or flexible
Severity: Medium

Impact: API enforces `token_use=id` without documenting access-token support. If the UI supplies access tokens, all requests fail.

Evidence:
- `apps/api/src/auth/auth.service.ts` (~lines 18-24)
  ```ts
  const tokenUse = String(payload['token_use'] ?? '');
  if (tokenUse !== 'id') {
    throw new UnauthorizedException('unauthorized');
  }
  ```

Root Cause: Strict token_use requirement without shared contract in docs or UI.

Recommended Fix (minimal): Document required token type clearly and enforce in web auth flow.
Recommended Fix (long-term): Allow access tokens with aud validation and scopes.

Verification: Use an access token to call /jobs and confirm behavior is documented.

### AUD-MED-0002 -- No refresh flow or token expiry handling in web
Severity: Medium

Impact: Sessions silently expire; UX failures without guidance.

Evidence:
- `apps/web/src/app/callback/route.ts` sets `refresh_token` but no usage later.
  ```ts
  response.cookies.set('refresh_token', tokenJson.refresh_token, { ... })
  ```

Root Cause: Auth flow stores refresh token but does not implement renewal or expiry handling.

Recommended Fix (minimal): Add /api/refresh route to exchange refresh token for a new access token.
Recommended Fix (long-term): Implement session management with rolling refresh and UI signals on expiry.

Verification: Wait until access token expires; ensure app can refresh or redirects to login.

### AUD-MED-0003 -- Outbox has no DLQ or alerting
Severity: Medium

Impact: Failed workflow dispatches can become stuck with no notification or remediation.

Evidence:
- `apps/worker/src/outbox/dispatcher.ts` (~lines 64-108) has retries and FAILED, but no monitoring or escalation.

Root Cause: Missing operational handling for permanently failed outbox rows.

Recommended Fix (minimal): Add logging + metric + manual requeue endpoint.
Recommended Fix (long-term): Add DLQ table + alerting/notification pipeline.

Verification: Force dispatcher errors; confirm failed records surface in logs/metrics.

### AUD-MED-0004 -- Docker runtime images run as root and include dev deps
Severity: Medium

Impact: Increased attack surface and larger images.

Evidence:
- `apps/api/Dockerfile`, `apps/worker/Dockerfile`, `apps/web/Dockerfile` have no USER and copy full node_modules.

Root Cause: Simplified Dockerfiles without hardening.

Recommended Fix (minimal): Use USER node and prune dev deps.
Recommended Fix (long-term): Multi-stage build with production-only deps and slim runtime image.

Verification: Inspect image user and contents; ensure non-root and prod deps only.

### AUD-MED-0005 -- Observability lacks exporter + correlation
Severity: Medium

Impact: Traces likely do not export anywhere; logs lack request/tenant correlation.

Evidence:
- `apps/api/src/telemetry.ts` and `apps/worker/src/telemetry.ts` initialize SDK but no exporter config.
- `apps/api/src/middleware/request-id.middleware.ts` sets x-request-id but logs do not include it.

Root Cause: OTel SDK initialized without exporter and log integration.

Recommended Fix (minimal): Add OTLP exporter env config; include requestId/tenantId/userId in logs.
Recommended Fix (long-term): Add centralized logging + tracing dashboards/alerts.

Verification: Ensure spans appear in collector; logs include request/tenant IDs.

### AUD-MED-0006 -- RLS enforcement depends on app-layer enforcement
Severity: Medium

Impact: If any code path accesses Prisma without withTenant, data reads fail or are inconsistent.

Evidence:
- `packages/db/src/with-tenant.ts` sets app.tenant_id.
- No guardrail to prevent direct Prisma usage without tenant context.

Root Cause: No guardrail to prevent non-tenant-scoped queries.

Recommended Fix (minimal): Add Prisma middleware guard to require tenant context.
Recommended Fix (long-term): Wrap Prisma in tenant-scoped service and prohibit direct usage.

Verification: Introduce a query without withTenant and ensure it fails fast in tests.

### AUD-MED-0007 -- Candidate self-access relies on email claim only
Severity: Medium

Impact: If email changes, candidate identity breaks.

Evidence:
- `apps/api/src/controllers/candidates.controller.ts` uses user.email for /candidates/me.
- `apps/api/src/services/candidate.service.ts` finds by tenantId + email.

Root Cause: No stable user-to-candidate mapping (e.g., user id).

Recommended Fix (minimal): Enforce email verification and uniqueness in Cognito.
Recommended Fix (long-term): Store userId on Candidate and map by sub claim.

Verification: Ensure candidate profile retrieval uses stable identifier.

## 4. Low (fix when convenient)

### AUD-LOW-0001 -- Auth middleware files are unused but still present FIXED
Severity: Low

Impact: Confusion/maintenance risk; unused JWT verification path could mislead.

Evidence (fixed state):
- `apps/api/src/middleware/auth.middleware.ts` removed.

Resolution: Removed unused middleware and tenant header handling.

Verification: No references remain to legacy auth middleware.

### AUD-LOW-0002 -- API uses permissive error messages for auth FIXED
Severity: Low

Impact: Slight information leak (which claim missing).

Evidence (fixed state):
- `apps/api/src/auth/auth.service.ts` now throws generic unauthorized/forbidden messages.

Resolution: Generic 401/403 error messages.

Verification: Invalid tokens return generic messages.

## 5. Known Good confirmations
- `apps/web/src/middleware.ts` matcher only covers `/app/:path*`, so it does not intercept `/_next/*` or public routes.
- `@corallo/shared` is built to dist and exported via package.json; runtime uses compiled JS.
- Outbox claim query uses FOR UPDATE SKIP LOCKED for concurrency.
- RLS policies exist for tenant-scoped tables and withTenant sets app.tenant_id.
- Workflow start uses deterministic workflowId `score-application:<applicationId>` for idempotency.
- Docker compose dev/prod for Temporal uses prebuilt image and no runtime package installs.

## 6. Reproduction steps / Proof

### Repro 1: Auth bypass (fixed behavior)
```
curl http://localhost:4000/jobs
```
Expected: 401 without JWT in production-only mode.

### Repro 2: /login redirect host preservation
```
open http://<your-host>/login
```
Expected: redirect stays on the current host.

### Repro 3: Production migration
```
pnpm db:migrate
```
Expected: uses prisma migrate deploy.

### Repro 4: CORS allowlist
```
curl -H "Origin: http://evil.example" -I http://localhost:4000/health
```
Expected: CORS blocked for unapproved origins.

## 7. Fix plans (per issue)

### AUD-CRIT-0001
- Minimal: Require Cognito env vars and reject all unauthenticated requests.
- Long-term: Add auth regression tests in CI with token verification.

### AUD-HIGH-0001
- Minimal: Use request.url as redirect base for /login.
- Long-term: Add explicit auth error UI for invalid config.

### AUD-HIGH-0002
- Minimal: Use prisma migrate deploy for production.
- Long-term: CI/CD migration job with backups and rollback plan.

### AUD-HIGH-0003
- Minimal: Use env-driven CORS allowlist.
- Long-term: Add CSP, security headers, rate limits.

### AUD-MED-0001
- Minimal: Document id-token requirement; ensure web auth flow uses id_token.
- Long-term: Validate access tokens and scopes; allow both types with strict validation.

### AUD-MED-0002
- Minimal: Add refresh endpoint to rotate access token.
- Long-term: Full session management with background refresh and UI state.

### AUD-MED-0003
- Minimal: Log and expose failed outbox rows with admin endpoint.
- Long-term: DLQ + alerting on failure thresholds.

### AUD-MED-0004
- Minimal: Switch to non-root user and prune dev deps.
- Long-term: Harden images (distroless) with SBOM and vulnerability scanning.

### AUD-MED-0005
- Minimal: Add OTLP exporter env config; include requestId/tenantId in logs.
- Long-term: Add trace/metrics dashboards and alerts.

### AUD-MED-0006
- Minimal: Add Prisma middleware guard to require tenant context.
- Long-term: Wrap Prisma in tenant-scoped service and prohibit direct usage.

### AUD-MED-0007
- Minimal: Require verified email claims; document uniqueness.
- Long-term: Store userId on Candidate and map with sub.

### AUD-LOW-0001
- Minimal: Remove unused auth middleware.
- Long-term: Keep auth surface area minimal.

### AUD-LOW-0002
- Minimal: Use generic 401/403 error responses.
- Long-term: Unified error response schema with trace ID.

## 8. Acceptance criteria checklist
- [x] Cognito JWT required for all protected routes; no dev bypass or tenant header spoofing.
- [x] /login redirects to current host (no localhost hardcode).
- [x] Production migrations use prisma migrate deploy.
- [x] CORS restricted to configured origins.
- [ ] Token type expectations documented and enforced.
- [ ] Token refresh flow implemented.
- [ ] Outbox failures visible and actionable (DLQ or alerts).
- [ ] Docker runtime uses non-root user and prod-only deps.
- [ ] OTel exporter configured and logs include request/tenant/user IDs.
- [ ] Candidate self-service uses stable identifier (e.g., sub).
