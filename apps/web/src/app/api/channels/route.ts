import { NextRequest, NextResponse } from 'next/server';
import { validateInput, CreateChannelSchema, CreateChannelInput } from '@/lib/validation';
import { withSecurityHeaders } from '@/middleware/auth';
import { rateLimit, API_RATE_LIMIT } from '@/middleware/rateLimit';
import { withCORS } from '@/middleware/cors';
import { query } from '@/lib/db';

/**
 * GET /api/channels
 * Lista todos los canales de YouTube
 */
export async function GET(request: NextRequest) {
    try {
        const result = await query(
            `SELECT id, name, youtube_channel_id, subscribers, created_at, updated_at 
       FROM channels 
       ORDER BY created_at DESC`
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
        console.error('[GET /api/channels] Error:', error instanceof Error ? error.message : 'Unknown error');

        return NextResponse.json(
            { error: 'Failed to fetch channels' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/channels
 * Crea un nuevo canal de YouTube
 */
export const POST = rateLimit(API_RATE_LIMIT)(async (request: NextRequest) => {
    try {
        const body = await request.json();

        // Validar con Zod
        const validatedData = validateInput<CreateChannelInput>(CreateChannelSchema, body);

        // Obtener el primer usuario (demo) - TODO: usar usuario autenticado
        const userResult = await query('SELECT id FROM app_users LIMIT 1');

        if (userResult.rows.length === 0) {
            return NextResponse.json(
                { error: 'No user found. Please create a user first.' },
                { status: 400 }
            );
        }

        const userId = userResult.rows[0].id;

        // Insertar en base de datos
        const result = await query(
            `INSERT INTO channels (user_id, name, youtube_channel_id, refresh_token) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, name, youtube_channel_id, subscribers, created_at, updated_at`,
            [userId, validatedData.name, validatedData.youtubeChannelId, validatedData.refreshToken]
        );

        // Log seguro (sin refresh_token)
        console.log('[POST /api/channels] Created:', {
            id: result.rows[0].id,
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
            return NextResponse.json(
                { error: error.message },
                { status: 400 }
            );
        }

        // Manejar error de duplicado
        if (error instanceof Error && error.message.includes('duplicate key')) {
            return NextResponse.json(
                { error: 'Channel with this YouTube ID already exists' },
                { status: 409 }
            );
        }

        console.error('[POST /api/channels] Error:', error instanceof Error ? error.message : 'Unknown error');

        return NextResponse.json(
            { error: 'Failed to create channel' },
            { status: 500 }
        );
    }
});

/**
 * OPTIONS /api/channels
 * Manejar preflight requests
 */
export async function OPTIONS(request: NextRequest) {
    const { handlePreflight } = await import('@/middleware/cors');
    return handlePreflight(request);
}
