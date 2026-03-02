import { NextRequest, NextResponse } from 'next/server';
import { validateInput, CreateVideoSchema } from '@/lib/validation';
import { withSecurityHeaders, getAuthUser } from '@/middleware/auth';
import { rateLimit, API_RATE_LIMIT } from '@/middleware/rateLimit';
import { requireRolesOrServiceSecret } from '@/middleware/rbac';
import { query } from '@/lib/db';
import { logger } from '@/lib/logger';
import { getServiceUserId } from '@/lib/serviceUser';
import { getInt } from '@/lib/http/query';

export const dynamic = 'force-dynamic';



/**
 * GET /api/videos
 * Lista videos del usuario (opcional: filtrar por channelId)
 */
export async function GET(request: NextRequest) {
    try {
        let userId: string | null = getAuthUser(request)?.userId ?? null;

        if (!userId) {
            userId = await getServiceUserId(request);
        }

        if (!userId) {
            return withSecurityHeaders(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
        }

        const { searchParams } = new URL(request.url);
        const channelId = searchParams.get('channelId');
        const limit = getInt(searchParams, 'limit', { min: 1, max: 100, defaultValue: 50 });
        const offset = getInt(searchParams, 'offset', { min: 0, defaultValue: 0 });
        if (limit === null) {
            return withSecurityHeaders(NextResponse.json({ error: 'invalid_query', field: 'limit' }, { status: 400 }));
        }
        if (offset === null) {
            return withSecurityHeaders(NextResponse.json({ error: 'invalid_query', field: 'offset' }, { status: 400 }));
        }

        let queryText = `
            SELECT v.id, v.channel_id, v.youtube_video_id, v.title, v.description,
                   v.published_at, v.views, v.likes, v.comments, v.created_at, v.updated_at,
                   c.name as channel_name, c.youtube_channel_id
            FROM videos v
            JOIN channels c ON v.channel_id = c.id
            WHERE c.user_id = $1
        `;
        const params: (string | number)[] = [userId];

        if (channelId) {
            // Verify channel belongs to user implicitly via the JOIN and WHERE clause
            queryText += ' AND v.channel_id = $2';
            params.push(channelId);
        }

        queryText += ` ORDER BY v.published_at DESC NULLS LAST, v.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(limit, offset);

        const result = await query(queryText, params);

        return withSecurityHeaders(NextResponse.json(
            {
                data: result.rows,
                pagination: {
                    limit,
                    offset,
                    count: result.rows.length,
                },
            },
            {
                headers: {
                    'X-Content-Type-Options': 'nosniff',
                    'Cache-Control': 'no-store',
                },
            }
        ));
    } catch (error) {
        logger.error('[GET /api/videos] Error', {
            error: error instanceof Error ? error.message : 'Unknown error',
        });

        return withSecurityHeaders(NextResponse.json(
            { error: 'Error al obtener videos' },
            { status: 500 }
        ));
    }
}

/**
 * POST /api/videos
 * Crea un nuevo video (requiere autenticación y propiedad del canal)
 */
export const POST = requireRolesOrServiceSecret(['owner'])(rateLimit(API_RATE_LIMIT)(async (request: NextRequest) => {
    try {
        let userId: string | null = getAuthUser(request)?.userId ?? null;

        if (!userId) {
            userId = await getServiceUserId(request);
        }

        if (!userId) {
            return withSecurityHeaders(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
        }

        const body = await request.json();

        // Validar input
        const validatedData = validateInput(CreateVideoSchema, body);

        // Verificar que el canal existe Y pertenece al usuario
        const channelCheck = await query(
            'SELECT id FROM channels WHERE id = $1 AND user_id = $2',
            [validatedData.channelId, userId]
        );

        if (channelCheck.rows.length === 0) {
            return withSecurityHeaders(NextResponse.json(
                { error: 'Canal no encontrado o no autorizado' },
                { status: 404 }
            ));
        }

        // Insertar video
        const result = await query(
            `INSERT INTO videos (channel_id, youtube_video_id, title, description, published_at) 
                 VALUES ($1, $2, $3, $4, $5) 
                 RETURNING id, channel_id, youtube_video_id, title, description, published_at, views, likes, comments, created_at, updated_at`,
            [
                validatedData.channelId,
                validatedData.youtubeVideoId,
                validatedData.title,
                validatedData.description || null,
                validatedData.publishedAt || null,
            ]
        );

        logger.info('[POST /api/videos] Video creado', {
            id: result.rows[0].id,
            title: validatedData.title,
            userId: userId,
        });

        const response = NextResponse.json(result.rows[0], { status: 201 });
        return withSecurityHeaders(response);
    } catch (error) {
        if (error instanceof Error && error.message.includes('Validation error')) {
            return withSecurityHeaders(NextResponse.json(
                { error: error.message },
                { status: 400 }
            ));
        }

        if (error instanceof Error && error.message.includes('duplicate key')) {
            return withSecurityHeaders(NextResponse.json(
                { error: 'Video con este YouTube ID ya existe' },
                { status: 409 }
            ));
        }

        logger.error('[POST /api/videos] Error', {
            error: error instanceof Error ? error.message : 'Unknown error',
        });

        return withSecurityHeaders(NextResponse.json(
            { error: 'Error al crear video' },
            { status: 500 }
        ));
    }
}));
