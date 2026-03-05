-- Migration: Collaboration invites
-- Date: 2026-03-04

CREATE TABLE IF NOT EXISTS collaboration_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'collaborator',
  invited_by UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  token_hash VARCHAR(128) UNIQUE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  accepted_at TIMESTAMP,
  revoked_at TIMESTAMP,
  CONSTRAINT collaboration_invites_role_check CHECK (role IN ('collaborator')),
  CONSTRAINT collaboration_invites_status_check CHECK (status IN ('pending', 'accepted', 'revoked'))
);

CREATE INDEX IF NOT EXISTS idx_collaboration_invites_email ON collaboration_invites(email);
CREATE INDEX IF NOT EXISTS idx_collaboration_invites_invited_by ON collaboration_invites(invited_by);
CREATE INDEX IF NOT EXISTS idx_collaboration_invites_status ON collaboration_invites(status);
