import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { withSecurityHeaders } from '@/lib/security';
import { withAuth, rateLimit, API_RATE_LIMIT } from '@/lib/auth';
import { z } from 'zod';
import { validateInput } from '@/lib/validation';

// Schemas
const CreateIdeaSchema = z.object({
    title: z.string().min(1).max(200),
    description: z.string().optional(),
    channelId: z.string().uuid().optional(),
    priority: z.number().int().min(0).max(10).optional(),
    tags: z.array(z.string()).optional(),
});

const UpdateIdeaSchema = z.object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().optional(),
    status: z.enum(['draft', 'approved', 'in_production', 'completed', 'archived']).optional(),
    priority: z.number().int().min(0).max(10).optional(),
    tags: z.array(z.string()).optional(),
});

// GET - Lista todas las ideas del usuario
export async function GET(request: NextRequest) {
    try {
        const authResult = await withAuth(request);
        if (authResult instanceof NextResponse) return authResult;
        const userId = authResult.userId;

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const channelId = searchParams.get('channelId');

        let queryText = `
            SELECT i.*, c.name as channel_name 
            FROM ideas i 
            LEFT JOIN channels c ON i.channel_id = c.id 
            WHERE i.user_id = $1
        `;
        const params: (string | null)[] = [userId];
        let paramIndex = 2;

        if (status) {
            queryText += ` AND i.status = $${paramIndex}`;
            params.push(status);
            paramIndex++;
        }

        if (channelId) {
            queryText += ` AND i.channel_id = $${paramIndex}`;
            params.push(channelId);
        }

        queryText += ' ORDER BY i.priority DESC, i.created_at DESC';

        const result = await query(queryText, params);

        const response = NextResponse.json(result.rows);
        return withSecurityHeaders(response);
    } catch (error) {
        console.error('Error fetching ideas:', error);
        return withSecurityHeaders(
            NextResponse.json({ error: 'Error al obtener ideas' }, { status: 500 })
        );
    }
}

// POST - Crear nueva idea
export const POST = rateLimit(API_RATE_LIMIT)(async (request: NextRequest) => {
    try {
        const authResult = await withAuth(request);
        if (authResult instanceof NextResponse) return authResult;
        const userId = authResult.userId;

        const body = await request.json();
        const data = validateInput(CreateIdeaSchema, body);

        const result = await query(
            `INSERT INTO ideas (user_id, channel_id, title, description, priority, tags)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING *`,
            [
                userId,
                data.channelId || null,
                data.title,
                data.description || null,
                data.priority || 0,
                data.tags || [],
            ]
        );

        const response = NextResponse.json(result.rows[0], { status: 201 });
        return withSecurityHeaders(response);
    } catch (error) {
        console.error('Error creating idea:', error);
        if (error instanceof z.ZodError) {
            return withSecurityHeaders(
                NextResponse.json({ error: 'Datos inválidos', details: error.errors }, { status: 400 })
            );
        }
        return withSecurityHeaders(
            NextResponse.json({ error: 'Error al crear idea' }, { status: 500 })
        );
    }
});

// PUT - Actualizar idea
export const PUT = rateLimit(API_RATE_LIMIT)(async (request: NextRequest) => {
    try {
        const authResult = await withAuth(request);
        if (authResult instanceof NextResponse) return authResult;
        const userId = authResult.userId;

        const { searchParams } = new URL(request.url);
        const ideaId = searchParams.get('id');

        if (!ideaId) {
            return withSecurityHeaders(
                NextResponse.json({ error: 'ID de idea requerido' }, { status: 400 })
            );
        }

        const body = await request.json();
        const data = validateInput(UpdateIdeaSchema, body);

        // Build dynamic update query
        const updates: string[] = [];
        const params: (string | number | string[] | null)[] = [];
        let paramIndex = 1;

        if (data.title !== undefined) {
            updates.push(`title = $${paramIndex++}`);
            params.push(data.title);
        }
        if (data.description !== undefined) {
            updates.push(`description = $${paramIndex++}`);
            params.push(data.description);
        }
        if (data.status !== undefined) {
            updates.push(`status = $${paramIndex++}`);
            params.push(data.status);
        }
        if (data.priority !== undefined) {
            updates.push(`priority = $${paramIndex++}`);
            params.push(data.priority);
        }
        if (data.tags !== undefined) {
            updates.push(`tags = $${paramIndex++}`);
            params.push(data.tags);
        }

        if (updates.length === 0) {
            return withSecurityHeaders(
                NextResponse.json({ error: 'No hay campos para actualizar' }, { status: 400 })
            );
        }

        params.push(ideaId, userId);

        const result = await query(
            `UPDATE ideas SET ${updates.join(', ')} 
             WHERE id = $${paramIndex++} AND user_id = $${paramIndex}
             RETURNING *`,
            params
        );

        if (result.rows.length === 0) {
            return withSecurityHeaders(
                NextResponse.json({ error: 'Idea no encontrada' }, { status: 404 })
            );
        }

        const response = NextResponse.json(result.rows[0]);
        return withSecurityHeaders(response);
    } catch (error) {
        console.error('Error updating idea:', error);
        return withSecurityHeaders(
            NextResponse.json({ error: 'Error al actualizar idea' }, { status: 500 })
        );
    }
});

// DELETE - Eliminar idea
export const DELETE = rateLimit(API_RATE_LIMIT)(async (request: NextRequest) => {
    try {
        const authResult = await withAuth(request);
        if (authResult instanceof NextResponse) return authResult;
        const userId = authResult.userId;

        const { searchParams } = new URL(request.url);
        const ideaId = searchParams.get('id');

        if (!ideaId) {
            return withSecurityHeaders(
                NextResponse.json({ error: 'ID de idea requerido' }, { status: 400 })
            );
        }

        const result = await query(
            'DELETE FROM ideas WHERE id = $1 AND user_id = $2 RETURNING id',
            [ideaId, userId]
        );

        if (result.rows.length === 0) {
            return withSecurityHeaders(
                NextResponse.json({ error: 'Idea no encontrada' }, { status: 404 })
            );
        }

        const response = NextResponse.json({ message: 'Idea eliminada' });
        return withSecurityHeaders(response);
    } catch (error) {
        console.error('Error deleting idea:', error);
        return withSecurityHeaders(
            NextResponse.json({ error: 'Error al eliminar idea' }, { status: 500 })
        );
    }
});
