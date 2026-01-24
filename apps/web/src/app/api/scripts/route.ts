import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { withSecurityHeaders } from '@/lib/security';
import { withAuth, rateLimit, API_RATE_LIMIT } from '@/lib/auth';
import { z } from 'zod';
import { validateInput } from '@/lib/validation';

// Schemas
const CreateScriptSchema = z.object({
    title: z.string().min(1).max(200),
    ideaId: z.string().uuid().optional(),
    intro: z.string().optional(),
    body: z.string().optional(),
    cta: z.string().optional(),
    outro: z.string().optional(),
});

const UpdateScriptSchema = z.object({
    title: z.string().min(1).max(200).optional(),
    intro: z.string().optional(),
    body: z.string().optional(),
    cta: z.string().optional(),
    outro: z.string().optional(),
    status: z.enum(['draft', 'review', 'approved', 'recorded']).optional(),
});

// Helper: Calculate word count and duration
function calculateMetrics(intro?: string, body?: string, cta?: string, outro?: string) {
    const fullContent = [intro, body, cta, outro].filter(Boolean).join('\n\n');
    const wordCount = fullContent.split(/\s+/).filter(Boolean).length;
    // Average reading speed: 150 words per minute
    const estimatedDuration = Math.ceil((wordCount / 150) * 60);
    return { fullContent, wordCount, estimatedDuration };
}

// GET - Lista todos los guiones del usuario
export async function GET(request: NextRequest) {
    try {
        const authResult = await withAuth(request);
        if (authResult instanceof NextResponse) return authResult;
        const userId = authResult.userId;

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const ideaId = searchParams.get('ideaId');

        let queryText = `
            SELECT s.*, i.title as idea_title 
            FROM scripts s 
            LEFT JOIN ideas i ON s.idea_id = i.id 
            WHERE s.user_id = $1
        `;
        const params: (string | null)[] = [userId];
        let paramIndex = 2;

        if (status) {
            queryText += ` AND s.status = $${paramIndex}`;
            params.push(status);
            paramIndex++;
        }

        if (ideaId) {
            queryText += ` AND s.idea_id = $${paramIndex}`;
            params.push(ideaId);
        }

        queryText += ' ORDER BY s.created_at DESC';

        const result = await query(queryText, params);

        const response = NextResponse.json(result.rows);
        return withSecurityHeaders(response);
    } catch (error) {
        console.error('Error fetching scripts:', error);
        return withSecurityHeaders(
            NextResponse.json({ error: 'Error al obtener guiones' }, { status: 500 })
        );
    }
}

// POST - Crear nuevo guion
export const POST = rateLimit(API_RATE_LIMIT)(async (request: NextRequest) => {
    try {
        const authResult = await withAuth(request);
        if (authResult instanceof NextResponse) return authResult;
        const userId = authResult.userId;

        const body = await request.json();
        const data = validateInput(CreateScriptSchema, body);

        const { fullContent, wordCount, estimatedDuration } = calculateMetrics(
            data.intro, data.body, data.cta, data.outro
        );

        const result = await query(
            `INSERT INTO scripts (user_id, idea_id, title, intro, body, cta, outro, full_content, word_count, estimated_duration_seconds)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
             RETURNING *`,
            [
                userId,
                data.ideaId || null,
                data.title,
                data.intro || null,
                data.body || null,
                data.cta || null,
                data.outro || null,
                fullContent,
                wordCount,
                estimatedDuration,
            ]
        );

        // Update idea status if linked
        if (data.ideaId) {
            await query(
                "UPDATE ideas SET status = 'in_production' WHERE id = $1 AND status = 'approved'",
                [data.ideaId]
            );
        }

        const response = NextResponse.json(result.rows[0], { status: 201 });
        return withSecurityHeaders(response);
    } catch (error) {
        console.error('Error creating script:', error);
        if (error instanceof z.ZodError) {
            return withSecurityHeaders(
                NextResponse.json({ error: 'Datos inválidos', details: error.errors }, { status: 400 })
            );
        }
        return withSecurityHeaders(
            NextResponse.json({ error: 'Error al crear guion' }, { status: 500 })
        );
    }
});

// PUT - Update script
export const PUT = rateLimit(API_RATE_LIMIT)(async (request: NextRequest) => {
    try {
        const authResult = await withAuth(request);
        if (authResult instanceof NextResponse) return authResult;
        const userId = authResult.userId;

        const { searchParams } = new URL(request.url);
        const scriptId = searchParams.get('id');

        if (!scriptId) {
            return withSecurityHeaders(
                NextResponse.json({ error: 'ID de guion requerido' }, { status: 400 })
            );
        }

        const body = await request.json();
        const data = validateInput(UpdateScriptSchema, body);

        // Get current script data for metrics calculation
        const current = await query(
            'SELECT intro, body, cta, outro FROM scripts WHERE id = $1 AND user_id = $2',
            [scriptId, userId]
        );

        if (current.rows.length === 0) {
            return withSecurityHeaders(
                NextResponse.json({ error: 'Guion no encontrado' }, { status: 404 })
            );
        }

        const merged = {
            intro: data.intro ?? current.rows[0].intro,
            body: data.body ?? current.rows[0].body,
            cta: data.cta ?? current.rows[0].cta,
            outro: data.outro ?? current.rows[0].outro,
        };

        const { fullContent, wordCount, estimatedDuration } = calculateMetrics(
            merged.intro, merged.body, merged.cta, merged.outro
        );

        const updates: string[] = ['full_content = $1', 'word_count = $2', 'estimated_duration_seconds = $3'];
        const params: (string | number | null)[] = [fullContent, wordCount, estimatedDuration];
        let paramIndex = 4;

        if (data.title !== undefined) {
            updates.push(`title = $${paramIndex++}`);
            params.push(data.title);
        }
        if (data.intro !== undefined) {
            updates.push(`intro = $${paramIndex++}`);
            params.push(data.intro);
        }
        if (data.body !== undefined) {
            updates.push(`body = $${paramIndex++}`);
            params.push(data.body);
        }
        if (data.cta !== undefined) {
            updates.push(`cta = $${paramIndex++}`);
            params.push(data.cta);
        }
        if (data.outro !== undefined) {
            updates.push(`outro = $${paramIndex++}`);
            params.push(data.outro);
        }
        if (data.status !== undefined) {
            updates.push(`status = $${paramIndex++}`);
            params.push(data.status);
        }

        params.push(scriptId, userId);

        const result = await query(
            `UPDATE scripts SET ${updates.join(', ')} 
             WHERE id = $${paramIndex++} AND user_id = $${paramIndex}
             RETURNING *`,
            params
        );

        const response = NextResponse.json(result.rows[0]);
        return withSecurityHeaders(response);
    } catch (error) {
        console.error('Error updating script:', error);
        return withSecurityHeaders(
            NextResponse.json({ error: 'Error al actualizar guion' }, { status: 500 })
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
        const scriptId = searchParams.get('id');

        if (!scriptId) {
            return withSecurityHeaders(
                NextResponse.json({ error: 'ID de guion requerido' }, { status: 400 })
            );
        }

        const result = await query(
            'DELETE FROM scripts WHERE id = $1 AND user_id = $2 RETURNING id',
            [scriptId, userId]
        );

        if (result.rows.length === 0) {
            return withSecurityHeaders(
                NextResponse.json({ error: 'Guion no encontrado' }, { status: 404 })
            );
        }

        const response = NextResponse.json({ message: 'Guion eliminado' });
        return withSecurityHeaders(response);
    } catch (error) {
        console.error('Error deleting script:', error);
        return withSecurityHeaders(
            NextResponse.json({ error: 'Error al eliminar guion' }, { status: 500 })
        );
    }
});
