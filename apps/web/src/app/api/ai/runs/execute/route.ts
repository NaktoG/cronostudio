import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import OpenAI from 'openai';
import { zodResponseFormat } from 'openai/helpers/zod';

import { withSecurityHeaders, getAuthUser } from '@/middleware/auth';
import { rateLimit, API_RATE_LIMIT } from '@/middleware/rateLimit';
import { requireRoles } from '@/middleware/rbac';
import { query } from '@/lib/db';
import { logger } from '@/lib/logger';
import { getAiProfile } from '@/lib/ai/profiles';

export const dynamic = 'force-dynamic';

const MAX_BODY_BYTES = 100_000;

const ExecuteRunSchema = z.object({
  profileKey: z.string().min(1),
  channelId: z.string().uuid(),
  input: z.record(z.unknown()).optional().default({}),
});

const OPENAI_TIMEOUT_MS = Number(process.env.OPENAI_TIMEOUT_MS ?? 45000);
const OPENAI_MAX_RETRIES = Number(process.env.OPENAI_MAX_RETRIES ?? 2);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: Number.isFinite(OPENAI_TIMEOUT_MS) && OPENAI_TIMEOUT_MS > 0 ? OPENAI_TIMEOUT_MS : 45000,
});

function safeStringifyError(err: unknown) {
  return JSON.stringify({
    message: err instanceof Error ? err.message : String(err),
  });
}

function isRetryableOpenAiError(err: unknown) {
  if (err && typeof err === 'object') {
    const status = (err as { status?: number }).status;
    return status === 429 || (status && status >= 500);
  }
  return false;
}

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

async function withRetries<T>(fn: () => Promise<T>): Promise<T> {
  let attempt = 0;
  // Total attempts = 1 + OPENAI_MAX_RETRIES
  while (true) {
    try {
      return await fn();
    } catch (err) {
      if (attempt >= OPENAI_MAX_RETRIES || !isRetryableOpenAiError(err)) {
        throw err;
      }
      attempt += 1;
      await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
    }
  }
}

export const POST = requireRoles(['owner'])(
  rateLimit(API_RATE_LIMIT)(async (request: NextRequest) => {
    let runId: string | null = null;

    try {
      const userId = (await getAuthUser(request))?.userId;
      if (!userId) {
        return withSecurityHeaders(NextResponse.json({ error: 'No autorizado' }, { status: 401 }));
      }

      const contentLength = request.headers.get('content-length');
      if (contentLength && Number(contentLength) > MAX_BODY_BYTES) {
        return withSecurityHeaders(NextResponse.json({ error: 'payload_too_large' }, { status: 413 }));
      }

      if (!process.env.OPENAI_API_KEY) {
        return withSecurityHeaders(
          NextResponse.json({ error: 'openai_not_configured' }, { status: 500 })
        );
      }

      const body = await request.json();
      const data = ExecuteRunSchema.parse(body);

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
        return withSecurityHeaders(
          NextResponse.json({ error: 'invalid_input', details: inputResult.error.errors }, { status: 400 })
        );
      }

      const channel = {
        id: channelResult.rows[0].id as string,
        name: channelResult.rows[0].name as string,
        youtubeChannelId: channelResult.rows[0].youtube_channel_id as string,
        subscribers: channelResult.rows[0].subscribers as number | null,
      };

      const prompt = profile.buildPrompt(inputResult.data, channel);

      // 1) Crear run (igual que manual-first)
      const insert = await query(
        `INSERT INTO ai_runs (user_id, channel_id, profile_key, profile_version, status, input_json)
         VALUES ($1, $2, $3, $4, 'awaiting_input', $5)
         RETURNING id`,
        [userId, data.channelId, profile.key, profile.version, JSON.stringify(inputResult.data)]
      );

      runId = insert.rows[0].id as string;

      const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
      const maxTokensRaw = Number(process.env.OPENAI_MAX_OUTPUT_TOKENS ?? 1200);
      const maxTokens = Number.isFinite(maxTokensRaw) && maxTokensRaw > 0 ? Math.floor(maxTokensRaw) : 1200;
      const startedAt = Date.now();

      const messages = [
        { role: 'system' as const, content: prompt.system },
        { role: 'user' as const, content: prompt.user },
      ];

      // 2) Pedir salida estructurada a OpenAI (ideal)
      let outputParsed: unknown;
      let tokenUsage: unknown = null;

      try {
        const outputSchema = profile.outputSchema as z.ZodTypeAny;
        const completion = await withRetries(() => openai.chat.completions.parse({
          model,
          messages,
          temperature: 0.4,
          max_tokens: maxTokens,
          response_format: zodResponseFormat(outputSchema, `${profile.key}_v${profile.version}`),
        }));

        outputParsed = completion.choices?.[0]?.message?.parsed;
        tokenUsage = completion.usage ?? null;
      } catch (err) {
        // Fallback: JSON mode + validación local
        logger.warn('ai_runs.execute.openai.parse_fallback', { runId, error: String(err) });

        const completion = await withRetries(() => openai.chat.completions.create({
          model,
          messages,
          temperature: 0.4,
          max_tokens: maxTokens,
          response_format: { type: 'json_object' },
        }));

        const text = completion.choices?.[0]?.message?.content ?? '';
        if (!text) throw new Error('empty_openai_output');

        let json: unknown;
        try {
          json = JSON.parse(text);
        } catch {
          throw new Error('invalid_json_from_model');
        }

        outputParsed = json;
        tokenUsage = completion.usage ?? null;
      }

      // 3) Validar contra el schema del perfil (igual que submit)
      const outputResult = profile.outputSchema.safeParse(outputParsed);
      if (!outputResult.success) {
        await query(
          `UPDATE ai_runs
           SET error = $1, updated_at = NOW()
           WHERE id = $2 AND user_id = $3`,
          [JSON.stringify({ error: 'invalid_output', details: outputResult.error.errors }), runId, userId]
        );

        return withSecurityHeaders(
          NextResponse.json(
            { error: 'invalid_output', runId, details: outputResult.error.errors },
            { status: 400 }
          )
        );
      }

      // 4) Guardar output + completar run
      await query(
        `UPDATE ai_runs
         SET output_json = $1,
             status = 'completed',
             error = NULL,
             provider = $2,
             model = $3,
             latency_ms = $4,
             token_usage = $5,
             updated_at = NOW()
         WHERE id = $6 AND user_id = $7`,
        [
          JSON.stringify(outputResult.data),
          'openai',
          model,
          Date.now() - startedAt,
          tokenUsage ? JSON.stringify(tokenUsage) : null,
          runId,
          userId,
        ]
      );

      // 5) Aplicar (igual que apply)
      const applied = await profile.apply(outputResult.data, {
        userId,
        channelId: data.channelId,
        input: inputResult.data,
      });

      await query('UPDATE ai_runs SET updated_at = NOW() WHERE id = $1 AND user_id = $2', [runId, userId]);

      return withSecurityHeaders(
        NextResponse.json({ ok: true, runId, applied: applied.applied, output: outputResult.data })
      );
    } catch (error) {
      if (error instanceof z.ZodError) {
        return withSecurityHeaders(
          NextResponse.json({ error: 'Datos inválidos', details: error.errors }, { status: 400 })
        );
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

      // Si ya creamos runId, guardamos el error para debugging sin romper el repo
      if (runId) {
        try {
          await query(
            `UPDATE ai_runs
             SET error = $1, updated_at = NOW()
             WHERE id = $2`,
            [safeStringifyError(error), runId]
          );
        } catch (e) {
          logger.error('ai_runs.execute.error_persist_failed', { runId, error: String(e) });
        }
      }

      const status = (error as { status?: number }).status;
      if (status === 401 || status === 403) {
        logger.error('ai_runs.execute.openai_auth_error', { error: String(error), runId });
        return withSecurityHeaders(
          NextResponse.json({ error: 'openai_auth_error', runId }, { status: 502 })
        );
      }
      if (status === 429) {
        logger.warn('ai_runs.execute.rate_limited', { error: String(error), runId });
        return withSecurityHeaders(
          NextResponse.json({ error: 'openai_rate_limited', runId }, { status: 429 })
        );
      }
      logger.error('ai_runs.execute.error', { error: String(error), runId });
      return withSecurityHeaders(
        NextResponse.json({ error: 'Error al ejecutar run', runId }, { status: 500 })
      );
    }
  })
);
