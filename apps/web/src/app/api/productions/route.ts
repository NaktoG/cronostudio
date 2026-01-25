import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { withSecurityHeaders } from '@/middleware/auth';
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

// Status enum for productions
const PRODUCTION_STATUSES = ['idea', 'scripting', 'recording', 'editing', 'shorts', 'publishing', 'published'] as const;

// Schemas
const CreateProductionSchema = z.object({
    title: z.string().min(1).max(255),
    description: z.string().optional(),
    channelId: z.string().uuid().optional(),
    ideaId: z.string().uuid().optional(),
    targetDate: z.string().optional(), // ISO date string
    priority: z.number().int().min(0).max(10).optional(),
});

const UpdateProductionSchema = z.object({
    title: z.string().min(1).max(255).optional(),
    description: z.string().optional(),
    status: z.enum(PRODUCTION_STATUSES).optional(),
    ideaId: z.string().uuid().optional().nullable(),
    scriptId: z.string().uuid().optional().nullable(),
    thumbnailId: z.string().uuid().optional().nullable(),
    seoId: z.string().uuid().optional().nullable(),
    videoId: z.string().uuid().optional().nullable(),
    targetDate: z.string().optional().nullable(),
    priority: z.number().int().min(0).max(10).optional(),
});

// GET - List all productions for user with pipeline stats
export async function GET(request: NextRequest) {
    try {
        const userId = getUserIdFromRequest(request);
        if (!userId) {
            return withSecurityHeaders(NextResponse.json({ error: 'No autorizado' }, { status: 401 }));
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const channelId = searchParams.get('channelId');
        const includeStats = searchParams.get('stats') === 'true';

        // Get productions with related data
        let queryText = `
            SELECT 
                p.*,
                c.name as channel_name,
                i.title as idea_title,
                s.title as script_title,
                s.status as script_status,
                t.status as thumbnail_status,
                seo.score as seo_score,
                (SELECT COUNT(*) FROM shorts sh WHERE sh.production_id = p.id) as shorts_count,
                (SELECT COUNT(*) FROM shorts sh WHERE sh.production_id = p.id AND sh.status = 'published') as shorts_published,
                (SELECT COUNT(*) FROM social_posts sp WHERE sp.production_id = p.id) as posts_count,
                (SELECT COUNT(*) FROM social_posts sp WHERE sp.production_id = p.id AND sp.status = 'published') as posts_published
            FROM productions p
            LEFT JOIN channels c ON p.channel_id = c.id
            LEFT JOIN ideas i ON p.idea_id = i.id
            LEFT JOIN scripts s ON p.script_id = s.id
            LEFT JOIN thumbnails t ON p.thumbnail_id = t.id
            LEFT JOIN seo_data seo ON p.seo_id = seo.id
            WHERE p.user_id = $1
        `;
        const params: (string | null)[] = [userId];
        let paramIndex = 2;

        if (status) {
            queryText += ` AND p.status = $${paramIndex}`;
            params.push(status);
            paramIndex++;
        }

        if (channelId) {
            queryText += ` AND p.channel_id = $${paramIndex}`;
            params.push(channelId);
        }

        queryText += ' ORDER BY p.priority DESC, p.updated_at DESC';

        const result = await query(queryText, params);

        // If stats requested, also return pipeline counts
        if (includeStats) {
            const statsResult = await query(`
                SELECT 
                    status,
                    COUNT(*) as count
                FROM productions
                WHERE user_id = $1
                GROUP BY status
            `, [userId]);

            const pipelineStats: Record<string, number> = {};
            for (const row of statsResult.rows) {
                pipelineStats[row.status] = parseInt(row.count);
            }

            return withSecurityHeaders(NextResponse.json({
                productions: result.rows,
                pipeline: pipelineStats
            }));
        }

        return withSecurityHeaders(NextResponse.json(result.rows));
    } catch (error: unknown) {
        console.error('Error fetching productions:', error);
        // Si la tabla no existe, devolver array vacío en lugar de error
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage.includes('does not exist') || errorMessage.includes('relation')) {
            return withSecurityHeaders(NextResponse.json({
                productions: [],
                pipeline: {}
            }));
        }
        return withSecurityHeaders(NextResponse.json({ error: 'Error al obtener producciones' }, { status: 500 }));
    }
}

// POST - Create new production
export const POST = rateLimit(API_RATE_LIMIT)(async (request: NextRequest) => {
    try {
        const userId = getUserIdFromRequest(request);
        if (!userId) {
            return withSecurityHeaders(NextResponse.json({ error: 'No autorizado' }, { status: 401 }));
        }

        const body = await request.json();
        const data = validateInput(CreateProductionSchema, body);

        const result = await query(
            `INSERT INTO productions (user_id, channel_id, title, description, idea_id, target_date, priority)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING *`,
            [
                userId,
                data.channelId || null,
                data.title,
                data.description || null,
                data.ideaId || null,
                data.targetDate || null,
                data.priority || 0
            ]
        );

        return withSecurityHeaders(NextResponse.json(result.rows[0], { status: 201 }));
    } catch (error) {
        console.error('Error creating production:', error);
        if (error instanceof z.ZodError) {
            return withSecurityHeaders(NextResponse.json({ error: 'Datos inválidos', details: error.errors }, { status: 400 }));
        }
        return withSecurityHeaders(NextResponse.json({ error: 'Error al crear producción' }, { status: 500 }));
    }
});

// PUT - Update production
export const PUT = rateLimit(API_RATE_LIMIT)(async (request: NextRequest) => {
    try {
        const userId = getUserIdFromRequest(request);
        if (!userId) {
            return withSecurityHeaders(NextResponse.json({ error: 'No autorizado' }, { status: 401 }));
        }

        const { searchParams } = new URL(request.url);
        const productionId = searchParams.get('id');
        if (!productionId) {
            return withSecurityHeaders(NextResponse.json({ error: 'ID de producción requerido' }, { status: 400 }));
        }

        const body = await request.json();
        const data = validateInput(UpdateProductionSchema, body);

        const fieldMap: Record<string, string> = {
            title: 'title',
            description: 'description',
            status: 'status',
            ideaId: 'idea_id',
            scriptId: 'script_id',
            thumbnailId: 'thumbnail_id',
            seoId: 'seo_id',
            videoId: 'video_id',
            targetDate: 'target_date',
            priority: 'priority',
        };

        const updates: string[] = [];
        const params: (string | number | null)[] = [];
        let paramIndex = 1;

        for (const [key, dbColumn] of Object.entries(fieldMap)) {
            if (data[key as keyof typeof data] !== undefined) {
                updates.push(`${dbColumn} = $${paramIndex++}`);
                params.push(data[key as keyof typeof data] as string | number | null);
            }
        }

        // Handle published_at for status change to published
        if (data.status === 'published') {
            updates.push(`published_at = NOW()`);
        }

        if (updates.length === 0) {
            return withSecurityHeaders(NextResponse.json({ error: 'No hay campos para actualizar' }, { status: 400 }));
        }

        params.push(productionId, userId);

        const result = await query(
            `UPDATE productions SET ${updates.join(', ')} WHERE id = $${paramIndex++} AND user_id = $${paramIndex} RETURNING *`,
            params
        );

        if (result.rows.length === 0) {
            return withSecurityHeaders(NextResponse.json({ error: 'Producción no encontrada' }, { status: 404 }));
        }

        return withSecurityHeaders(NextResponse.json(result.rows[0]));
    } catch (error) {
        console.error('Error updating production:', error);
        return withSecurityHeaders(NextResponse.json({ error: 'Error al actualizar producción' }, { status: 500 }));
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
        const productionId = searchParams.get('id');
        if (!productionId) {
            return withSecurityHeaders(NextResponse.json({ error: 'ID de producción requerido' }, { status: 400 }));
        }

        const result = await query('DELETE FROM productions WHERE id = $1 AND user_id = $2 RETURNING id', [productionId, userId]);

        if (result.rows.length === 0) {
            return withSecurityHeaders(NextResponse.json({ error: 'Producción no encontrada' }, { status: 404 }));
        }

        return withSecurityHeaders(NextResponse.json({ message: 'Producción eliminada' }));
    } catch (error) {
        console.error('Error deleting production:', error);
        return withSecurityHeaders(NextResponse.json({ error: 'Error al eliminar producción' }, { status: 500 }));
    }
});
