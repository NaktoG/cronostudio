-- Migration: Add super_admin role
-- Date: 2026-04-15

ALTER TABLE app_users
    DROP CONSTRAINT IF EXISTS app_users_role_check;

ALTER TABLE app_users
    ADD CONSTRAINT app_users_role_check
        CHECK (role IN ('owner', 'collaborator', 'automation', 'super_admin'));

CREATE INDEX IF NOT EXISTS idx_app_users_role ON app_users(role);
