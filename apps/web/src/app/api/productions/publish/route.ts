import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withSecurityHeaders, getAuthUser } from '@/middleware/auth';
import { rateLimit, API_RATE_LIMIT } from '@/middleware/rateLimit';
import { requireRoles } from '@/middleware/rbac';
import { PostgresProductionPublish } from '@/infrastructure/repositories/PostgresProductionPublish';
import { ProductionPublishService } from '@/application/services/ProductionPublishService';
import { PublishProductionUseCase } from '@/application/usecases/production/PublishProductionUseCase';

export const dynamic = 'force-dynamic';

const PublishSchema = z.object({
  productionId: z.string().uuid(),
  publishedUrl: z.string().url().optional().nullable(),
  platformId: z.string().optional().nullable(),
  platform: z.string().optional().default('youtube'),
});

export const POST = requireRoles(['owner'])(rateLimit(API_RATE_LIMIT)(async (request: NextRequest) => {
  const userId = (await getAuthUser(request))?.userId ?? null;
  if (!userId) {
    return withSecurityHeaders(NextResponse.json({ error: 'No autorizado' }, { status: 401 }));
  }

  const body = await request.json();
  const parsed = PublishSchema.safeParse(body);
  if (!parsed.success) {
    return withSecurityHeaders(NextResponse.json({ error: 'Datos inválidos' }, { status: 400 }));
  }
  const data = parsed.data;

  const repository = new PostgresProductionPublish();
  const service = new ProductionPublishService(repository);
  const useCase = new PublishProductionUseCase(service);

  try {
    const result = await useCase.execute({
      userId,
      productionId: data.productionId,
      publishedUrl: data.publishedUrl,
      platformId: data.platformId,
      platform: data.platform,
    });

    if (!result) {
      return withSecurityHeaders(NextResponse.json({ error: 'Producción no encontrada' }, { status: 404 }));
    }

    return withSecurityHeaders(NextResponse.json(result));
  } catch {
    return withSecurityHeaders(NextResponse.json({ error: 'Error al marcar como publicado' }, { status: 500 }));
  }
}));
