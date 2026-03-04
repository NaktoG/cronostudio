import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { withSecurityHeaders, getAuthUser } from '@/middleware/auth';
import { rateLimit, API_RATE_LIMIT } from '@/middleware/rateLimit';
import { requireRoles } from '@/middleware/rbac';
import { z } from 'zod';
import { validateInput } from '@/lib/validation';

export const dynamic = 'force-dynamic';



const CreateSeoSchema = z.object({
    videoId: z.string().uuid(),
    optimizedTitle: z.string().min(1).max(100),
    description: z.string().optional(),
    tags: z.array(z.string()).optional(),
    keywords: z.array(z.string()).optional(),
});

const UpdateSeoSchema = z.object({
    optimizedTitle: z.string().min(1).max(100).optional(),
    description: z.string().optional(),
    tags: z.array(z.string()).optional(),
    keywords: z.array(z.string()).optional(),
    score: z.number().int().min(0).max(100).optional(),
});

function isValidationError(error: unknown): boolean {
    return error instanceof Error && error.message.startsWith('Validation error:');
}

function calculateSeoScore(title?: string, description?: string, tags?: string[]): number {
    let score = 0;
    if (title) {
        if (title.length >= 30 && title.length <= 60) score += 20;
        else if (title.length >= 20 && title.length <= 70) score += 10;
        if (/\||-|:/.test(title)) score += 5;
        if (title.length > 0) score += 5;
    }
    if (description) {
        if (description.length >= 100 && description.length <= 500) score += 25;
        else if (description.length >= 50) score += 15;
        if (/http|www|👇|⬇️|📌/.test(description)) score += 10;
        if (description.length > 0) score += 5;
    }
    if (tags && tags.length > 0) {
        if (tags.length >= 5 && tags.length <= 15) score += 20;
        else if (tags.length >= 3) score += 10;
        score += Math.min(tags.length, 10);
    }
    return Math.min(score, 100);
}

export const GET = rateLimit(API_RATE_LIMIT)(async (request: NextRequest) => {
    try {
        const userId = (await getAuthUser(request))?.userId;

        if (!userId) {
            return withSecurityHeaders(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
        }

        const { searchParams } = new URL(request.url);
        const videoId = searchParams.get('videoId');
        const channelId = searchParams.get('channelId');

        let queryText = `SELECT s.*, v.title as video_title FROM seo_data s LEFT JOIN videos v ON s.video_id = v.id`;
        if (channelId) {
            queryText += ' LEFT JOIN productions p ON p.seo_id = s.id AND p.user_id = $1';
        }
        queryText += ' WHERE s.user_id = $1';
        const params: (string | null)[] = [userId];
        let paramIndex = 2;

        if (videoId) { queryText += ` AND s.video_id = $${paramIndex++}`; params.push(videoId); }
        if (channelId) { queryText += ` AND p.channel_id = $${paramIndex++}`; params.push(channelId); }
        queryText += ' ORDER BY s.created_at DESC';

        const result = await query(queryText, params);
        return withSecurityHeaders(NextResponse.json(result.rows));
    } catch (error) {
        console.error('Error fetching SEO data:', error);
        return withSecurityHeaders(NextResponse.json({ error: 'Error al obtener datos SEO' }, { status: 500 }));
    }
});

export const POST = requireRoles(['owner'])(rateLimit(API_RATE_LIMIT)(async (request: NextRequest) => {
    try {
        const userId = (await getAuthUser(request))?.userId;

        if (!userId) {
            return withSecurityHeaders(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
        }

        const body = await request.json();
        const data = validateInput(CreateSeoSchema, body);
        const score = calculateSeoScore(data.optimizedTitle, data.description, data.tags);

        const result = await query(
            `INSERT INTO seo_data (user_id, video_id, optimized_title, description, tags, keywords, score) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [userId, data.videoId, data.optimizedTitle, data.description || null, data.tags || [], data.keywords || [], score]
        );

        return withSecurityHeaders(NextResponse.json(result.rows[0], { status: 201 }));
    } catch (error) {
        console.error('Error creating SEO data:', error);
        if (error instanceof z.ZodError || isValidationError(error)) {
            return withSecurityHeaders(NextResponse.json({ error: 'Datos inválidos' }, { status: 400 }));
        }
        return withSecurityHeaders(NextResponse.json({ error: 'Error al crear datos SEO' }, { status: 500 }));
    }
}));

export const PUT = requireRoles(['owner'])(rateLimit(API_RATE_LIMIT)(async (request: NextRequest) => {
    try {
        const userId = (await getAuthUser(request))?.userId;

        if (!userId) {
            return withSecurityHeaders(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
        }

        const { searchParams } = new URL(request.url);
        const seoId = searchParams.get('id');
        if (!seoId) {
            return withSecurityHeaders(NextResponse.json({ error: 'ID requerido' }, { status: 400 }));
        }

        const body = await request.json();
        const data = validateInput(UpdateSeoSchema, body);

        const current = await query('SELECT optimized_title, description, tags FROM seo_data WHERE id = $1 AND user_id = $2', [seoId, userId]);
        if (current.rows.length === 0) {
            return withSecurityHeaders(NextResponse.json({ error: 'Datos SEO no encontrados' }, { status: 404 }));
        }

        const merged = {
            title: data.optimizedTitle ?? current.rows[0].optimized_title,
            description: data.description ?? current.rows[0].description,
            tags: data.tags ?? current.rows[0].tags,
        };
        const newScore = data.score ?? calculateSeoScore(merged.title, merged.description, merged.tags);

        const updates: string[] = ['score = $1'];
        const params: (string | number | string[] | null)[] = [newScore];
        let paramIndex = 2;

        if (data.optimizedTitle !== undefined) { updates.push(`optimized_title = $${paramIndex++}`); params.push(data.optimizedTitle); }
        if (data.description !== undefined) { updates.push(`description = $${paramIndex++}`); params.push(data.description); }
        if (data.tags !== undefined) { updates.push(`tags = $${paramIndex++}`); params.push(data.tags); }
        if (data.keywords !== undefined) { updates.push(`keywords = $${paramIndex++}`); params.push(data.keywords); }

        params.push(seoId, userId);
        const result = await query(`UPDATE seo_data SET ${updates.join(', ')} WHERE id = $${paramIndex++} AND user_id = $${paramIndex} RETURNING *`, params);

        return withSecurityHeaders(NextResponse.json(result.rows[0]));
    } catch (error) {
        console.error('Error updating SEO data:', error);
        if (isValidationError(error)) {
            return withSecurityHeaders(NextResponse.json({ error: 'Datos inválidos' }, { status: 400 }));
        }
        return withSecurityHeaders(NextResponse.json({ error: 'Error al actualizar datos SEO' }, { status: 500 }));
    }
}));

export const DELETE = requireRoles(['owner'])(rateLimit(API_RATE_LIMIT)(async (request: NextRequest) => {
    try {
        const userId = (await getAuthUser(request))?.userId;

        if (!userId) {
            return withSecurityHeaders(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
        }

        const { searchParams } = new URL(request.url);
        const seoId = searchParams.get('id');
        if (!seoId) {
            return withSecurityHeaders(NextResponse.json({ error: 'ID requerido' }, { status: 400 }));
        }

        const result = await query('DELETE FROM seo_data WHERE id = $1 AND user_id = $2 RETURNING id', [seoId, userId]);
        if (result.rows.length === 0) {
            return withSecurityHeaders(NextResponse.json({ error: 'Datos SEO no encontrados' }, { status: 404 }));
        }

        return withSecurityHeaders(NextResponse.json({ message: 'Datos SEO eliminados' }));
    } catch (error) {
        console.error('Error deleting SEO data:', error);
        return withSecurityHeaders(NextResponse.json({ error: 'Error al eliminar datos SEO' }, { status: 500 }));
    }
}));
