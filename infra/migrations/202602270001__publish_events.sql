-- Migration: Add publish metadata and events
-- Date: 2026-02-27
-- Description: Adds published_url/platform_id to productions and logs publish events

ALTER TABLE productions
    ADD COLUMN IF NOT EXISTS published_url VARCHAR(500),
    ADD COLUMN IF NOT EXISTS platform_id VARCHAR(200);

CREATE TABLE IF NOT EXISTS publish_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    production_id UUID NOT NULL REFERENCES productions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    channel_id UUID REFERENCES channels(id) ON DELETE SET NULL,
    platform VARCHAR(30) NOT NULL DEFAULT 'youtube',
    platform_id VARCHAR(200),
    published_url VARCHAR(500),
    published_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_publish_events_production_id ON publish_events(production_id);
CREATE INDEX IF NOT EXISTS idx_publish_events_channel_id ON publish_events(channel_id);
CREATE INDEX IF NOT EXISTS idx_publish_events_user_id ON publish_events(user_id);
CREATE INDEX IF NOT EXISTS idx_publish_events_published_at ON publish_events(published_at);
