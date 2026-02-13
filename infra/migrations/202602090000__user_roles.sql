-- Migration: Add user roles to app_users
-- Date: 2026-02-09

ALTER TABLE app_users
    ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'owner';

ALTER TABLE app_users
    DROP CONSTRAINT IF EXISTS app_users_role_check;

ALTER TABLE app_users
    ADD CONSTRAINT app_users_role_check
        CHECK (role IN ('owner', 'collaborator', 'automation'));

UPDATE app_users
SET role = 'owner'
WHERE role IS NULL;

CREATE INDEX IF NOT EXISTS idx_app_users_role ON app_users(role);
