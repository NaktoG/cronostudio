-- Migration: Add weekly plan fields to productions
-- Date: 2026-02-27
-- Description: Stores planned publish day and ISO week per production

ALTER TABLE productions
    ADD COLUMN IF NOT EXISTS planned_publish_day VARCHAR(20),
    ADD COLUMN IF NOT EXISTS iso_year INTEGER,
    ADD COLUMN IF NOT EXISTS iso_week INTEGER,
    ADD COLUMN IF NOT EXISTS week_key VARCHAR(10);

CREATE INDEX IF NOT EXISTS idx_productions_week_key ON productions(week_key);
CREATE INDEX IF NOT EXISTS idx_productions_iso_week ON productions(iso_year, iso_week);
CREATE INDEX IF NOT EXISTS idx_productions_planned_day ON productions(planned_publish_day);
