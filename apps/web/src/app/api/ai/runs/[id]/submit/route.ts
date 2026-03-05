import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withSecurityHeaders, getAuthUser } from '@/middleware/auth';
import { rateLimit, API_RATE_LIMIT } from '@/middleware/rateLimit';
import { requireRoles } from '@/middleware/rbac';
import { query } from '@/lib/db';
import { logger } from '@/lib/logger';
import { getAiProfile } from '@/lib/ai/profiles';

export const dynamic = 'force-dynamic';

const MAX_BODY_BYTES = 200_000;

interface RouteParams {
  params: Promise<{ id: string }>;
}

const SubmitSchema = z.object({
  outputJson: z.unknown(),
});

function parseOutput(value: unknown): unknown {
  if (typeof value === 'string') {
    return JSON.parse(value);
  }
  return value;
}

export const POST = requireRoles(['owner'])(rateLimit(API_RATE_LIMIT)(async (request: NextRequest, { params }: RouteParams) => {
  try {
    const userId = (await getAuthUser(request))?.userId;
    if (!userId) {
      return withSecurityHeaders(NextResponse.json({ error: 'No autorizado' }, { status: 401 }));
    }

    const contentLength = request.headers.get('content-length');
    if (contentLength && Number(contentLength) > MAX_BODY_BYTES) {
      return withSecurityHeaders(NextResponse.json({ error: 'payload_too_large' }, { status: 413 }));
    }

    const { id } = await params;
    const body = await request.json();
    const data = SubmitSchema.parse(body);

    const runResult = await query(
      'SELECT id, profile_key, profile_version, status FROM ai_runs WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    if (runResult.rows.length === 0) {
      return withSecurityHeaders(NextResponse.json({ error: 'Run no encontrado' }, { status: 404 }));
    }
    const run = runResult.rows[0];
    if (run.status === 'completed') {
      return withSecurityHeaders(NextResponse.json({ error: 'Run ya completado' }, { status: 409 }));
    }

    const profile = getAiProfile(run.profile_key as string);
    if (!profile) {
      return withSecurityHeaders(NextResponse.json({ error: 'invalid_profile' }, { status: 400 }));
    }
    if (profile.version !== Number(run.profile_version)) {
      return withSecurityHeaders(NextResponse.json({ error: 'profile_version_mismatch' }, { status: 409 }));
    }

    let outputPayload: unknown;
    try {
      outputPayload = parseOutput(data.outputJson);
    } catch {
      return withSecurityHeaders(NextResponse.json({ error: 'invalid_json' }, { status: 400 }));
    }

    const outputResult = profile.outputSchema.safeParse(outputPayload);
    if (!outputResult.success) {
      return withSecurityHeaders(NextResponse.json({
        error: 'invalid_output',
        details: outputResult.error.errors,
      }, { status: 400 }));
    }

    await query(
      `UPDATE ai_runs
       SET output_json = $1, status = 'completed', error = NULL
       WHERE id = $2 AND user_id = $3`,
      [JSON.stringify(outputResult.data), id, userId]
    );

    return withSecurityHeaders(NextResponse.json({ ok: true, runId: id }));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return withSecurityHeaders(NextResponse.json({ error: 'Datos inválidos', details: error.errors }, { status: 400 }));
    }
    logger.error('ai_runs.submit.error', { error: String(error) });
    return withSecurityHeaders(NextResponse.json({ error: 'Error al guardar output' }, { status: 500 }));
  }
}));
