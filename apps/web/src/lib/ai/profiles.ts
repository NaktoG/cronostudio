import { z } from 'zod';
import { getClient } from '@/lib/db';

export type ChannelContext = {
  id: string;
  name: string;
  youtubeChannelId: string;
  subscribers: number | null;
};

export type PromptPayload = {
  system: string;
  user: string;
};

export type ApplyContext = {
  userId: string;
  channelId: string;
  input: unknown;
};

export type ApplyResult = {
  applied: Record<string, unknown>;
};

export type AiProfile<Input, Output> = {
  key: string;
  version: number;
  name: string;
  description: string;
  inputSchema: z.ZodType<Input>;
  outputSchema: z.ZodType<Output>;
  buildPrompt: (input: Input, channel: ChannelContext) => PromptPayload;
  apply: (output: Output, context: ApplyContext) => Promise<ApplyResult>;
};

const EvergreenIdeasInputSchema = z.object({
  channelId: z.string().uuid(),
  topicSeed: z.string().max(200).optional(),
});

const EvergreenIdeasOutputSchema = z.object({
  ideas: z.array(
    z.object({
      title: z.string().min(1).max(200),
      angle: z.string().min(1).max(200),
      hook: z.string().min(1).max(200),
      targetLengthSec: z.number().int().min(15).max(3600).optional(),
    })
  ).length(10),
});

const ScriptArchitectInputSchema = z.object({
  channelId: z.string().uuid(),
  ideaId: z.string().uuid(),
});

const ScriptArchitectOutputSchema = z.object({
  outline: z.array(z.string().min(1)).min(3),
  fullScript: z.string().min(1),
  hook: z.string().min(1),
  broll: z.array(z.string().min(1)).default([]),
});

const RetentionEditorInputSchema = z.object({
  channelId: z.string().uuid(),
  scriptId: z.string().uuid(),
});

const RetentionEditorOutputSchema = z.object({
  revisedScript: z.string().min(1),
  changes: z.array(z.string().min(1)).min(1),
});

const TitlesThumbsInputSchema = z.object({
  channelId: z.string().uuid(),
  ideaId: z.string().uuid(),
  scriptId: z.string().uuid().optional(),
});

const TitlesThumbsOutputSchema = z.object({
  titles: z.array(z.string().min(1).max(120)).length(10),
  thumbnailTexts: z.array(z.string().min(1).max(60)).length(5),
  description: z.string().min(1),
  tags: z.array(z.string().min(1)).min(3),
});

function buildPromptHeader(channel: ChannelContext): string {
  return [
    `Canal: ${channel.name}`,
    `YouTube ID: ${channel.youtubeChannelId}`,
    `Suscriptores: ${channel.subscribers ?? 'n/a'}`,
  ].join('\n');
}

function buildJsonInstruction(schemaHint: string): string {
  return [
    'Devuelve SOLO JSON valido (sin markdown, sin comentarios).',
    'Respeta exactamente este formato:',
    schemaHint,
  ].join('\n');
}

function calculateMetrics(content: string) {
  const wordCount = content.split(/\s+/).filter(Boolean).length;
  const estimatedDuration = Math.ceil((wordCount / 150) * 60);
  return { wordCount, estimatedDuration };
}

async function withTransaction<T>(
  fn: (client: { query: (text: string, params?: unknown[]) => Promise<{ rows: Record<string, unknown>[] }>; release: () => void }) => Promise<T>
) {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export const AI_PROFILES: AiProfile<unknown, unknown>[] = [
  {
    key: 'evergreen_ideas',
    version: 1,
    name: 'Evergreen Ideas',
    description: 'Genera 10 ideas evergreen con angulo, hook y largo sugerido.',
    inputSchema: EvergreenIdeasInputSchema,
    outputSchema: EvergreenIdeasOutputSchema,
    buildPrompt: (input, channel) => {
      const data = EvergreenIdeasInputSchema.parse(input);
      const schemaHint = JSON.stringify({
        ideas: [
          { title: '...', angle: '...', hook: '...', targetLengthSec: 300 },
        ],
      }, null, 2);

      return {
        system: [
          'Eres un estratega de contenido para YouTube.',
          'Genera ideas evergreen con potencial de busqueda sostenida.',
          buildJsonInstruction(schemaHint),
        ].join('\n'),
        user: [
          buildPromptHeader(channel),
          data.topicSeed ? `Tema base: ${data.topicSeed}` : 'Tema base: libre',
          'Entrega exactamente 10 ideas.',
        ].join('\n'),
      };
    },
    apply: async (output, context) => {
      const data = EvergreenIdeasOutputSchema.parse(output);
      EvergreenIdeasInputSchema.parse(context.input);
      return withTransaction(async (client) => {
        const createdIds: string[] = [];
        for (const idea of data.ideas) {
          const description = [
            `Angle: ${idea.angle}`,
            `Hook: ${idea.hook}`,
            idea.targetLengthSec ? `Target length: ${idea.targetLengthSec}s` : null,
          ].filter(Boolean).join('\n');
          const result = await client.query(
            `INSERT INTO ideas (user_id, channel_id, title, description, status, source)
             VALUES ($1, $2, $3, $4, 'draft', 'ai')
             RETURNING id`,
            [context.userId, context.channelId, idea.title, description]
          );
          createdIds.push(result.rows[0].id as string);
        }
        return { applied: { ideaIds: createdIds } };
      });
    },
  },
  {
    key: 'script_architect',
    version: 1,
    name: 'Script Architect',
    description: 'Crea un guion completo con outline, hook y sugerencias de b-roll.',
    inputSchema: ScriptArchitectInputSchema,
    outputSchema: ScriptArchitectOutputSchema,
    buildPrompt: (input, channel) => {
      const data = ScriptArchitectInputSchema.parse(input);
      const schemaHint = JSON.stringify({
        outline: ['Intro', 'Punto 1', 'Punto 2'],
        fullScript: '...',
        hook: '...',
        broll: ['...'],
      }, null, 2);

      return {
        system: [
          'Eres un guionista experto en YouTube con enfoque en claridad y retencion.',
          buildJsonInstruction(schemaHint),
        ].join('\n'),
        user: [
          buildPromptHeader(channel),
          `Idea ID: ${data.ideaId}`,
          'Entrega un guion completo listo para grabar.',
        ].join('\n'),
      };
    },
    apply: async (output, context) => {
      const data = ScriptArchitectOutputSchema.parse(output);
      const input = ScriptArchitectInputSchema.parse(context.input);
      return withTransaction(async (client) => {
        const ideaResult = await client.query(
          'SELECT id, title, channel_id FROM ideas WHERE id = $1 AND user_id = $2',
          [input.ideaId, context.userId]
        );
        if (ideaResult.rows.length === 0) {
          throw new Error('Idea not found');
        }
        const idea = ideaResult.rows[0];
        if (idea.channel_id && idea.channel_id !== context.channelId) {
          throw new Error('Idea channel mismatch');
        }

        const brollSection = data.broll.length > 0
          ? `\n\nB-ROLL IDEAS:\n- ${data.broll.join('\n- ')}`
          : '';
        const fullContent = `${data.hook}\n\n${data.fullScript}${brollSection}`.trim();
        const metrics = calculateMetrics(fullContent);

        const scriptResult = await client.query(
          `INSERT INTO scripts (user_id, idea_id, title, intro, body, full_content, word_count, estimated_duration_seconds)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           RETURNING id`,
          [context.userId, input.ideaId, idea.title, data.hook, data.fullScript, fullContent, metrics.wordCount, metrics.estimatedDuration]
        );

        const productionResult = await client.query(
          `SELECT id
           FROM productions
           WHERE idea_id = $1 AND user_id = $2
           ORDER BY created_at DESC
           LIMIT 1`,
          [input.ideaId, context.userId]
        );

        if (productionResult.rows.length > 0) {
          await client.query(
            `UPDATE productions
             SET script_id = $1, status = 'scripting', updated_at = NOW()
             WHERE id = $2 AND user_id = $3`,
            [scriptResult.rows[0].id, productionResult.rows[0].id, context.userId]
          );
        } else {
          await client.query(
            `INSERT INTO productions (user_id, channel_id, title, status, idea_id, script_id)
             VALUES ($1, $2, $3, 'scripting', $4, $5)`,
            [context.userId, context.channelId, idea.title, input.ideaId, scriptResult.rows[0].id]
          );
        }

        await client.query(
          `UPDATE ideas SET status = 'in_production' WHERE id = $1 AND user_id = $2`,
          [input.ideaId, context.userId]
        );

        return { applied: { scriptId: scriptResult.rows[0].id as string } };
      });
    },
  },
  {
    key: 'retention_editor',
    version: 1,
    name: 'Retention Editor',
    description: 'Optimiza un guion para mejorar retencion con cambios explicitos.',
    inputSchema: RetentionEditorInputSchema,
    outputSchema: RetentionEditorOutputSchema,
    buildPrompt: (input, channel) => {
      const data = RetentionEditorInputSchema.parse(input);
      const schemaHint = JSON.stringify({
        revisedScript: '...',
        changes: ['...'],
      }, null, 2);

      return {
        system: [
          'Eres un editor de retencion para YouTube.',
          'Mantienes el tono original pero mejoras ritmo, claridad y retencion.',
          buildJsonInstruction(schemaHint),
        ].join('\n'),
        user: [
          buildPromptHeader(channel),
          `Script ID: ${data.scriptId}`,
          'Devuelve el guion revisado completo y un listado de cambios.',
        ].join('\n'),
      };
    },
    apply: async (output, context) => {
      const data = RetentionEditorOutputSchema.parse(output);
      const input = RetentionEditorInputSchema.parse(context.input);
      return withTransaction(async (client) => {
        const scriptResult = await client.query(
          `SELECT s.id, s.intro, s.body, s.cta, s.outro, i.channel_id
           FROM scripts s
           LEFT JOIN ideas i ON s.idea_id = i.id
           WHERE s.id = $1 AND s.user_id = $2`,
          [input.scriptId, context.userId]
        );
        if (scriptResult.rows.length === 0) {
          throw new Error('Script not found');
        }
        const script = scriptResult.rows[0];
        if (script.channel_id && script.channel_id !== context.channelId) {
          throw new Error('Script channel mismatch');
        }

        const intro = script.intro as string | null;
        const cta = script.cta as string | null;
        const outro = script.outro as string | null;
        const fullContent = [intro, data.revisedScript, cta, outro].filter(Boolean).join('\n\n');
        const metrics = calculateMetrics(fullContent);

        await client.query(
          `UPDATE scripts
           SET body = $1, full_content = $2, word_count = $3, estimated_duration_seconds = $4
           WHERE id = $5 AND user_id = $6`,
          [data.revisedScript, fullContent, metrics.wordCount, metrics.estimatedDuration, input.scriptId, context.userId]
        );

        return { applied: { scriptId: input.scriptId, changes: data.changes } };
      });
    },
  },
  {
    key: 'titles_thumbs',
    version: 1,
    name: 'Titles + Thumbs',
    description: 'Genera titulos, textos de miniatura y SEO base.',
    inputSchema: TitlesThumbsInputSchema,
    outputSchema: TitlesThumbsOutputSchema,
    buildPrompt: (input, channel) => {
      const data = TitlesThumbsInputSchema.parse(input);
      const schemaHint = JSON.stringify({
        titles: ['...'],
        thumbnailTexts: ['...'],
        description: '...',
        tags: ['tag1', 'tag2'],
      }, null, 2);

      return {
        system: [
          'Eres un estratega de titulos y thumbnails para YouTube.',
          'Optimiza para CTR sin clickbait engañoso.',
          buildJsonInstruction(schemaHint),
        ].join('\n'),
        user: [
          buildPromptHeader(channel),
          `Idea ID: ${data.ideaId}`,
          data.scriptId ? `Script ID: ${data.scriptId}` : 'Script ID: n/a',
        ].join('\n'),
      };
    },
    apply: async (output, context) => {
      const data = TitlesThumbsOutputSchema.parse(output);
      const input = TitlesThumbsInputSchema.parse(context.input);
      return withTransaction(async (client) => {
        const ideaResult = await client.query(
          'SELECT id, channel_id FROM ideas WHERE id = $1 AND user_id = $2',
          [input.ideaId, context.userId]
        );
        if (ideaResult.rows.length === 0) {
          throw new Error('Idea not found');
        }
        const idea = ideaResult.rows[0];
        if (idea.channel_id && idea.channel_id !== context.channelId) {
          throw new Error('Idea channel mismatch');
        }

        const productionResult = await client.query(
          'SELECT id, seo_id FROM productions WHERE idea_id = $1 AND user_id = $2 ORDER BY created_at DESC LIMIT 1',
          [input.ideaId, context.userId]
        );
        const production = productionResult.rows[0] as { id: string; seo_id: string | null } | undefined;

        let seoId = production?.seo_id ?? null;
        if (seoId) {
          await client.query(
            `UPDATE seo_data
             SET optimized_title = $1, description = $2, tags = $3, keywords = $4, suggestions = $5
             WHERE id = $6 AND user_id = $7`,
            [data.titles[0], data.description, data.tags, data.tags, JSON.stringify({ titles: data.titles, thumbnailTexts: data.thumbnailTexts }), seoId, context.userId]
          );
        } else {
          const insertResult = await client.query(
            `INSERT INTO seo_data (user_id, video_id, optimized_title, description, tags, keywords, suggestions)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING id`,
            [context.userId, null, data.titles[0], data.description, data.tags, data.tags, JSON.stringify({ titles: data.titles, thumbnailTexts: data.thumbnailTexts })]
          );
          seoId = insertResult.rows[0].id as string;
        }

        if (production?.id) {
          await client.query(
            `UPDATE productions
             SET seo_id = $1, status = 'publishing', updated_at = NOW()
             WHERE id = $2 AND user_id = $3`,
            [seoId, production.id, context.userId]
          );
        } else {
          await client.query(
            `INSERT INTO productions (user_id, channel_id, title, status, idea_id, script_id, seo_id)
             VALUES ($1, $2, $3, 'publishing', $4, $5, $6)`,
            [context.userId, context.channelId, data.titles[0], input.ideaId, input.scriptId ?? null, seoId]
          );
        }

        return { applied: { seoId, titles: data.titles, thumbnailTexts: data.thumbnailTexts } };
      });
    },
  },
];

export function getAiProfile(key: string) {
  return AI_PROFILES.find((profile) => profile.key === key) || null;
}
