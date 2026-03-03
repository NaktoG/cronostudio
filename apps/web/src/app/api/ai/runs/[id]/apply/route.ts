import { NextRequest, NextResponse } from 'next/server';
import { withSecurityHeaders, getAuthUser } from '@/middleware/auth';
import { rateLimit, API_RATE_LIMIT } from '@/middleware/rateLimit';
import { requireRoles } from '@/middleware/rbac';
import { query } from '@/lib/db';
import { logger } from '@/lib/logger';
import { getAiProfile } from '@/lib/ai/profiles';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ id: string }>;
}

function parseJson(value: unknown): unknown {
  if (typeof value === 'string') {
    return JSON.parse(value);
  }
  return value;
}

export const POST = requireRoles(['owner'])(rateLimit(API_RATE_LIMIT)(async (request: NextRequest, { params }: RouteParams) => {
  try {
    const userId = getAuthUser(request)?.userId;
    if (!userId) {
      return withSecurityHeaders(NextResponse.json({ error: 'No autorizado' }, { status: 401 }));
    }

    const { id } = await params;
    const runResult = await query(
      'SELECT id, channel_id, profile_key, profile_version, status, input_json, output_json FROM ai_runs WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    if (runResult.rows.length === 0) {
      return withSecurityHeaders(NextResponse.json({ error: 'Run no encontrado' }, { status: 404 }));
    }
    const run = runResult.rows[0];
    if (run.status !== 'completed') {
      return withSecurityHeaders(NextResponse.json({ error: 'run_not_completed' }, { status: 409 }));
    }
    if (!run.output_json) {
      return withSecurityHeaders(NextResponse.json({ error: 'run_missing_output' }, { status: 409 }));
    }
    if (!run.channel_id) {
      return withSecurityHeaders(NextResponse.json({ error: 'run_missing_channel' }, { status: 400 }));
    }

    const profile = getAiProfile(run.profile_key as string);
    if (!profile) {
      return withSecurityHeaders(NextResponse.json({ error: 'invalid_profile' }, { status: 400 }));
    }
    if (profile.version !== Number(run.profile_version)) {
      return withSecurityHeaders(NextResponse.json({ error: 'profile_version_mismatch' }, { status: 409 }));
    }

    let outputPayload: unknown;
    let inputPayload: unknown;
    try {
      outputPayload = parseJson(run.output_json);
      inputPayload = parseJson(run.input_json);
    } catch {
      return withSecurityHeaders(NextResponse.json({ error: 'invalid_json' }, { status: 500 }));
    }

    const result = await profile.apply(outputPayload, {
      userId,
      channelId: run.channel_id as string,
      input: inputPayload,
    });

    await query('UPDATE ai_runs SET updated_at = NOW() WHERE id = $1 AND user_id = $2', [id, userId]);

    return withSecurityHeaders(NextResponse.json({ ok: true, runId: id, applied: result.applied }));
  } catch (error) {
    logger.error('ai_runs.apply.error', { error: String(error) });
    return withSecurityHeaders(NextResponse.json({ error: 'Error al aplicar resultados' }, { status: 500 }));
  }
}));
