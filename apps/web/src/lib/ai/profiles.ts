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

const optionalInt = (min: number, max: number) =>
  z.preprocess(
    (value) => (value === undefined || value === null || value === '' ? undefined : Number(value)),
    z.number().int().min(min).max(max)
  ).optional();

const EvergreenIdeasInputSchema = z.object({
  channelId: z.string().uuid(),
  topicSeed: z.string().max(200).optional(),
  channelStage: z.string().min(2).max(80),
  targetAudience: z.string().min(2).max(160),
  primaryGoal: z.string().min(2).max(160),
  resources: z.string().max(500).optional(),
  constraints: z.string().max(500).optional(),
  styleGuide: z.string().max(200).optional(),
});

const EvergreenIdeasOutputSchema = z.object({
  nicheRanking: z.array(
    z.object({
      niche: z.string().min(1).max(120),
      score: z.number().min(1).max(100),
      reasons: z.array(z.string().min(1).max(160)).min(2).max(6),
      risk: z.string().min(1).max(120),
      monetizationPotential: z.string().min(1).max(120),
    })
  ).min(3).max(7),
  channelClusters: z.array(
    z.object({
      name: z.string().min(1).max(120),
      rationale: z.string().min(1).max(200),
      topics: z.array(z.string().min(1).max(120)).min(3).max(8),
    })
  ).min(3).max(6),
  roadmap: z.array(
    z.object({
      phase: z.string().min(1).max(80),
      focus: z.string().min(1).max(200),
      goals: z.array(z.string().min(1).max(160)).min(2).max(6),
    })
  ).min(3).max(5),
  automationPlan: z.object({
    tools: z.array(z.string().min(1).max(120)).min(2).max(6),
    workflow: z.array(z.string().min(1).max(200)).min(3).max(8),
    risks: z.array(z.string().min(1).max(160)).min(1).max(5),
  }),
  complianceChecks: z.array(z.string().min(1).max(160)).min(2).max(6),
  contentIdeas: z.array(
    z.object({
      title: z.string().min(1).max(200),
      angle: z.string().min(1).max(200),
      hook: z.string().min(1).max(200),
      targetLengthSec: z.number().int().min(30).max(3600).optional(),
    })
  ).min(8).max(12),
  actionPlan: z.array(
    z.object({
      step: z.string().min(1).max(200),
      outcome: z.string().min(1).max(200),
    })
  ).min(4).max(8),
});

const ScriptArchitectInputSchema = z.object({
  channelId: z.string().uuid(),
  ideaId: z.string().uuid(),
  ideaTitle: z.string().min(1).max(200),
  ideaDescription: z.string().max(2000).optional(),
  targetLengthSec: optionalInt(60, 3600),
  tone: z.string().max(120).optional(),
  depthLevel: z.string().max(80).optional(),
  styleGuide: z.string().max(200).optional(),
});

const ScriptArchitectOutputSchema = z.object({
  hook: z.string().min(1),
  promise: z.string().min(1),
  development: z.array(z.string().min(1)).min(3),
  turningPoint: z.string().min(1),
  closing: z.string().min(1),
  pacingNotes: z.array(z.string().min(1)).min(2).max(8).optional(),
  actionPlan: z.array(
    z.object({
      step: z.string().min(1).max(200),
      outcome: z.string().min(1).max(200),
    })
  ).min(3).max(6),
});

const RetentionEditorInputSchema = z.object({
  channelId: z.string().uuid(),
  scriptId: z.string().uuid(),
  originalScript: z.string().min(50).max(50000),
  targetLengthSec: optionalInt(60, 3600),
  tone: z.string().max(120).optional(),
});

const RetentionEditorOutputSchema = z.object({
  scriptV2: z.string().min(1),
  changes: z.array(z.string().min(1)).min(3),
  reductionPercent: z.number().min(0).max(40),
  retentionBoosts: z.array(z.string().min(1)).min(2).max(8),
  actionPlan: z.array(
    z.object({
      step: z.string().min(1).max(200),
      outcome: z.string().min(1).max(200),
    })
  ).min(3).max(6),
});

const TitlesThumbsInputSchema = z.object({
  channelId: z.string().uuid(),
  ideaId: z.string().uuid(),
  ideaTitle: z.string().min(1).max(200),
  ideaDescription: z.string().max(2000).optional(),
  scriptId: z.string().uuid().optional(),
  scriptContent: z.string().max(50000).optional(),
  scriptSummary: z.string().max(1000).optional(),
  primaryEmotion: z.string().min(1).max(80),
});

const TitlesThumbsOutputSchema = z.object({
  titles: z.array(
    z.object({
      title: z.string().min(1).max(120),
      emotion: z.string().min(1).max(80),
      curiosityType: z.string().min(1).max(80),
    })
  ).min(5).max(10),
  thumbnails: z.array(
    z.object({
      text: z.string().min(1).max(60),
      angle: z.string().min(1).max(120),
    })
  ).min(4).max(6),
  topCombos: z.array(
    z.object({
      title: z.string().min(1).max(120),
      thumbnailText: z.string().min(1).max(60),
      rationale: z.string().min(1).max(160),
    })
  ).min(2).max(3),
  description: z.string().min(1).max(1500),
  tags: z.array(z.string().min(1).max(40)).min(3).max(12),
  actionPlan: z.array(
    z.object({
      step: z.string().min(1).max(200),
      outcome: z.string().min(1).max(200),
    })
  ).min(3).max(6),
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
    version: 2,
    name: 'YouTube Evergreen AI',
    description: 'Define nichos, clusters y plan evergreen con ideas iniciales accionables.',
    inputSchema: EvergreenIdeasInputSchema,
    outputSchema: EvergreenIdeasOutputSchema,
    buildPrompt: (input, channel) => {
      const data = EvergreenIdeasInputSchema.parse(input);
      const schemaHint = JSON.stringify({
        nicheRanking: [
          {
            niche: '...',
            score: 86,
            reasons: ['...', '...'],
            risk: '...',
            monetizationPotential: '...'
          }
        ],
        channelClusters: [
          { name: '...', rationale: '...', topics: ['...', '...'] }
        ],
        roadmap: [
          { phase: '...', focus: '...', goals: ['...', '...'] }
        ],
        automationPlan: {
          tools: ['...', '...'],
          workflow: ['...', '...'],
          risks: ['...']
        },
        complianceChecks: ['...'],
        contentIdeas: [
          { title: '...', angle: '...', hook: '...', targetLengthSec: 420 }
        ],
        actionPlan: [
          { step: '...', outcome: '...' }
        ]
      }, null, 2);

      return {
        system: [
          'Eres un estratega senior en canales evergreen para YouTube.',
          'Priorizas viabilidad a largo plazo, retencion, SEO y monetizacion realista.',
          'No valides ideas sin analisis; evita promesas absolutas o clickbait engañoso.',
          'Entrega un plan por fases, clusters y un ranking de nichos con puntaje.',
          buildJsonInstruction(schemaHint),
        ].join('\n'),
        user: [
          buildPromptHeader(channel),
          data.topicSeed ? `Tema base: ${data.topicSeed}` : 'Tema base: libre (proponer nichos)',
          `Etapa del canal: ${data.channelStage}`,
          `Publico objetivo: ${data.targetAudience}`,
          `Objetivo principal: ${data.primaryGoal}`,
          data.resources ? `Recursos: ${data.resources}` : null,
          data.constraints ? `Limitaciones: ${data.constraints}` : null,
          data.styleGuide ? `Estilo: ${data.styleGuide}` : null,
          'Si no hay nicho, entrega ranking de nichos con score, riesgos y monetizacion.',
          'Incluye ideas iniciales accionables y plan de accion.',
        ].filter(Boolean).join('\n'),
      };
    },
    apply: async (output, context) => {
      const data = EvergreenIdeasOutputSchema.parse(output);
      EvergreenIdeasInputSchema.parse(context.input);
      return withTransaction(async (client) => {
        const createdIds: string[] = [];
        for (const idea of data.contentIdeas) {
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
    version: 2,
    name: 'Evergreen Script Architect',
    description: 'Crea guiones evergreen con enfoque en retencion y ritmo narrativo.',
    inputSchema: ScriptArchitectInputSchema,
    outputSchema: ScriptArchitectOutputSchema,
    buildPrompt: (input, channel) => {
      const data = ScriptArchitectInputSchema.parse(input);
      const schemaHint = JSON.stringify({
        hook: '...',
        promise: '...',
        development: ['...', '...'],
        turningPoint: '...',
        closing: '...',
        pacingNotes: ['...'],
        actionPlan: [{ step: '...', outcome: '...' }],
      }, null, 2);

      return {
        system: [
          'Eres un guionista evergreen enfocado en retencion, watch time y claridad.',
          'No empieces con saludos ni contexto innecesario.',
          'Cada 20-30 segundos introduce un cambio narrativo o gancho intermedio.',
          'No incluyas llamadas a la accion ni cierres comerciales.',
          buildJsonInstruction(schemaHint),
        ].join('\n'),
        user: [
          buildPromptHeader(channel),
          `Idea: ${data.ideaTitle}`,
          data.ideaDescription ? `Contexto: ${data.ideaDescription}` : null,
          data.targetLengthSec ? `Duracion objetivo: ${data.targetLengthSec}s` : null,
          data.tone ? `Tono: ${data.tone}` : null,
          data.depthLevel ? `Profundidad: ${data.depthLevel}` : null,
          data.styleGuide ? `Guia de estilo: ${data.styleGuide}` : null,
          'Guion apto para voz en off sin rostro.',
        ].filter(Boolean).join('\n'),
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

        const developmentBody = data.development.join('\n\n');
        const fullContent = [
          data.hook,
          data.promise,
          developmentBody,
          data.turningPoint,
          data.closing,
        ].filter(Boolean).join('\n\n').trim();
        const metrics = calculateMetrics(fullContent);

        const scriptResult = await client.query(
          `INSERT INTO scripts (user_id, idea_id, title, intro, body, full_content, word_count, estimated_duration_seconds)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           RETURNING id`,
          [context.userId, input.ideaId, idea.title, data.hook, developmentBody, fullContent, metrics.wordCount, metrics.estimatedDuration]
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
    version: 2,
    name: 'YouTube Retention Editor',
    description: 'Optimiza un guion existente para maximizar retencion y watch time.',
    inputSchema: RetentionEditorInputSchema,
    outputSchema: RetentionEditorOutputSchema,
    buildPrompt: (input, channel) => {
      const data = RetentionEditorInputSchema.parse(input);
      const schemaHint = JSON.stringify({
        scriptV2: '...',
        changes: ['...'],
        reductionPercent: 15,
        retentionBoosts: ['...'],
        actionPlan: [{ step: '...', outcome: '...' }],
      }, null, 2);

      return {
        system: [
          'Eres un editor senior de retencion para YouTube.',
          'No reescribes desde cero ni agregas informacion nueva.',
          'Reduce entre 10% y 20% cuando sea posible.',
          'Mantienes el tono original y mejoras ritmo, claridad y retencion.',
          buildJsonInstruction(schemaHint),
        ].join('\n'),
        user: [
          buildPromptHeader(channel),
          data.targetLengthSec ? `Duracion objetivo: ${data.targetLengthSec}s` : null,
          data.tone ? `Tono: ${data.tone}` : null,
          'Guion original:',
          data.originalScript,
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
        const fullContent = [intro, data.scriptV2, cta, outro].filter(Boolean).join('\n\n');
        const metrics = calculateMetrics(fullContent);

        await client.query(
          `UPDATE scripts
           SET body = $1, full_content = $2, word_count = $3, estimated_duration_seconds = $4
           WHERE id = $5 AND user_id = $6`,
           [data.scriptV2, fullContent, metrics.wordCount, metrics.estimatedDuration, input.scriptId, context.userId]
        );

        return { applied: { scriptId: input.scriptId, changes: data.changes } };
      });
    },
  },
  {
    key: 'titles_thumbs',
    version: 2,
    name: 'Titles & Thumbnails Strategist',
    description: 'Optimiza titulos y miniaturas para CTR con enfoque emocional.',
    inputSchema: TitlesThumbsInputSchema,
    outputSchema: TitlesThumbsOutputSchema,
    buildPrompt: (input, channel) => {
      const data = TitlesThumbsInputSchema.parse(input);
      const schemaHint = JSON.stringify({
        titles: [
          { title: '...', emotion: '...', curiosityType: '...' }
        ],
        thumbnails: [
          { text: '...', angle: '...' }
        ],
        topCombos: [
          { title: '...', thumbnailText: '...', rationale: '...' }
        ],
        description: '...',
        tags: ['tag1', 'tag2'],
        actionPlan: [{ step: '...', outcome: '...' }],
      }, null, 2);

      return {
        system: [
          'Eres un estratega de CTR para YouTube.',
          'No uses clickbait engañoso ni promesas absolutas.',
          'Evita formulas genericas y alinea titulo con miniatura.',
          buildJsonInstruction(schemaHint),
        ].join('\n'),
        user: [
          buildPromptHeader(channel),
          `Idea: ${data.ideaTitle}`,
          data.ideaDescription ? `Contexto: ${data.ideaDescription}` : null,
          data.scriptContent ? `Guion: ${data.scriptContent}` : null,
          data.scriptSummary ? `Resumen: ${data.scriptSummary}` : null,
          `Emocion principal: ${data.primaryEmotion}`,
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
             [data.titles[0].title, data.description, data.tags, data.tags, JSON.stringify({ titles: data.titles, thumbnails: data.thumbnails, topCombos: data.topCombos }), seoId, context.userId]
           );
         } else {
           const insertResult = await client.query(
             `INSERT INTO seo_data (user_id, video_id, optimized_title, description, tags, keywords, suggestions)
              VALUES ($1, $2, $3, $4, $5, $6, $7)
              RETURNING id`,
             [context.userId, null, data.titles[0].title, data.description, data.tags, data.tags, JSON.stringify({ titles: data.titles, thumbnails: data.thumbnails, topCombos: data.topCombos })]
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
             [context.userId, context.channelId, data.titles[0].title, input.ideaId, input.scriptId ?? null, seoId]
           );
         }

        return { applied: { seoId, titles: data.titles, thumbnails: data.thumbnails } };
      });
    },
  },
];

export function getAiProfile(key: string) {
  return AI_PROFILES.find((profile) => profile.key === key) || null;
}
