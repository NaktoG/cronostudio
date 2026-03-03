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

const ExecuteRunSchema = z.object({
  profileKey: z.string().min(1),
  channelId: z.string().uuid(),
  input: z.record(z.unknown()).optional().default({}),
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function safeStringifyError(err: unknown) {
  return JSON.stringify({
    message: err instanceof Error ? err.message : String(err),
  });
}

export const POST = requireRoles(['owner'])(
  rateLimit(API_RATE_LIMIT)(async (request: NextRequest) => {
    let runId: string | null = null;

    try {
      const userId = getAuthUser(request)?.userId;
      if (!userId) {
        return withSecurityHeaders(NextResponse.json({ error: 'No autorizado' }, { status: 401 }));
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

      const inputPayload = { ...data.input, channelId: data.channelId } as Record<string, unknown>;
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
      const startedAt = Date.now();

      const messages = [
        { role: 'system' as const, content: prompt.system },
        { role: 'user' as const, content: prompt.user },
      ];

      // 2) Pedir salida estructurada a OpenAI (ideal)
      let outputParsed: unknown;
      let tokenUsage: unknown = null;

      try {
        const completion = await openai.chat.completions.parse({
          model,
          messages,
          temperature: 0.4,
          response_format: zodResponseFormat(profile.outputSchema as any, `${profile.key}_v${profile.version}`),
        });

        // @ts-expect-error openai SDK attaches .parsed when using .parse()
        outputParsed = completion.choices?.[0]?.message?.parsed;
        tokenUsage = completion.usage ?? null;
      } catch (err) {
        // Fallback: JSON mode + validación local
        logger.warn('ai_runs.execute.openai.parse_fallback', { runId, error: String(err) });

        const completion = await openai.chat.completions.create({
          model,
          messages,
          temperature: 0.4,
          response_format: { type: 'json_object' },
        });

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
            { error: 'invalid_output', runId, details: outputResult.error.errors, prompt },
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

      logger.error('ai_runs.execute.error', { error: String(error), runId });
      return withSecurityHeaders(
        NextResponse.json({ error: 'Error al ejecutar run', runId }, { status: 500 })
      );
    }
  })
);
