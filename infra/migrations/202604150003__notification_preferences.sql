-- Migration: Add notification preferences per user
-- Date: 2026-04-15

CREATE TABLE IF NOT EXISTS app_notification_preferences (
    user_id UUID PRIMARY KEY REFERENCES app_users(id) ON DELETE CASCADE,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    in_app_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    reminder_24h BOOLEAN NOT NULL DEFAULT TRUE,
    reminder_3h BOOLEAN NOT NULL DEFAULT TRUE,
    reminder_30m BOOLEAN NOT NULL DEFAULT TRUE,
    default_hour_utc SMALLINT NOT NULL DEFAULT 18 CHECK (default_hour_utc >= 0 AND default_hour_utc <= 23),
    default_minute_utc SMALLINT NOT NULL DEFAULT 0 CHECK (default_minute_utc >= 0 AND default_minute_utc <= 59),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS update_app_notification_preferences_updated_at ON app_notification_preferences;
CREATE TRIGGER update_app_notification_preferences_updated_at
    BEFORE UPDATE ON app_notification_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
