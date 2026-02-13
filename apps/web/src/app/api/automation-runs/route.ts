import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { query } from '@/lib/db';
import { withSecurityHeaders, getAuthUser } from '@/middleware/auth';
import { rateLimit, API_RATE_LIMIT } from '@/middleware/rateLimit';
import { requireRoles } from '@/middleware/rbac';
import { logger } from '@/lib/logger';
import { emitMetric } from '@/lib/observability';

export const dynamic = 'force-dynamic';

const CreateRunSchema = z.object({
  workflowName: z.string().min(1).max(100),
  workflowId: z.string().max(100).optional().nullable(),
  executionId: z.string().max(100).optional().nullable(),
  productionId: z.string().uuid().optional().nullable(),
  status: z.enum(['running', 'completed', 'error']).optional(),
  errorMessage: z.string().max(500).optional().nullable(),
});

const UpdateRunSchema = z.object({
  status: z.enum(['running', 'completed', 'error']).optional(),
  errorMessage: z.string().max(500).optional().nullable(),
});

export async function GET(request: NextRequest) {
  try {
    const userId = getAuthUser(request)?.userId;
    if (!userId) {
      return withSecurityHeaders(NextResponse.json({ error: 'No autorizado' }, { status: 401 }));
    }

    const result = await query(
      `SELECT id, workflow_name, workflow_id, execution_id, status, error_message,
              started_at, completed_at
       FROM automation_runs
       WHERE user_id = $1
       ORDER BY started_at DESC
       LIMIT 10`,
      [userId]
    );

    return withSecurityHeaders(NextResponse.json(result.rows));
  } catch (error) {
    logger.error('automation_runs.list.error', { error: String(error) });
    return withSecurityHeaders(NextResponse.json({ error: 'Error al obtener ejecuciones' }, { status: 500 }));
  }
}

export const POST = requireRoles(['owner'])(rateLimit(API_RATE_LIMIT)(async (request: NextRequest) => {
  try {
    const userId = getAuthUser(request)?.userId;
    if (!userId) {
      return withSecurityHeaders(NextResponse.json({ error: 'No autorizado' }, { status: 401 }));
    }

    const body = await request.json();
    const data = CreateRunSchema.parse(body);

    const result = await query(
      `INSERT INTO automation_runs (user_id, production_id, workflow_name, workflow_id, execution_id, status, error_message)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, workflow_name, workflow_id, execution_id, status, error_message, started_at, completed_at`,
      [
        userId,
        data.productionId || null,
        data.workflowName,
        data.workflowId || null,
        data.executionId || null,
        data.status || 'running',
        data.errorMessage || null,
      ]
    );

    emitMetric({ name: 'automation.run.create', value: 1, tags: { status: result.rows[0].status } });
    return withSecurityHeaders(NextResponse.json(result.rows[0], { status: 201 }));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return withSecurityHeaders(NextResponse.json({ error: 'Datos inválidos', details: error.errors }, { status: 400 }));
    }
    logger.error('automation_runs.create.error', { error: String(error) });
    emitMetric({ name: 'automation.run.create_error', value: 1 });
    return withSecurityHeaders(NextResponse.json({ error: 'Error al crear ejecución' }, { status: 500 }));
  }
}));

export const PUT = requireRoles(['owner'])(rateLimit(API_RATE_LIMIT)(async (request: NextRequest) => {
  try {
    const userId = getAuthUser(request)?.userId;
    if (!userId) {
      return withSecurityHeaders(NextResponse.json({ error: 'No autorizado' }, { status: 401 }));
    }

    const { searchParams } = new URL(request.url);
    const runId = searchParams.get('id');
    if (!runId) {
      return withSecurityHeaders(NextResponse.json({ error: 'ID requerido' }, { status: 400 }));
    }

    const body = await request.json();
    const data = UpdateRunSchema.parse(body);

    const updates: string[] = [];
    const params: (string | null)[] = [];
    let paramIndex = 1;

    if (data.status) {
      updates.push(`status = $${paramIndex++}`);
      params.push(data.status);
      if (data.status !== 'running') {
        updates.push(`completed_at = NOW()`);
      }
    }
    if (data.errorMessage !== undefined) {
      updates.push(`error_message = $${paramIndex++}`);
      params.push(data.errorMessage);
    }

    if (updates.length === 0) {
      return withSecurityHeaders(NextResponse.json({ error: 'No hay campos para actualizar' }, { status: 400 }));
    }

    params.push(runId, userId);

    const result = await query(
      `UPDATE automation_runs SET ${updates.join(', ')}
       WHERE id = $${paramIndex++} AND user_id = $${paramIndex}
       RETURNING id, workflow_name, workflow_id, execution_id, status, error_message, started_at, completed_at`,
      params
    );

    if (result.rows.length === 0) {
      emitMetric({ name: 'automation.run.not_found', value: 1 });
      return withSecurityHeaders(NextResponse.json({ error: 'Ejecución no encontrada' }, { status: 404 }));
    }

    emitMetric({ name: 'automation.run.update', value: 1, tags: { status: result.rows[0].status } });
    return withSecurityHeaders(NextResponse.json(result.rows[0]));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return withSecurityHeaders(NextResponse.json({ error: 'Datos inválidos', details: error.errors }, { status: 400 }));
    }
    logger.error('automation_runs.update.error', { error: String(error) });
    emitMetric({ name: 'automation.run.update_error', value: 1 });
    return withSecurityHeaders(NextResponse.json({ error: 'Error al actualizar ejecución' }, { status: 500 }));
  }
}));
