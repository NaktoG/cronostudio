-- Migration: Add collaboration invite expiry
-- Date: 2026-04-11

ALTER TABLE collaboration_invites
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP;

UPDATE collaboration_invites
SET expires_at = created_at + INTERVAL '7 days'
WHERE expires_at IS NULL;

ALTER TABLE collaboration_invites
  ALTER COLUMN expires_at SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_collaboration_invites_expires_at
  ON collaboration_invites(expires_at);
