import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { withSecurityHeaders, getAuthUser } from '@/middleware/auth';
import { rateLimit, API_RATE_LIMIT } from '@/middleware/rateLimit';
import { requireRoles } from '@/middleware/rbac';
import { z } from 'zod';
import { validateInput } from '@/lib/validation';

export const dynamic = 'force-dynamic';



const CreateThumbnailSchema = z.object({
    title: z.string().min(1).max(200),
    scriptId: z.string().uuid().optional(),
    videoId: z.string().uuid().optional(),
    notes: z.string().optional(),
    imageUrl: z.string().url().optional(),
});

const UpdateThumbnailSchema = z.object({
    title: z.string().min(1).max(200).optional(),
    notes: z.string().optional(),
    imageUrl: z.string().url().optional(),
    status: z.enum(['pending', 'designing', 'designed', 'approved']).optional(),
});

function isValidationError(error: unknown): boolean {
    return error instanceof Error && error.message.startsWith('Validation error:');
}

export const GET = rateLimit(API_RATE_LIMIT)(async (request: NextRequest) => {
    try {
        const userId = (await getAuthUser(request))?.userId;

        if (!userId) {
            return withSecurityHeaders(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const channelId = searchParams.get('channelId');

        let queryText = `
            SELECT t.*, s.title as script_title, p.id as production_id, c.id as channel_id
            FROM thumbnails t
            LEFT JOIN scripts s ON t.script_id = s.id
            LEFT JOIN ideas i ON s.idea_id = i.id
            LEFT JOIN videos v ON t.video_id = v.id
            LEFT JOIN productions p ON (p.script_id = t.script_id OR p.video_id = t.video_id) AND p.user_id = $1
            LEFT JOIN channels c ON c.id = COALESCE(i.channel_id, v.channel_id)
            WHERE t.user_id = $1`;
        const params: (string | null)[] = [userId];

        if (status) {
            queryText += ` AND t.status = $${params.length + 1}`;
            params.push(status);
        }
        if (channelId) {
            queryText += ` AND c.id = $${params.length + 1}`;
            params.push(channelId);
        }
        queryText += ' ORDER BY t.created_at DESC';

        const result = await query(queryText, params);
        return withSecurityHeaders(NextResponse.json(result.rows));
    } catch (error) {
        console.error('Error fetching thumbnails:', error);
        return withSecurityHeaders(NextResponse.json({ error: 'Error al obtener miniaturas' }, { status: 500 }));
    }
});

export const POST = requireRoles(['owner'])(rateLimit(API_RATE_LIMIT)(async (request: NextRequest) => {
    try {
        const userId = (await getAuthUser(request))?.userId;

        if (!userId) {
            return withSecurityHeaders(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
        }

        const body = await request.json();
        const data = validateInput(CreateThumbnailSchema, body);

        const result = await query(
            `INSERT INTO thumbnails (user_id, script_id, video_id, title, notes, image_url)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING *`,
            [userId, data.scriptId || null, data.videoId || null, data.title, data.notes || null, data.imageUrl || null]
        );

        const thumbnailId = result.rows[0]?.id as string | undefined;
        if (thumbnailId) {
            if (data.scriptId) {
                await query(
                    `UPDATE productions
                     SET thumbnail_id = $1, updated_at = NOW()
                     WHERE script_id = $2 AND user_id = $3`,
                    [thumbnailId, data.scriptId, userId]
                );
            } else if (data.videoId) {
                await query(
                    `UPDATE productions
                     SET thumbnail_id = $1, updated_at = NOW()
                     WHERE video_id = $2 AND user_id = $3`,
                    [thumbnailId, data.videoId, userId]
                );
            }
        }

        return withSecurityHeaders(NextResponse.json(result.rows[0], { status: 201 }));
    } catch (error) {
        console.error('Error creating thumbnail:', error);
        if (error instanceof z.ZodError || isValidationError(error)) {
            return withSecurityHeaders(NextResponse.json({ error: 'Datos inválidos' }, { status: 400 }));
        }
        return withSecurityHeaders(NextResponse.json({ error: 'Error al crear miniatura' }, { status: 500 }));
    }
}));

export const PUT = requireRoles(['owner'])(rateLimit(API_RATE_LIMIT)(async (request: NextRequest) => {
    try {
        const userId = (await getAuthUser(request))?.userId;

        if (!userId) {
            return withSecurityHeaders(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
        }

        const { searchParams } = new URL(request.url);
        const thumbnailId = searchParams.get('id');
        if (!thumbnailId) {
            return withSecurityHeaders(NextResponse.json({ error: 'ID requerido' }, { status: 400 }));
        }

        const body = await request.json();
        const data = validateInput(UpdateThumbnailSchema, body);

        const updates: string[] = [];
        const params: (string | null)[] = [];
        let paramIndex = 1;

        if (data.title !== undefined) { updates.push(`title = $${paramIndex++}`); params.push(data.title); }
        if (data.notes !== undefined) { updates.push(`notes = $${paramIndex++}`); params.push(data.notes); }
        if (data.imageUrl !== undefined) { updates.push(`image_url = $${paramIndex++}`); params.push(data.imageUrl); }
        if (data.status !== undefined) { updates.push(`status = $${paramIndex++}`); params.push(data.status); }

        if (updates.length === 0) {
            return withSecurityHeaders(NextResponse.json({ error: 'No hay campos' }, { status: 400 }));
        }

        params.push(thumbnailId, userId);
        const result = await query(`UPDATE thumbnails SET ${updates.join(', ')} WHERE id = $${paramIndex++} AND user_id = $${paramIndex} RETURNING *`, params);

        if (result.rows.length === 0) {
            return withSecurityHeaders(NextResponse.json({ error: 'Miniatura no encontrada' }, { status: 404 }));
        }

        if (data.status === 'approved') {
            const row = result.rows[0] as { id: string; script_id?: string | null; video_id?: string | null };
            if (row.script_id) {
                await query(
                    `UPDATE productions
                     SET thumbnail_id = $1, status = 'publishing', updated_at = NOW()
                     WHERE script_id = $2 AND user_id = $3`,
                    [row.id, row.script_id, userId]
                );
            } else if (row.video_id) {
                await query(
                    `UPDATE productions
                     SET thumbnail_id = $1, status = 'publishing', updated_at = NOW()
                     WHERE video_id = $2 AND user_id = $3`,
                    [row.id, row.video_id, userId]
                );
            }
        }

        return withSecurityHeaders(NextResponse.json(result.rows[0]));
    } catch (error) {
        console.error('Error updating thumbnail:', error);
        if (isValidationError(error)) {
            return withSecurityHeaders(NextResponse.json({ error: 'Datos inválidos' }, { status: 400 }));
        }
        return withSecurityHeaders(NextResponse.json({ error: 'Error al actualizar miniatura' }, { status: 500 }));
    }
}));

export const DELETE = requireRoles(['owner'])(rateLimit(API_RATE_LIMIT)(async (request: NextRequest) => {
    try {
        const userId = (await getAuthUser(request))?.userId;

        if (!userId) {
            return withSecurityHeaders(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
        }

        const { searchParams } = new URL(request.url);
        const thumbnailId = searchParams.get('id');
        if (!thumbnailId) {
            return withSecurityHeaders(NextResponse.json({ error: 'ID requerido' }, { status: 400 }));
        }

        const result = await query('DELETE FROM thumbnails WHERE id = $1 AND user_id = $2 RETURNING id', [thumbnailId, userId]);
        if (result.rows.length === 0) {
            return withSecurityHeaders(NextResponse.json({ error: 'Miniatura no encontrada' }, { status: 404 }));
        }

        return withSecurityHeaders(NextResponse.json({ message: 'Miniatura eliminada' }));
    } catch (error) {
        console.error('Error deleting thumbnail:', error);
        return withSecurityHeaders(NextResponse.json({ error: 'Error al eliminar miniatura' }, { status: 500 }));
    }
}));
