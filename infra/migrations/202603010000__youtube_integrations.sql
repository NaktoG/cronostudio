-- Date: 2026-03-01
-- Description: Stores YouTube OAuth tokens (encrypted) and channel metadata

CREATE TABLE IF NOT EXISTS youtube_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    channel_id UUID REFERENCES channels(id) ON DELETE SET NULL,
    youtube_channel_id VARCHAR(128) NOT NULL UNIQUE,
    youtube_channel_title VARCHAR(255),
    access_token_enc TEXT NOT NULL,
    refresh_token_enc TEXT,
    token_expiry_at TIMESTAMP WITH TIME ZONE,
    scope TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_youtube_integrations_user_id ON youtube_integrations(user_id);
CREATE INDEX IF NOT EXISTS idx_youtube_integrations_channel_id ON youtube_integrations(channel_id);

DROP TRIGGER IF EXISTS update_youtube_integrations_updated_at ON youtube_integrations;
CREATE TRIGGER update_youtube_integrations_updated_at BEFORE UPDATE ON youtube_integrations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
