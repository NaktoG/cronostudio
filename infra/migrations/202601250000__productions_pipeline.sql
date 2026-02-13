-- Migration: Add Productions module (content production pipeline)
-- Date: 2026-01-25
-- Description: Creates tables for Productions, Shorts, and Social Posts

-- Productions: Central entity for content production pipeline
-- Represents a single content piece that flows through: Idea → Script → Video → Shorts → Social
CREATE TABLE IF NOT EXISTS productions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    channel_id UUID REFERENCES channels(id) ON DELETE SET NULL,
    
    -- Core info
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(30) DEFAULT 'idea' CHECK (status IN (
        'idea',           -- Initial stage, just a concept
        'scripting',      -- Writing the script
        'recording',      -- Video being recorded
        'editing',        -- Post-production
        'shorts',         -- Creating derivative shorts
        'publishing',     -- Scheduling/uploading
        'published'       -- Live on platforms
    )),
    
    -- References to existing modules
    idea_id UUID REFERENCES ideas(id) ON DELETE SET NULL,
    script_id UUID REFERENCES scripts(id) ON DELETE SET NULL,
    thumbnail_id UUID REFERENCES thumbnails(id) ON DELETE SET NULL,
    seo_id UUID REFERENCES seo_data(id) ON DELETE SET NULL,
    video_id UUID REFERENCES videos(id) ON DELETE SET NULL,
    
    -- Production tracking
    target_date DATE,
    priority INTEGER DEFAULT 0,
    
    -- Timestamps
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Shorts: Derivative short-form content from a production
CREATE TABLE IF NOT EXISTS shorts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    production_id UUID NOT NULL REFERENCES productions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    
    -- Core info
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
        'pending',        -- Not started
        'editing',        -- Being edited
        'ready',          -- Ready to publish
        'published'       -- Live on platform
    )),
    
    -- Platform targeting
    platform VARCHAR(30) CHECK (platform IN (
        'youtube_short',
        'tiktok',
        'instagram_reel'
    )),
    
    -- Media references
    source_timestamp_start INTEGER,  -- Start time in main video (seconds)
    source_timestamp_end INTEGER,    -- End time in main video (seconds)
    video_url VARCHAR(500),
    
    -- Timestamps
    scheduled_at TIMESTAMP WITH TIME ZONE,
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Social Posts: Social media content derived from a production
CREATE TABLE IF NOT EXISTS social_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    production_id UUID NOT NULL REFERENCES productions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    
    -- Core info
    platform VARCHAR(30) NOT NULL CHECK (platform IN (
        'twitter',
        'linkedin',
        'instagram',
        'threads',
        'facebook'
    )),
    content TEXT NOT NULL,
    media_urls TEXT[],
    
    -- Status tracking
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN (
        'draft',          -- Being written
        'scheduled',      -- Ready and scheduled
        'published',      -- Posted
        'failed'          -- Failed to post
    )),
    
    -- Timestamps
    scheduled_at TIMESTAMP WITH TIME ZONE,
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Automation Runs: Track n8n workflow executions
CREATE TABLE IF NOT EXISTS automation_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    production_id UUID REFERENCES productions(id) ON DELETE SET NULL,
    
    -- Workflow info
    workflow_name VARCHAR(100) NOT NULL,
    workflow_id VARCHAR(100),
    execution_id VARCHAR(100),
    
    -- Status
    status VARCHAR(20) DEFAULT 'running' CHECK (status IN (
        'running',
        'completed',
        'error'
    )),
    error_message TEXT,
    
    -- Timestamps
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_productions_user_id ON productions(user_id);
CREATE INDEX IF NOT EXISTS idx_productions_channel_id ON productions(channel_id);
CREATE INDEX IF NOT EXISTS idx_productions_status ON productions(status);
CREATE INDEX IF NOT EXISTS idx_productions_target_date ON productions(target_date);
CREATE INDEX IF NOT EXISTS idx_shorts_production_id ON shorts(production_id);
CREATE INDEX IF NOT EXISTS idx_shorts_user_id ON shorts(user_id);
CREATE INDEX IF NOT EXISTS idx_shorts_status ON shorts(status);
CREATE INDEX IF NOT EXISTS idx_social_posts_production_id ON social_posts(production_id);
CREATE INDEX IF NOT EXISTS idx_social_posts_user_id ON social_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_social_posts_status ON social_posts(status);
CREATE INDEX IF NOT EXISTS idx_automation_runs_user_id ON automation_runs(user_id);
CREATE INDEX IF NOT EXISTS idx_automation_runs_production_id ON automation_runs(production_id);
CREATE INDEX IF NOT EXISTS idx_automation_runs_status ON automation_runs(status);

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_productions_updated_at ON productions;
CREATE TRIGGER update_productions_updated_at BEFORE UPDATE ON productions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_shorts_updated_at ON shorts;
CREATE TRIGGER update_shorts_updated_at BEFORE UPDATE ON shorts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_social_posts_updated_at ON social_posts;
CREATE TRIGGER update_social_posts_updated_at BEFORE UPDATE ON social_posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
