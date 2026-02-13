-- CronoStudio Database Schema
-- Tablas personalizadas para la aplicación

-- Tabla de usuarios de la aplicación
CREATE TABLE IF NOT EXISTS app_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  email_verified_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de canales de YouTube
CREATE TABLE IF NOT EXISTS channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES app_users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  youtube_channel_id VARCHAR(100) UNIQUE NOT NULL,
  refresh_token TEXT,
  subscribers INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de videos
CREATE TABLE IF NOT EXISTS videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
  youtube_video_id VARCHAR(100) UNIQUE NOT NULL,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  published_at TIMESTAMP,
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de analytics
CREATE TABLE IF NOT EXISTS analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  views INTEGER DEFAULT 0,
  watch_time_minutes INTEGER DEFAULT 0,
  avg_view_duration_seconds INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(video_id, date)
);

-- Tabla de sesiones (refresh tokens)
CREATE TABLE IF NOT EXISTS auth_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  refresh_token_hash VARCHAR(128) UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  revoked_at TIMESTAMP WITH TIME ZONE
);

-- Tabla de tokens para verificacion de email
CREATE TABLE IF NOT EXISTS email_verification_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  token_hash VARCHAR(128) UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  used_at TIMESTAMP WITH TIME ZONE
);

-- Tabla de tokens para reset de password
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  token_hash VARCHAR(128) UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  used_at TIMESTAMP WITH TIME ZONE
);

-- Índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_channels_user_id ON channels(user_id);
CREATE INDEX IF NOT EXISTS idx_videos_channel_id ON videos(channel_id);
CREATE INDEX IF NOT EXISTS idx_analytics_video_id ON analytics(video_id);
CREATE INDEX IF NOT EXISTS idx_analytics_date ON analytics(date);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_user_id ON auth_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_expires_at ON auth_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_email_verification_user_id ON email_verification_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_email_verification_expires_at ON email_verification_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_password_reset_user_id ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_expires_at ON password_reset_tokens(expires_at);

-- Insertar usuario de prueba (password: "demo123")
-- Hash bcrypt de "demo123": $2b$10$rKZLvVZqGqNvQqYqYqYqYuO7kZqGqNvQqYqYqYqYuO7kZqGqNvQqY
INSERT INTO app_users (email, password_hash, name)
VALUES ('demo@cronostudio.com', '$2b$10$rKZLvVZqGqNvQqYqYqYqYuO7kZqGqNvQqYqYqYqYuO7kZqGqNvQqY', 'Usuario Demo')
ON CONFLICT (email) DO NOTHING;

-- Insertar canal de prueba
INSERT INTO channels (user_id, name, youtube_channel_id, subscribers)
SELECT id, 'Canal Demo', 'UCdemo123456', 1000
FROM app_users
WHERE email = 'demo@cronostudio.com'
ON CONFLICT (youtube_channel_id) DO NOTHING;
