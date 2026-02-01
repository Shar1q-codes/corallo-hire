# Architecture

## Monorepo
This repo is a pnpm + Turborepo workspace with three apps and shared packages.

- `apps/api`: NestJS HTTP API (JWT auth + RBAC, tenant-aware, Prisma-backed, outbox-driven workflows)
- `apps/worker`: Temporal worker executing scoring workflow activities
- `apps/web`: Next.js App Router UI
- `packages/db`: Prisma schema + client + seed
- `packages/shared`: Zod schemas + shared utilities (compiled to `dist/` for runtime)

## Shared package runtime
`@corallo/shared` is built to `dist/` and exported via package.json for production runtime. Dev uses Turbo to run a watch build so `pnpm dev` works without manual builds.

## Tenant context
Tenants are derived from Cognito JWT claims (`custom:tenant_id`) and never from request headers. All services use `withTenant()` to set `app.tenant_id` for each transaction.

## Postgres RLS
Row-level security is enabled for tenant-scoped tables with policies that enforce `tenantId = current_setting('app.tenant_id')`. The Outbox table also supports a worker bypass flag (`app.worker=true`) so the dispatcher can read cross-tenant rows safely.

## Outbox dispatch
Creating an application writes an Outbox row in the same transaction. The worker periodically claims pending rows and starts the Temporal workflow with a deterministic workflow ID to ensure idempotency.

## Evidence-first events
Application changes are immutable. Every application write creates an `ApplicationEvent` record:
- `APPLIED` when created
- `STATUS_*` for status updates
- `SCORED` and `EXPLANATION_READY` from Temporal workflow

## Temporal workflow
`ScoreApplicationWorkflow` runs on the `applications` task queue. It calls `parseResume`, `matchToJob`, and `generateExplanation` activities, then persists `Score`, `Explanation`, and emits application events. Workflow starts are triggered by the outbox dispatcher for reliability.

## Infra
Temporal runs from a small custom image built in `infra/docker/temporal/Dockerfile` so required Postgres client tools are baked in at build time (no runtime package installs). Docker Compose wires Postgres + Temporal + Temporal UI for local dev.
