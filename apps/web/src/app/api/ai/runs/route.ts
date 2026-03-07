import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withSecurityHeaders, getAuthUser } from '@/middleware/auth';
import { rateLimit, API_RATE_LIMIT } from '@/middleware/rateLimit';
import { requireRoles } from '@/middleware/rbac';
import { query } from '@/lib/db';
import { logger } from '@/lib/logger';
import { getAiProfile } from '@/lib/ai/profiles';
import { getInt, getString } from '@/lib/http/query';

export const dynamic = 'force-dynamic';

const MAX_BODY_BYTES = 50_000;

const CreateRunSchema = z.object({
  profileKey: z.string().min(1),
  channelId: z.string().uuid(),
  input: z.record(z.unknown()).optional().default({}),
});

async function enrichInputPayload(
  profileKey: string,
  input: Record<string, unknown>,
  userId: string,
  channelId: string
) {
  const payload = { ...input, channelId } as Record<string, unknown>;

  if (profileKey === 'script_architect' || profileKey === 'titles_thumbs') {
    const ideaId = payload.ideaId as string | undefined;
    if (ideaId) {
      const ideaResult = await query(
        'SELECT id, title, description, channel_id FROM ideas WHERE id = $1 AND user_id = $2',
        [ideaId, userId]
      );
      if (ideaResult.rows.length === 0) {
        throw new Error('Idea no encontrada');
      }
      const idea = ideaResult.rows[0] as { title: string; description: string | null; channel_id: string | null };
      if (idea.channel_id && idea.channel_id !== channelId) {
        throw new Error('Idea channel mismatch');
      }
      payload.ideaTitle = idea.title;
      if (idea.description) payload.ideaDescription = idea.description;
    }
  }

  if (profileKey === 'retention_editor' || (profileKey === 'titles_thumbs' && payload.scriptId)) {
    const scriptId = payload.scriptId as string | undefined;
    if (scriptId) {
      const scriptResult = await query(
        `SELECT s.full_content, i.channel_id
         FROM scripts s
         LEFT JOIN ideas i ON s.idea_id = i.id
         WHERE s.id = $1 AND s.user_id = $2`,
        [scriptId, userId]
      );
      if (scriptResult.rows.length === 0) {
        throw new Error('Script no encontrado');
      }
      const script = scriptResult.rows[0] as { full_content: string | null; channel_id: string | null };
      if (script.channel_id && script.channel_id !== channelId) {
        throw new Error('Script channel mismatch');
      }
      if (profileKey === 'retention_editor') {
        if (!script.full_content || script.full_content.length < 50) {
          throw new Error('Script vacio');
        }
        payload.originalScript = script.full_content ?? '';
      } else {
        payload.scriptContent = script.full_content ?? '';
      }
    }
  }

  return payload;
}

export const GET = rateLimit(API_RATE_LIMIT)(async (request: NextRequest) => {
  try {
    const userId = (await getAuthUser(request))?.userId;
    if (!userId) {
      return withSecurityHeaders(NextResponse.json({ error: 'No autorizado' }, { status: 401 }));
    }

    const contentLength = request.headers.get('content-length');
    if (contentLength && Number(contentLength) > MAX_BODY_BYTES) {
      return withSecurityHeaders(NextResponse.json({ error: 'payload_too_large' }, { status: 413 }));
    }

    const { searchParams } = new URL(request.url);
    const limit = getInt(searchParams, 'limit', { min: 1, max: 100, defaultValue: 20 });
    const offset = getInt(searchParams, 'offset', { min: 0, defaultValue: 0 });
    if (limit === null) {
      return withSecurityHeaders(NextResponse.json({ error: 'invalid_query', field: 'limit' }, { status: 400 }));
    }
    if (offset === null) {
      return withSecurityHeaders(NextResponse.json({ error: 'invalid_query', field: 'offset' }, { status: 400 }));
    }

    const channelId = getString(searchParams, 'channelId');
    if (channelId) {
      const channelCheck = z.string().uuid().safeParse(channelId);
      if (!channelCheck.success) {
        return withSecurityHeaders(NextResponse.json({ error: 'invalid_query', field: 'channelId' }, { status: 400 }));
      }
    }

    let queryText = `SELECT id, channel_id, profile_key, profile_version, status, input_json, output_json, error, created_at, updated_at
                     FROM ai_runs
                     WHERE user_id = $1`;
    const params: (string | number)[] = [userId];
    let paramIndex = 2;

    if (channelId) {
      queryText += ` AND channel_id = $${paramIndex++}`;
      params.push(channelId);
    }

    queryText += ` ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`;
    params.push(limit, offset);

    const result = await query(queryText, params);
    return withSecurityHeaders(NextResponse.json({ runs: result.rows }));
  } catch (error) {
    logger.error('ai_runs.list.error', { error: String(error) });
    return withSecurityHeaders(NextResponse.json({ error: 'Error al obtener historial' }, { status: 500 }));
  }
});

export const POST = requireRoles(['owner'])(rateLimit(API_RATE_LIMIT)(async (request: NextRequest) => {
  try {
    const userId = (await getAuthUser(request))?.userId;
    if (!userId) {
      return withSecurityHeaders(NextResponse.json({ error: 'No autorizado' }, { status: 401 }));
    }

    const body = await request.json();
    const data = CreateRunSchema.parse(body);
    const profile = getAiProfile(data.profileKey);
    if (!profile) {
      return withSecurityHeaders(NextResponse.json({ error: 'invalid_profile' }, { status: 400 }));
    }

    const channelResult = await query(
      'SELECT id, name, youtube_channel_id, subscribers FROM channels WHERE id = $1 AND user_id = $2',
      [data.channelId, userId]
    );
    if (channelResult.rows.length === 0) {
      return withSecurityHeaders(NextResponse.json({ error: 'Canal no encontrado' }, { status: 404 }));
    }

    const inputPayload = await enrichInputPayload(data.profileKey, data.input ?? {}, userId, data.channelId);
    const inputResult = profile.inputSchema.safeParse(inputPayload);
    if (!inputResult.success) {
      return withSecurityHeaders(NextResponse.json({
        error: 'invalid_input',
        details: inputResult.error.errors,
      }, { status: 400 }));
    }

    const prompt = profile.buildPrompt(inputResult.data, {
      id: channelResult.rows[0].id as string,
      name: channelResult.rows[0].name as string,
      youtubeChannelId: channelResult.rows[0].youtube_channel_id as string,
      subscribers: channelResult.rows[0].subscribers as number | null,
    });

    const insert = await query(
      `INSERT INTO ai_runs (user_id, channel_id, profile_key, profile_version, status, input_json)
       VALUES ($1, $2, $3, $4, 'awaiting_input', $5)
       RETURNING id, status`,
      [userId, data.channelId, profile.key, profile.version, JSON.stringify(inputResult.data)]
    );

    return withSecurityHeaders(NextResponse.json({
      runId: insert.rows[0].id,
      status: insert.rows[0].status,
      prompt,
    }, { status: 201 }));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return withSecurityHeaders(NextResponse.json({ error: 'Datos inválidos', details: error.errors }, { status: 400 }));
    }
    if (error instanceof Error) {
      if (error.message === 'Idea no encontrada' || error.message === 'Script no encontrado') {
        return withSecurityHeaders(NextResponse.json({ error: error.message }, { status: 404 }));
      }
      if (error.message === 'Script vacio') {
        return withSecurityHeaders(NextResponse.json({ error: error.message }, { status: 400 }));
      }
      if (error.message.endsWith('channel mismatch')) {
        return withSecurityHeaders(NextResponse.json({ error: 'Canal no coincide' }, { status: 400 }));
      }
    }
    logger.error('ai_runs.create.error', { error: String(error) });
    return withSecurityHeaders(NextResponse.json({ error: 'Error al crear ejecución' }, { status: 500 }));
  }
}));
