import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

type MockRouteHandler = (request: NextRequest, ...args: unknown[]) => Promise<Response> | Response;

vi.mock('@/lib/db', () => ({
  query: vi.fn(),
}));

vi.mock('@/middleware/auth', () => {
  const getAuthUser = vi.fn();
  return {
    getAuthUser,
    withSecurityHeaders: vi.fn((response: Response) => response),
    withAuth: (handler: MockRouteHandler) => async (request: NextRequest, ...args: unknown[]) => {
      const user = await getAuthUser(request);
      if (!user) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
      }
      return handler(request, ...args);
    },
  };
});

vi.mock('@/middleware/rateLimit', () => ({
  API_RATE_LIMIT: { windowMs: 900000, max: 100 },
  rateLimit: () => (handler: MockRouteHandler) => handler,
}));

vi.mock('@/middleware/rbac', () => ({
  requireRoles: () => (handler: MockRouteHandler) => handler,
}));

import { query } from '@/lib/db';
import { getAuthUser, type JWTPayload } from '@/middleware/auth';

describe('AI Runs API', () => {
  const ownerUser = { userId: 'user-1', email: 'demo@example.com', role: 'owner' } as JWTPayload;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates run and returns prompt', async () => {
    vi.mocked(getAuthUser).mockReturnValue(ownerUser);
    vi.mocked(query)
      .mockResolvedValueOnce({
        rows: [{ id: '11111111-1111-1111-1111-111111111111', name: 'Canal Demo', youtube_channel_id: 'UCdemo', subscribers: 1000 }],
        rowCount: 1,
      })
      .mockResolvedValueOnce({ rows: [{ id: 'run-1', status: 'awaiting_input' }], rowCount: 1 });

    const { POST } = await import('@/app/api/ai/runs/route');
    const request = new NextRequest('http://localhost:3000/api/ai/runs', {
      method: 'POST',
      body: JSON.stringify({
        profileKey: 'evergreen_ideas',
        channelId: '11111111-1111-1111-1111-111111111111',
        input: {
          topicSeed: 'IA',
          channelStage: 'nuevo',
          targetAudience: 'creadores en LATAM',
          primaryGoal: 'monetizar con afiliados',
        },
      }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.status).toBe('awaiting_input');
    expect(data.prompt).toBeTruthy();
  });

  it('rejects invalid output on submit', async () => {
    vi.mocked(getAuthUser).mockReturnValue(ownerUser);
    vi.mocked(query).mockResolvedValueOnce({
      rows: [{ id: 'run-1', profile_key: 'evergreen_ideas', profile_version: 2, status: 'awaiting_input' }],
      rowCount: 1,
    });

    const { POST } = await import('@/app/api/ai/runs/[id]/submit/route');
    const request = new NextRequest('http://localhost:3000/api/ai/runs/run-1/submit', {
      method: 'POST',
      body: JSON.stringify({ outputJson: { ideas: [] } }),
    });

    const response = await POST(request, { params: Promise.resolve({ id: 'run-1' }) });

    expect(response.status).toBe(400);
  });

  it('accepts valid output on submit', async () => {
    vi.mocked(getAuthUser).mockReturnValue(ownerUser);
    vi.mocked(query)
      .mockResolvedValueOnce({
      rows: [{ id: 'run-1', profile_key: 'evergreen_ideas', profile_version: 2, status: 'awaiting_input' }],
        rowCount: 1,
      })
      .mockResolvedValueOnce({ rows: [], rowCount: 1 });

    const { POST } = await import('@/app/api/ai/runs/[id]/submit/route');
    const outputJson = {
      nicheRanking: [
        {
          niche: 'Productividad',
          score: 82,
          reasons: ['Demanda estable', 'Buen CPM'],
          risk: 'Competencia media',
          monetizationPotential: 'Afiliados y cursos',
        },
        {
          niche: 'IA aplicada',
          score: 78,
          reasons: ['Interes creciente', 'Empresas invierten'],
          risk: 'Cambia rapido',
          monetizationPotential: 'SaaS y consultoria',
        },
        {
          niche: 'Finanzas personales',
          score: 76,
          reasons: ['Evergreen', 'Alto valor percibido'],
          risk: 'Regulaciones',
          monetizationPotential: 'Afiliados y ebooks',
        },
      ],
      channelClusters: [
        {
          name: 'Bases',
          rationale: 'Construye confianza y contexto',
          topics: ['Conceptos clave', 'Errores comunes', 'Primeros pasos'],
        },
        {
          name: 'Aplicacion',
          rationale: 'Demuestra casos reales y accionables',
          topics: ['Casos reales', 'Herramientas', 'Checklist'],
        },
        {
          name: 'Escala',
          rationale: 'Escala con procesos y sistemas',
          topics: ['Automatizacion', 'Delegacion', 'Metrica'],
        },
      ],
      roadmap: [
        {
          phase: '0-30 dias',
          focus: 'Validacion y base',
          goals: ['Publicar 6 videos', 'Medir CTR', 'Definir estilo'],
        },
        {
          phase: '30-60 dias',
          focus: 'Optimizar retencion',
          goals: ['Mejorar hooks', 'Duplicar formatos top', 'Iterar thumbnails'],
        },
        {
          phase: '60-90 dias',
          focus: 'Monetizacion inicial',
          goals: ['Afiliados', 'Lead magnet', 'Primer partnership'],
        },
      ],
      automationPlan: {
        tools: ['Notion', 'ElevenLabs'],
        workflow: ['Brief', 'Guion', 'Voz', 'Edicion', 'Publicacion'],
        risks: ['Dependencia de un proveedor'],
      },
      complianceChecks: ['Sin promesas absolutas', 'Respetar copyright'],
      contentIdeas: Array.from({ length: 8 }).map((_, index) => ({
        title: `Idea ${index + 1}`,
        angle: 'Angle',
        hook: 'Hook',
        targetLengthSec: 300,
      })),
      actionPlan: [
        { step: 'Definir nicho final', outcome: 'Decision tomada' },
        { step: 'Preparar 3 briefs', outcome: 'Pipeline listo' },
        { step: 'Producir 2 videos', outcome: 'Primeros datos' },
        { step: 'Revisar performance', outcome: 'Iteracion base' },
      ],
    };
    const request = new NextRequest('http://localhost:3000/api/ai/runs/run-1/submit', {
      method: 'POST',
      body: JSON.stringify({ outputJson }),
    });

    const response = await POST(request, { params: Promise.resolve({ id: 'run-1' }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.ok).toBe(true);
  });
});
