-- Migration: Add AI run metrics fields
-- Date: 2026-03-03

ALTER TABLE ai_runs
    ADD COLUMN IF NOT EXISTS provider TEXT,
    ADD COLUMN IF NOT EXISTS model TEXT,
    ADD COLUMN IF NOT EXISTS latency_ms INTEGER,
    ADD COLUMN IF NOT EXISTS token_usage JSONB,
    ADD COLUMN IF NOT EXISTS cost_estimate NUMERIC(10,4);

CREATE INDEX IF NOT EXISTS idx_ai_runs_provider ON ai_runs(provider);
CREATE INDEX IF NOT EXISTS idx_ai_runs_model ON ai_runs(model);
