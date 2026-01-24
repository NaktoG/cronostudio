import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { withSecurityHeaders } from '@/lib/security';
import { withAuth, rateLimit, API_RATE_LIMIT } from '@/lib/auth';
import { z } from 'zod';
import { validateInput } from '@/lib/validation';

// Schemas
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
    suggestions: z.record(z.unknown()).optional(),
});

// Helper: Calculate SEO score based on content
function calculateSeoScore(title?: string, description?: string, tags?: string[]): number {
    let score = 0;

    // Title optimization (max 30 points)
    if (title) {
        if (title.length >= 30 && title.length <= 60) score += 20;
        else if (title.length >= 20 && title.length <= 70) score += 10;
        // Contains keywords indicator
        if (/\||-|:/.test(title)) score += 5;
        if (title.length > 0) score += 5;
    }

    // Description optimization (max 40 points)
    if (description) {
        if (description.length >= 100 && description.length <= 500) score += 25;
        else if (description.length >= 50) score += 15;
        // Contains links or CTAs
        if (/http|www|👇|⬇️|📌/.test(description)) score += 10;
        if (description.length > 0) score += 5;
    }

    // Tags (max 30 points)
    if (tags && tags.length > 0) {
        if (tags.length >= 5 && tags.length <= 15) score += 20;
        else if (tags.length >= 3) score += 10;
        score += Math.min(tags.length, 10);
    }

    return Math.min(score, 100);
}

// GET - Lista datos SEO del usuario
export async function GET(request: NextRequest) {
    try {
        const authResult = await withAuth(request);
        if (authResult instanceof NextResponse) return authResult;
        const userId = authResult.userId;

        const { searchParams } = new URL(request.url);
        const videoId = searchParams.get('videoId');

        let queryText = `
            SELECT s.*, v.title as video_title, v.youtube_video_id
            FROM seo_data s 
            LEFT JOIN videos v ON s.video_id = v.id 
            WHERE s.user_id = $1
        `;
        const params: (string | null)[] = [userId];

        if (videoId) {
            queryText += ` AND s.video_id = $2`;
            params.push(videoId);
        }

        queryText += ' ORDER BY s.created_at DESC';

        const result = await query(queryText, params);

        const response = NextResponse.json(result.rows);
        return withSecurityHeaders(response);
    } catch (error) {
        console.error('Error fetching SEO data:', error);
        return withSecurityHeaders(
            NextResponse.json({ error: 'Error al obtener datos SEO' }, { status: 500 })
        );
    }
}

// POST - Crear datos SEO
export const POST = rateLimit(API_RATE_LIMIT)(async (request: NextRequest) => {
    try {
        const authResult = await withAuth(request);
        if (authResult instanceof NextResponse) return authResult;
        const userId = authResult.userId;

        const body = await request.json();
        const data = validateInput(CreateSeoSchema, body);

        const score = calculateSeoScore(data.optimizedTitle, data.description, data.tags);

        const result = await query(
            `INSERT INTO seo_data (user_id, video_id, optimized_title, description, tags, keywords, score)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING *`,
            [
                userId,
                data.videoId,
                data.optimizedTitle,
                data.description || null,
                data.tags || [],
                data.keywords || [],
                score,
            ]
        );

        const response = NextResponse.json(result.rows[0], { status: 201 });
        return withSecurityHeaders(response);
    } catch (error) {
        console.error('Error creating SEO data:', error);
        if (error instanceof z.ZodError) {
            return withSecurityHeaders(
                NextResponse.json({ error: 'Datos inválidos', details: error.errors }, { status: 400 })
            );
        }
        return withSecurityHeaders(
            NextResponse.json({ error: 'Error al crear datos SEO' }, { status: 500 })
        );
    }
});

// PUT - Actualizar datos SEO
export const PUT = rateLimit(API_RATE_LIMIT)(async (request: NextRequest) => {
    try {
        const authResult = await withAuth(request);
        if (authResult instanceof NextResponse) return authResult;
        const userId = authResult.userId;

        const { searchParams } = new URL(request.url);
        const seoId = searchParams.get('id');

        if (!seoId) {
            return withSecurityHeaders(
                NextResponse.json({ error: 'ID de SEO requerido' }, { status: 400 })
            );
        }

        const body = await request.json();
        const data = validateInput(UpdateSeoSchema, body);

        // Get current data to recalculate score
        const current = await query(
            'SELECT optimized_title, description, tags FROM seo_data WHERE id = $1 AND user_id = $2',
            [seoId, userId]
        );

        if (current.rows.length === 0) {
            return withSecurityHeaders(
                NextResponse.json({ error: 'Datos SEO no encontrados' }, { status: 404 })
            );
        }

        const merged = {
            title: data.optimizedTitle ?? current.rows[0].optimized_title,
            description: data.description ?? current.rows[0].description,
            tags: data.tags ?? current.rows[0].tags,
        };

        const newScore = data.score ?? calculateSeoScore(merged.title, merged.description, merged.tags);

        const updates: string[] = ['score = $1'];
        const params: (string | number | string[] | object | null)[] = [newScore];
        let paramIndex = 2;

        if (data.optimizedTitle !== undefined) {
            updates.push(`optimized_title = $${paramIndex++}`);
            params.push(data.optimizedTitle);
        }
        if (data.description !== undefined) {
            updates.push(`description = $${paramIndex++}`);
            params.push(data.description);
        }
        if (data.tags !== undefined) {
            updates.push(`tags = $${paramIndex++}`);
            params.push(data.tags);
        }
        if (data.keywords !== undefined) {
            updates.push(`keywords = $${paramIndex++}`);
            params.push(data.keywords);
        }
        if (data.suggestions !== undefined) {
            updates.push(`suggestions = $${paramIndex++}`);
            params.push(JSON.stringify(data.suggestions));
        }

        params.push(seoId, userId);

        const result = await query(
            `UPDATE seo_data SET ${updates.join(', ')} 
             WHERE id = $${paramIndex++} AND user_id = $${paramIndex}
             RETURNING *`,
            params
        );

        const response = NextResponse.json(result.rows[0]);
        return withSecurityHeaders(response);
    } catch (error) {
        console.error('Error updating SEO data:', error);
        return withSecurityHeaders(
            NextResponse.json({ error: 'Error al actualizar datos SEO' }, { status: 500 })
        );
    }
});

// DELETE
export const DELETE = rateLimit(API_RATE_LIMIT)(async (request: NextRequest) => {
    try {
        const authResult = await withAuth(request);
        if (authResult instanceof NextResponse) return authResult;
        const userId = authResult.userId;

        const { searchParams } = new URL(request.url);
        const seoId = searchParams.get('id');

        if (!seoId) {
            return withSecurityHeaders(
                NextResponse.json({ error: 'ID de SEO requerido' }, { status: 400 })
            );
        }

        const result = await query(
            'DELETE FROM seo_data WHERE id = $1 AND user_id = $2 RETURNING id',
            [seoId, userId]
        );

        if (result.rows.length === 0) {
            return withSecurityHeaders(
                NextResponse.json({ error: 'Datos SEO no encontrados' }, { status: 404 })
            );
        }

        const response = NextResponse.json({ message: 'Datos SEO eliminados' });
        return withSecurityHeaders(response);
    } catch (error) {
        console.error('Error deleting SEO data:', error);
        return withSecurityHeaders(
            NextResponse.json({ error: 'Error al eliminar datos SEO' }, { status: 500 })
        );
    }
});
