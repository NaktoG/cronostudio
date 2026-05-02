-- Migration: Fix notification dedupe conflict target
-- Date: 2026-04-15

DROP INDEX IF EXISTS idx_app_notifications_user_dedupe;

CREATE UNIQUE INDEX IF NOT EXISTS idx_app_notifications_user_dedupe
    ON app_notifications(user_id, dedupe_key);
