-- Migration: Add weekly goals for production schedule
-- Date: 2026-02-27
-- Description: Stores weekly goals per channel with publish days and cut-off time

CREATE TABLE IF NOT EXISTS weekly_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    channel_id UUID REFERENCES channels(id) ON DELETE SET NULL,
    iso_year INTEGER NOT NULL,
    iso_week INTEGER NOT NULL,
    target_videos INTEGER NOT NULL DEFAULT 2,
    dias_publicacion TEXT[] NOT NULL DEFAULT ARRAY['tuesday', 'friday'],
    hora_corte TIME NOT NULL DEFAULT '12:00',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, channel_id, iso_year, iso_week)
);

CREATE INDEX IF NOT EXISTS idx_weekly_goals_user_id ON weekly_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_weekly_goals_channel_id ON weekly_goals(channel_id);
CREATE INDEX IF NOT EXISTS idx_weekly_goals_week ON weekly_goals(iso_year, iso_week);

DROP TRIGGER IF EXISTS update_weekly_goals_updated_at ON weekly_goals;
CREATE TRIGGER update_weekly_goals_updated_at BEFORE UPDATE ON weekly_goals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
