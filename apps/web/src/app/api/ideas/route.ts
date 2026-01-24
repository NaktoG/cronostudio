import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { withSecurityHeaders, getAuthUser } from '@/middleware/auth';
import { rateLimit, API_RATE_LIMIT } from '@/middleware/rateLimit';
import { z } from 'zod';
import { validateInput } from '@/lib/validation';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';

// Helper to get userId from token
function getUserIdFromRequest(request: NextRequest): string | null {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
    try {
        const token = authHeader.slice(7);
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
        return decoded.userId;
    } catch {
        return null;
    }
}

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
        const userId = getUserIdFromRequest(request);
        if (!userId) {
            return withSecurityHeaders(NextResponse.json({ error: 'No autorizado' }, { status: 401 }));
        }

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
        return withSecurityHeaders(NextResponse.json(result.rows));
    } catch (error) {
        console.error('Error fetching ideas:', error);
        return withSecurityHeaders(NextResponse.json({ error: 'Error al obtener ideas' }, { status: 500 }));
    }
}

// POST - Crear nueva idea
export const POST = rateLimit(API_RATE_LIMIT)(async (request: NextRequest) => {
    try {
        const userId = getUserIdFromRequest(request);
        if (!userId) {
            return withSecurityHeaders(NextResponse.json({ error: 'No autorizado' }, { status: 401 }));
        }

        const body = await request.json();
        const data = validateInput(CreateIdeaSchema, body);

        const result = await query(
            `INSERT INTO ideas (user_id, channel_id, title, description, priority, tags)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING *`,
            [userId, data.channelId || null, data.title, data.description || null, data.priority || 0, data.tags || []]
        );

        return withSecurityHeaders(NextResponse.json(result.rows[0], { status: 201 }));
    } catch (error) {
        console.error('Error creating idea:', error);
        if (error instanceof z.ZodError) {
            return withSecurityHeaders(NextResponse.json({ error: 'Datos inválidos', details: error.errors }, { status: 400 }));
        }
        return withSecurityHeaders(NextResponse.json({ error: 'Error al crear idea' }, { status: 500 }));
    }
});

// PUT - Actualizar idea
export const PUT = rateLimit(API_RATE_LIMIT)(async (request: NextRequest) => {
    try {
        const userId = getUserIdFromRequest(request);
        if (!userId) {
            return withSecurityHeaders(NextResponse.json({ error: 'No autorizado' }, { status: 401 }));
        }

        const { searchParams } = new URL(request.url);
        const ideaId = searchParams.get('id');
        if (!ideaId) {
            return withSecurityHeaders(NextResponse.json({ error: 'ID de idea requerido' }, { status: 400 }));
        }

        const body = await request.json();
        const data = validateInput(UpdateIdeaSchema, body);

        const updates: string[] = [];
        const params: (string | number | string[] | null)[] = [];
        let paramIndex = 1;

        if (data.title !== undefined) { updates.push(`title = $${paramIndex++}`); params.push(data.title); }
        if (data.description !== undefined) { updates.push(`description = $${paramIndex++}`); params.push(data.description); }
        if (data.status !== undefined) { updates.push(`status = $${paramIndex++}`); params.push(data.status); }
        if (data.priority !== undefined) { updates.push(`priority = $${paramIndex++}`); params.push(data.priority); }
        if (data.tags !== undefined) { updates.push(`tags = $${paramIndex++}`); params.push(data.tags); }

        if (updates.length === 0) {
            return withSecurityHeaders(NextResponse.json({ error: 'No hay campos para actualizar' }, { status: 400 }));
        }

        params.push(ideaId, userId);

        const result = await query(
            `UPDATE ideas SET ${updates.join(', ')} WHERE id = $${paramIndex++} AND user_id = $${paramIndex} RETURNING *`,
            params
        );

        if (result.rows.length === 0) {
            return withSecurityHeaders(NextResponse.json({ error: 'Idea no encontrada' }, { status: 404 }));
        }

        return withSecurityHeaders(NextResponse.json(result.rows[0]));
    } catch (error) {
        console.error('Error updating idea:', error);
        return withSecurityHeaders(NextResponse.json({ error: 'Error al actualizar idea' }, { status: 500 }));
    }
});

// DELETE
export const DELETE = rateLimit(API_RATE_LIMIT)(async (request: NextRequest) => {
    try {
        const userId = getUserIdFromRequest(request);
        if (!userId) {
            return withSecurityHeaders(NextResponse.json({ error: 'No autorizado' }, { status: 401 }));
        }

        const { searchParams } = new URL(request.url);
        const ideaId = searchParams.get('id');
        if (!ideaId) {
            return withSecurityHeaders(NextResponse.json({ error: 'ID de idea requerido' }, { status: 400 }));
        }

        const result = await query('DELETE FROM ideas WHERE id = $1 AND user_id = $2 RETURNING id', [ideaId, userId]);

        if (result.rows.length === 0) {
            return withSecurityHeaders(NextResponse.json({ error: 'Idea no encontrada' }, { status: 404 }));
        }

        return withSecurityHeaders(NextResponse.json({ message: 'Idea eliminada' }));
    } catch (error) {
        console.error('Error deleting idea:', error);
        return withSecurityHeaders(NextResponse.json({ error: 'Error al eliminar idea' }, { status: 500 }));
    }
});
