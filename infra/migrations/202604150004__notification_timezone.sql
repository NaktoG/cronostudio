-- Migration: Add timezone to notification preferences
-- Date: 2026-04-15

ALTER TABLE app_notification_preferences
    ADD COLUMN IF NOT EXISTS timezone VARCHAR(64) NOT NULL DEFAULT 'UTC';

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'app_notification_preferences_timezone_check'
    ) THEN
        ALTER TABLE app_notification_preferences
            ADD CONSTRAINT app_notification_preferences_timezone_check
            CHECK (char_length(timezone) >= 3);
    END IF;
END $$;
