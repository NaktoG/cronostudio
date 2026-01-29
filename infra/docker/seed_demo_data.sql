-- Semilla de datos demo

-- 1. Ensure demo user exists
INSERT INTO app_users (email, password_hash, name)
VALUES (
    'demo@cronostudio.com',
    '$2b$10$rKZLvVZqGqNvQqYqYqYqYuO7kZqGqNvQqYqYqYqYuO7kZqGqNvQqY',
    'Usuario Demo'
) ON CONFLICT (email) DO NOTHING;

-- 2. Create Channel
WITH demo_user AS (
    SELECT id FROM app_users WHERE email = 'demo@cronostudio.com' LIMIT 1
)
INSERT INTO channels (id, user_id, name, youtube_channel_id, subscribers)
VALUES (
    gen_random_uuid(),
    (SELECT id FROM demo_user),
    'Canal Demo',
    'UC_DEMO_USER_001',
    5000
) ON CONFLICT DO NOTHING;

-- Get Channel ID
WITH demo_user AS (
    SELECT id FROM app_users WHERE email = 'demo@cronostudio.com' LIMIT 1
), channel AS (
    SELECT id FROM channels WHERE user_id = (SELECT id FROM demo_user) LIMIT 1
)
INSERT INTO ideas (user_id, channel_id, title, description, status, priority, tags, source, ai_score)
VALUES 
(
    (SELECT id FROM demo_user),
    (SELECT id FROM channel),
    'Tutorial: Cómo empezar con CronoStudio',
    'Guía paso a paso para configurar tu primer canal y empezar a automatizar.',
    'approved',
    10,
    ARRAY['tutorial', 'saas', 'intro'],
    'manual',
    90
),
(
    (SELECT id FROM demo_user),
    (SELECT id FROM channel),
    'Top 10 Herramientas de IA 2026',
    'Comparativa de las mejores herramientas de IA para creadores de contenido.',
    'draft',
    7,
    ARRAY['ai', 'tools', 'top10'],
    'youtube_search',
    75
);

-- Scripts
WITH demo_user AS (
    SELECT id FROM app_users WHERE email = 'demo@cronostudio.com' LIMIT 1
), r_idea AS (
    SELECT id FROM ideas WHERE title = 'Tutorial: Cómo empezar con CronoStudio' LIMIT 1
)
INSERT INTO scripts (idea_id, user_id, title, intro, body, full_content, status)
VALUES
(
    (SELECT id FROM r_idea),
    (SELECT id FROM demo_user),
    'Guion CronoStudio',
    'Bienvenidos a todos. Hoy veremos CronoStudio.',
    'Paso 1: Registro. Paso 2: Conectar Canal.',
    'Bienvenidos a todos... [Contenido completo] ... Hasta la próxima.',
    'draft'
);

-- Productions (Dashboard Visibility)
-- Production 1: Linked to the Idea
WITH demo_user AS (
    SELECT id FROM app_users WHERE email = 'demo@cronostudio.com' LIMIT 1
), channel AS (
    SELECT id FROM channels WHERE user_id = (SELECT id FROM demo_user) LIMIT 1
), r_idea AS (
    SELECT id FROM ideas WHERE title = 'Tutorial: Cómo empezar con CronoStudio' LIMIT 1
)
INSERT INTO productions (user_id, channel_id, title, status, idea_id, priority, target_date)
VALUES
(
    (SELECT id FROM demo_user),
    (SELECT id FROM channel),
    'Tutorial: Cómo empezar con CronoStudio',
    'scripting',
    (SELECT id FROM r_idea),
    10,
    CURRENT_DATE + 5
);

-- Production 2: Standalone active production
WITH demo_user AS (
    SELECT id FROM app_users WHERE email = 'demo@cronostudio.com' LIMIT 1
), channel AS (
    SELECT id FROM channels WHERE user_id = (SELECT id FROM demo_user) LIMIT 1
)
INSERT INTO productions (user_id, channel_id, title, status, priority, target_date)
VALUES
(
    (SELECT id FROM demo_user),
    (SELECT id FROM channel),
    'Vlog Semanal #42',
    'editing',
    8,
    CURRENT_DATE + 2
);

-- Thumbnails
WITH demo_user AS (
    SELECT id FROM app_users WHERE email = 'demo@cronostudio.com' LIMIT 1
), r_script AS (
    SELECT id FROM scripts WHERE title = 'Guion CronoStudio' LIMIT 1
)
INSERT INTO thumbnails (script_id, user_id, title, notes, status)
VALUES
(
    (SELECT id FROM r_script),
    (SELECT id FROM demo_user),
    'Miniatura Tutorial',
    'Texto grande sobre fondo oscuro',
    'pending'
);

-- SEO & Videos
WITH demo_user AS (
    SELECT id FROM app_users WHERE email = 'demo@cronostudio.com' LIMIT 1
), channel AS (
    SELECT id FROM channels WHERE user_id = (SELECT id FROM demo_user) LIMIT 1
), r_video AS (
    INSERT INTO videos (channel_id, title, youtube_video_id, description) 
    VALUES (
        (SELECT id FROM channel), 
        'Tutorial CronoStudio',
        'V_DEMO_USER_001',
        'Descripción del video demo'
    ) 
    ON CONFLICT (youtube_video_id) DO UPDATE SET title = EXCLUDED.title
    RETURNING id
)
INSERT INTO seo_data (video_id, user_id, optimized_title, keywords, score)
VALUES
(
    (SELECT id FROM r_video),
    (SELECT id FROM demo_user),
    'Tutorial Definitivo CronoStudio 2026',
    ARRAY['cronostudio', 'tutorial', 'automation'],
    95
);
