-- Migration: Add AI runs for manual-first AI Studio
-- Date: 2026-03-02
-- Description: Stores AI profile runs with input/output JSON

CREATE TABLE IF NOT EXISTS ai_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    channel_id UUID REFERENCES channels(id) ON DELETE SET NULL,
    profile_key TEXT NOT NULL,
    profile_version INTEGER NOT NULL DEFAULT 1,
    status VARCHAR(20) NOT NULL DEFAULT 'awaiting_input' CHECK (status IN ('awaiting_input', 'completed', 'failed')),
    input_json JSONB NOT NULL,
    output_json JSONB,
    error TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_runs_user_id ON ai_runs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_runs_channel_id ON ai_runs(channel_id);
CREATE INDEX IF NOT EXISTS idx_ai_runs_profile_key ON ai_runs(profile_key);
CREATE INDEX IF NOT EXISTS idx_ai_runs_status ON ai_runs(status);

DROP TRIGGER IF EXISTS update_ai_runs_updated_at ON ai_runs;
CREATE TRIGGER update_ai_runs_updated_at BEFORE UPDATE ON ai_runs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
