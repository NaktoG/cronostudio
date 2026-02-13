-- Migration: Add content creation modules
-- Date: 2026-01-24
-- Description: Creates tables for Ideas, Scripts, Thumbnails, and SEO data

-- Ideas: Apuntar ideas para videos
CREATE TABLE IF NOT EXISTS ideas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    channel_id UUID REFERENCES channels(id) ON DELETE SET NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'in_production', 'completed', 'archived')),
    priority INTEGER DEFAULT 0,
    tags TEXT[],
    source VARCHAR(50) DEFAULT 'manual',
    ai_score INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Scripts: Guiones para videos
CREATE TABLE IF NOT EXISTS scripts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    idea_id UUID REFERENCES ideas(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    intro TEXT,
    body TEXT,
    cta TEXT,
    outro TEXT,
    full_content TEXT,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'approved', 'recorded')),
    word_count INTEGER DEFAULT 0,
    estimated_duration_seconds INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Thumbnails: Miniaturas para videos
CREATE TABLE IF NOT EXISTS thumbnails (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    script_id UUID REFERENCES scripts(id) ON DELETE SET NULL,
    video_id UUID REFERENCES videos(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    title VARCHAR(200),
    notes TEXT,
    image_url VARCHAR(500),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'designing', 'designed', 'approved')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- SEO Data: Optimización para videos
CREATE TABLE IF NOT EXISTS seo_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    optimized_title VARCHAR(100),
    description TEXT,
    tags TEXT[],
    keywords TEXT[],
    score INTEGER DEFAULT 0 CHECK (score >= 0 AND score <= 100),
    suggestions JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ideas_user_id ON ideas(user_id);
CREATE INDEX IF NOT EXISTS idx_ideas_channel_id ON ideas(channel_id);
CREATE INDEX IF NOT EXISTS idx_ideas_status ON ideas(status);
CREATE INDEX IF NOT EXISTS idx_scripts_user_id ON scripts(user_id);
CREATE INDEX IF NOT EXISTS idx_scripts_idea_id ON scripts(idea_id);
CREATE INDEX IF NOT EXISTS idx_thumbnails_user_id ON thumbnails(user_id);
CREATE INDEX IF NOT EXISTS idx_seo_data_video_id ON seo_data(video_id);

-- Updated_at trigger function (if not exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_ideas_updated_at ON ideas;
CREATE TRIGGER update_ideas_updated_at BEFORE UPDATE ON ideas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_scripts_updated_at ON scripts;
CREATE TRIGGER update_scripts_updated_at BEFORE UPDATE ON scripts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_thumbnails_updated_at ON thumbnails;
CREATE TRIGGER update_thumbnails_updated_at BEFORE UPDATE ON thumbnails
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_seo_data_updated_at ON seo_data;
CREATE TRIGGER update_seo_data_updated_at BEFORE UPDATE ON seo_data
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
