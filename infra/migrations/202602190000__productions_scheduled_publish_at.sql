-- Migration: Add scheduled publish timestamp to productions
-- Date: 2026-02-19
-- Description: Adds scheduled_publish_at to productions for calendar view

ALTER TABLE productions
    ADD COLUMN IF NOT EXISTS scheduled_publish_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_productions_scheduled_publish_at
    ON productions(scheduled_publish_at);
