-- Add candidate role
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'CANDIDATE';

-- Create outbox status enum
DO $$ BEGIN
  CREATE TYPE "OutboxStatus" AS ENUM ('PENDING', 'DISPATCHED', 'FAILED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Create outbox table
CREATE TABLE IF NOT EXISTS "Outbox" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "payloadJson" JSONB NOT NULL,
  "status" "OutboxStatus" NOT NULL DEFAULT 'PENDING',
  "idempotencyKey" TEXT NOT NULL,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "nextRunAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Outbox_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Outbox_tenantId_idx" ON "Outbox"("tenantId");
CREATE INDEX IF NOT EXISTS "Outbox_status_nextRunAt_idx" ON "Outbox"("status", "nextRunAt");
CREATE UNIQUE INDEX IF NOT EXISTS "Outbox_idempotencyKey_key" ON "Outbox"("idempotencyKey");

ALTER TABLE "Outbox" ADD CONSTRAINT "Outbox_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Enable RLS
ALTER TABLE "Tenant" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Candidate" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Job" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Application" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ApplicationEvent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Score" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Explanation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Outbox" ENABLE ROW LEVEL SECURITY;

-- Tenant policies
DO $$ BEGIN
  CREATE POLICY "tenant_select" ON "Tenant"
    FOR SELECT
    USING (id = current_setting('app.tenant_id', true)::uuid);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "tenant_insert" ON "Tenant"
    FOR INSERT
    WITH CHECK (true);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Tenant-scoped policies
DO $$ BEGIN
  CREATE POLICY "user_tenant_isolation" ON "User"
    FOR ALL
    USING ("tenantId" = current_setting('app.tenant_id', true)::uuid)
    WITH CHECK ("tenantId" = current_setting('app.tenant_id', true)::uuid);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "candidate_tenant_isolation" ON "Candidate"
    FOR ALL
    USING ("tenantId" = current_setting('app.tenant_id', true)::uuid)
    WITH CHECK ("tenantId" = current_setting('app.tenant_id', true)::uuid);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "job_tenant_isolation" ON "Job"
    FOR ALL
    USING ("tenantId" = current_setting('app.tenant_id', true)::uuid)
    WITH CHECK ("tenantId" = current_setting('app.tenant_id', true)::uuid);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "application_tenant_isolation" ON "Application"
    FOR ALL
    USING ("tenantId" = current_setting('app.tenant_id', true)::uuid)
    WITH CHECK ("tenantId" = current_setting('app.tenant_id', true)::uuid);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "application_event_tenant_isolation" ON "ApplicationEvent"
    FOR ALL
    USING ("tenantId" = current_setting('app.tenant_id', true)::uuid)
    WITH CHECK ("tenantId" = current_setting('app.tenant_id', true)::uuid);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "score_tenant_isolation" ON "Score"
    FOR ALL
    USING ("tenantId" = current_setting('app.tenant_id', true)::uuid)
    WITH CHECK ("tenantId" = current_setting('app.tenant_id', true)::uuid);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "explanation_tenant_isolation" ON "Explanation"
    FOR ALL
    USING ("tenantId" = current_setting('app.tenant_id', true)::uuid)
    WITH CHECK ("tenantId" = current_setting('app.tenant_id', true)::uuid);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "outbox_tenant_isolation" ON "Outbox"
    FOR ALL
    USING (
      "tenantId" = current_setting('app.tenant_id', true)::uuid
      OR current_setting('app.worker', true) = 'true'
    )
    WITH CHECK (
      "tenantId" = current_setting('app.tenant_id', true)::uuid
      OR current_setting('app.worker', true) = 'true'
    );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
