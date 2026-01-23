import { NextRequest, NextResponse } from 'next/server';
import { validateInput, UpdateVideoSchema } from '@/lib/validation';
import { withSecurityHeaders, withAuth, getAuthUser } from '@/middleware/auth';
import { rateLimit, API_RATE_LIMIT } from '@/middleware/rateLimit';
import { query } from '@/lib/db';

interface RouteParams {
    params: Promise<{ id: string }>;
}

/**
 * GET /api/videos/[id]
 * Obtiene un video específico
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;

        const result = await query(
            `SELECT v.id, v.channel_id, v.youtube_video_id, v.title, v.description,
                    v.published_at, v.views, v.likes, v.comments, v.created_at, v.updated_at,
                    c.name as channel_name, c.youtube_channel_id
             FROM videos v
             JOIN channels c ON v.channel_id = c.id
             WHERE v.id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return NextResponse.json(
                { error: 'Video no encontrado' },
                { status: 404 }
            );
        }

        const response = NextResponse.json(result.rows[0]);
        return withSecurityHeaders(response);
    } catch (error) {
        console.error('[GET /api/videos/:id] Error:', error instanceof Error ? error.message : 'Unknown error');

        return NextResponse.json(
            { error: 'Error al obtener video' },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/videos/[id]
 * Actualiza un video (requiere autenticación)
 */
export const PUT = rateLimit(API_RATE_LIMIT)(
    withAuth(async (request: NextRequest, { params }: RouteParams) => {
        try {
            const { id } = await params;
            const body = await request.json();

            // Validar input
            const validatedData = validateInput(UpdateVideoSchema, body);

            // Verificar que el video existe
            const existingVideo = await query(
                'SELECT id FROM videos WHERE id = $1',
                [id]
            );

            if (existingVideo.rows.length === 0) {
                return NextResponse.json(
                    { error: 'Video no encontrado' },
                    { status: 404 }
                );
            }

            // Construir query dinámica para actualización
            const updates: string[] = [];
            const values: unknown[] = [];
            let paramIndex = 1;

            if (validatedData.title !== undefined) {
                updates.push(`title = $${paramIndex++}`);
                values.push(validatedData.title);
            }
            if (validatedData.description !== undefined) {
                updates.push(`description = $${paramIndex++}`);
                values.push(validatedData.description);
            }
            if (validatedData.views !== undefined) {
                updates.push(`views = $${paramIndex++}`);
                values.push(validatedData.views);
            }
            if (validatedData.likes !== undefined) {
                updates.push(`likes = $${paramIndex++}`);
                values.push(validatedData.likes);
            }
            if (validatedData.comments !== undefined) {
                updates.push(`comments = $${paramIndex++}`);
                values.push(validatedData.comments);
            }

            if (updates.length === 0) {
                return NextResponse.json(
                    { error: 'No hay campos para actualizar' },
                    { status: 400 }
                );
            }

            updates.push(`updated_at = NOW()`);
            values.push(id);

            const result = await query(
                `UPDATE videos SET ${updates.join(', ')} WHERE id = $${paramIndex}
                 RETURNING id, channel_id, youtube_video_id, title, description, published_at, views, likes, comments, created_at, updated_at`,
                values
            );

            const user = getAuthUser(request);
            console.log('[PUT /api/videos/:id] Video actualizado:', {
                id,
                by: user?.email,
            });

            const response = NextResponse.json(result.rows[0]);
            return withSecurityHeaders(response);
        } catch (error) {
            if (error instanceof Error && error.message.includes('Validation error')) {
                return NextResponse.json(
                    { error: error.message },
                    { status: 400 }
                );
            }

            console.error('[PUT /api/videos/:id] Error:', error instanceof Error ? error.message : 'Unknown error');

            return NextResponse.json(
                { error: 'Error al actualizar video' },
                { status: 500 }
            );
        }
    })
);

/**
 * DELETE /api/videos/[id]
 * Elimina un video (requiere autenticación)
 */
export const DELETE = rateLimit(API_RATE_LIMIT)(
    withAuth(async (request: NextRequest, { params }: RouteParams) => {
        try {
            const { id } = await params;

            const result = await query(
                'DELETE FROM videos WHERE id = $1 RETURNING id, title',
                [id]
            );

            if (result.rows.length === 0) {
                return NextResponse.json(
                    { error: 'Video no encontrado' },
                    { status: 404 }
                );
            }

            const user = getAuthUser(request);
            console.log('[DELETE /api/videos/:id] Video eliminado:', {
                id,
                title: result.rows[0].title,
                by: user?.email,
            });

            return new NextResponse(null, { status: 204 });
        } catch (error) {
            console.error('[DELETE /api/videos/:id] Error:', error instanceof Error ? error.message : 'Unknown error');

            return NextResponse.json(
                { error: 'Error al eliminar video' },
                { status: 500 }
            );
        }
    })
);

/**
 * OPTIONS /api/videos/[id]
 * Manejar preflight requests
 */
export async function OPTIONS(request: NextRequest) {
    const { handlePreflight } = await import('@/middleware/cors');
    return handlePreflight(request);
}
