-- Date: 2026-03-20
-- Description: Core automation tables for queue, idempotency, retries, DLQ and audit

CREATE TABLE IF NOT EXISTS automation_job_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_type TEXT NOT NULL,
    tenant_user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    payload JSONB NOT NULL,
    state VARCHAR(20) NOT NULL DEFAULT 'queued' CHECK (state IN ('queued', 'running', 'succeeded', 'failed', 'dead')),
    priority SMALLINT NOT NULL DEFAULT 100,
    attempt INTEGER NOT NULL DEFAULT 0,
    max_attempts INTEGER NOT NULL DEFAULT 5,
    run_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    lease_until TIMESTAMPTZ,
    locked_by TEXT,
    last_error_code TEXT,
    last_error_message TEXT,
    request_id TEXT,
    trace_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_automation_job_queue_state_run_priority
    ON automation_job_queue(state, run_at, priority);
CREATE INDEX IF NOT EXISTS idx_automation_job_queue_tenant_created
    ON automation_job_queue(tenant_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_automation_job_queue_running_lease
    ON automation_job_queue(lease_until)
    WHERE state = 'running';

DROP TRIGGER IF EXISTS update_automation_job_queue_updated_at ON automation_job_queue;
CREATE TRIGGER update_automation_job_queue_updated_at BEFORE UPDATE ON automation_job_queue
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS automation_job_idempotency (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scope TEXT NOT NULL,
    tenant_user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    idempotency_key TEXT NOT NULL,
    request_hash TEXT NOT NULL,
    status_code INTEGER,
    response_snapshot JSONB,
    job_id UUID REFERENCES automation_job_queue(id) ON DELETE SET NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(scope, tenant_user_id, idempotency_key)
);

CREATE INDEX IF NOT EXISTS idx_automation_job_idempotency_expires
    ON automation_job_idempotency(expires_at);
CREATE INDEX IF NOT EXISTS idx_automation_job_idempotency_job
    ON automation_job_idempotency(job_id);
CREATE INDEX IF NOT EXISTS idx_automation_job_idempotency_tenant
    ON automation_job_idempotency(tenant_user_id);

CREATE TABLE IF NOT EXISTS automation_job_attempts (
    id BIGSERIAL PRIMARY KEY,
    job_id UUID NOT NULL REFERENCES automation_job_queue(id) ON DELETE CASCADE,
    attempt INTEGER NOT NULL,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    finished_at TIMESTAMPTZ,
    outcome VARCHAR(20) NOT NULL CHECK (outcome IN ('success', 'retry', 'dead')),
    error_class TEXT,
    error_detail TEXT,
    request_id TEXT,
    trace_id TEXT
);

CREATE INDEX IF NOT EXISTS idx_automation_job_attempts_job_attempt
    ON automation_job_attempts(job_id, attempt DESC);

CREATE TABLE IF NOT EXISTS automation_job_dlq (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL UNIQUE REFERENCES automation_job_queue(id) ON DELETE CASCADE,
    job_type TEXT NOT NULL,
    tenant_user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    payload JSONB NOT NULL,
    failed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    failure_reason TEXT NOT NULL,
    retryable BOOLEAN NOT NULL DEFAULT FALSE,
    replay_count INTEGER NOT NULL DEFAULT 0,
    replayed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_automation_job_dlq_failed_at
    ON automation_job_dlq(failed_at DESC);

CREATE TABLE IF NOT EXISTS automation_audit_log (
    id BIGSERIAL PRIMARY KEY,
    actor_type VARCHAR(20) NOT NULL CHECK (actor_type IN ('user', 'service', 'system')),
    actor_id TEXT NOT NULL,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id TEXT,
    request_id TEXT,
    trace_id TEXT,
    ip INET,
    user_agent TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_automation_audit_log_created_at
    ON automation_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_automation_audit_log_request_id
    ON automation_audit_log(request_id);
