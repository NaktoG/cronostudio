import { NextRequest, NextResponse } from 'next/server';
import { validateInput, CreateChannelSchema, CreateChannelInput, UpdateChannelSchema, UpdateChannelInput } from '@/lib/validation';
import { withSecurityHeaders } from '@/middleware/auth';
import { rateLimit, API_RATE_LIMIT } from '@/middleware/rateLimit';
import { authenticateUserOrService } from '@/middleware/serviceAuth';
import { query } from '@/lib/db';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

/**
 * GET /api/channels
 * Lista todos los canales de YouTube
 */
// Services Initialization



/**
 * GET /api/channels
 * Lista los canales del usuario autenticado
 */
export const GET = rateLimit(API_RATE_LIMIT)(async (request: NextRequest) => {
    try {
        const authResult = await authenticateUserOrService(request);
        if (authResult.response) return authResult.response;
        const { userId } = authResult;

        const result = await query(
            `SELECT id, name, youtube_channel_id, subscribers, created_at, updated_at 
       FROM channels 
       WHERE user_id = $1
       ORDER BY created_at DESC`,
            [userId]
        );

        const response = NextResponse.json(result.rows, {
            headers: {
                'X-Content-Type-Options': 'nosniff',
                'X-Frame-Options': 'DENY',
                'Cache-Control': 'no-store',
            },
        });

        return withSecurityHeaders(response);
    } catch (error) {
        logger.error('[GET /api/channels] Error', {
            error: error instanceof Error ? error.message : 'Unknown error',
        });

        return withSecurityHeaders(NextResponse.json(
            { error: 'Failed to fetch channels' },
            { status: 500 }
        ));
    }
});

/**
 * POST /api/channels
 * Crea un nuevo canal de YouTube vinculado al usuario
 */
export const POST = rateLimit(API_RATE_LIMIT)(async (request: NextRequest) => {
    try {
        const authResult = await authenticateUserOrService(request, { ownerOnly: true });
        if (authResult.response) return authResult.response;
        const { userId } = authResult;

        const body = await request.json();

        // Validar con Zod
        const validatedData = validateInput<CreateChannelInput>(CreateChannelSchema, body);

        // Insertar en base de datos vinculado al usuario autenticado
        const result = await query(
            `INSERT INTO channels (user_id, name, youtube_channel_id, refresh_token) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, name, youtube_channel_id, subscribers, created_at, updated_at`,
            [userId, validatedData.name, validatedData.youtubeChannelId, validatedData.refreshToken]
        );

        // Log seguro (sin refresh_token)
        logger.info('[POST /api/channels] Created', {
            id: result.rows[0].id,
            userId: userId,
            name: validatedData.name,
            youtubeChannelId: validatedData.youtubeChannelId,
        });

        const response = NextResponse.json(result.rows[0], {
            status: 201,
            headers: {
                'X-Content-Type-Options': 'nosniff',
            },
        });

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
                { error: 'Channel with this YouTube ID already exists' },
                { status: 409 }
            ));
        }

        logger.error('[POST /api/channels] Error', {
            error: error instanceof Error ? error.message : 'Unknown error',
        });

        return withSecurityHeaders(NextResponse.json(
            { error: 'Failed to create channel' },
            { status: 500 }
        ));
    }
});

/**
 * PUT /api/channels?id=...
 * Actualiza un canal del usuario
 */
export const PUT = rateLimit(API_RATE_LIMIT)(async (request: NextRequest) => {
    try {
        const authResult = await authenticateUserOrService(request, { ownerOnly: true });
        if (authResult.response) return authResult.response;
        const { userId } = authResult;

        const { searchParams } = new URL(request.url);
        const channelId = searchParams.get('id');
        if (!channelId) {
            return withSecurityHeaders(NextResponse.json({ error: 'ID requerido' }, { status: 400 }));
        }

        const body = await request.json();
        const validatedData = validateInput<UpdateChannelInput>(UpdateChannelSchema, body);

        const updates: string[] = [];
        const params: (string | number | null)[] = [];
        let paramIndex = 1;

        if (validatedData.name !== undefined) {
            updates.push(`name = $${paramIndex++}`);
            params.push(validatedData.name);
        }
        if (validatedData.youtubeChannelId !== undefined) {
            updates.push(`youtube_channel_id = $${paramIndex++}`);
            params.push(validatedData.youtubeChannelId);
        }

        if (updates.length === 0) {
            return withSecurityHeaders(NextResponse.json({ error: 'No hay campos para actualizar' }, { status: 400 }));
        }

        updates.push(`updated_at = NOW()`);

        params.push(channelId, userId);

        const result = await query(
            `UPDATE channels
             SET ${updates.join(', ')}
             WHERE id = $${paramIndex++} AND user_id = $${paramIndex}
             RETURNING id, name, youtube_channel_id, subscribers, created_at, updated_at`,
            params
        );

        if (result.rows.length === 0) {
            return withSecurityHeaders(NextResponse.json({ error: 'Canal no encontrado o no autorizado' }, { status: 404 }));
        }

        return withSecurityHeaders(NextResponse.json(result.rows[0]));
    } catch (error) {
        if (error instanceof Error && error.message.includes('Validation error')) {
            return withSecurityHeaders(NextResponse.json({ error: error.message }, { status: 400 }));
        }
        if (error instanceof Error && error.message.includes('duplicate key')) {
            return withSecurityHeaders(NextResponse.json({ error: 'Channel with this YouTube ID already exists' }, { status: 409 }));
        }
        logger.error('[PUT /api/channels] Error', {
            error: error instanceof Error ? error.message : 'Unknown error',
        });
        return withSecurityHeaders(NextResponse.json({ error: 'Failed to update channel' }, { status: 500 }));
    }
});

/**
 * DELETE /api/channels?id=...
 * Elimina un canal del usuario
 */
export const DELETE = rateLimit(API_RATE_LIMIT)(async (request: NextRequest) => {
    try {
        const authResult = await authenticateUserOrService(request, { ownerOnly: true });
        if (authResult.response) return authResult.response;
        const { userId } = authResult;

        const { searchParams } = new URL(request.url);
        const channelId = searchParams.get('id');
        if (!channelId) {
            return withSecurityHeaders(NextResponse.json({ error: 'ID requerido' }, { status: 400 }));
        }

        const result = await query(
            'DELETE FROM channels WHERE id = $1 AND user_id = $2 RETURNING id',
            [channelId, userId]
        );

        if (result.rows.length === 0) {
            return withSecurityHeaders(NextResponse.json({ error: 'Canal no encontrado o no autorizado' }, { status: 404 }));
        }

        return withSecurityHeaders(NextResponse.json({ success: true }));
    } catch (error) {
        logger.error('[DELETE /api/channels] Error', {
            error: error instanceof Error ? error.message : 'Unknown error',
        });
        return withSecurityHeaders(NextResponse.json({ error: 'Failed to delete channel' }, { status: 500 }));
    }
});
