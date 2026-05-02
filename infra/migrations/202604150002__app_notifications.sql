-- Migration: Add in-app notifications
-- Date: 2026-04-15

CREATE TABLE IF NOT EXISTS app_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    type VARCHAR(40) NOT NULL,
    title VARCHAR(255) NOT NULL,
    body TEXT,
    action_href VARCHAR(255),
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    scheduled_for TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE,
    dedupe_key VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_app_notifications_user_dedupe
    ON app_notifications(user_id, dedupe_key)
    WHERE dedupe_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_app_notifications_user_created
    ON app_notifications(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_app_notifications_user_unread
    ON app_notifications(user_id, read_at)
    WHERE read_at IS NULL;
