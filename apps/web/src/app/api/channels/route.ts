import { NextRequest, NextResponse } from 'next/server';
import { validateInput, CreateChannelSchema, CreateChannelInput } from '@/lib/validation';
import { withSecurityHeaders } from '@/middleware/auth';
import { rateLimit, API_RATE_LIMIT } from '@/middleware/rateLimit';
import { authenticateUserOrService } from '@/middleware/serviceAuth';
import { query } from '@/lib/db';

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
        console.error('[GET /api/channels] Error:', error instanceof Error ? error.message : 'Unknown error');

        return NextResponse.json(
            { error: 'Failed to fetch channels' },
            { status: 500 }
        );
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
        console.log('[POST /api/channels] Created:', {
            id: result.rows[0].id,
            userId: userId, // Logueamos quien lo creó
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
            // Verificar si es duplicado del mismo usuario o colisión global
            // Pero por privacidad, simplemente decimos que ya existe
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
