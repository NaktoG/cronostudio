import { NextRequest, NextResponse } from 'next/server';
import { withSecurityHeaders, getAuthUser } from '@/middleware/auth';
import { logger } from '@/lib/logger';
import { PostgresProductionRepository } from '@/infrastructure/repositories/PostgresProductionRepository';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/productions/[id]
 * Obtain a production detail
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const userId = getAuthUser(request)?.userId ?? null;
    if (!userId) {
      return withSecurityHeaders(NextResponse.json({ error: 'No autorizado' }, { status: 401 }));
    }

    const { id } = await params;
    const productionRepository = new PostgresProductionRepository();
    const production = await productionRepository.findById(id);

    if (!production || production.userId !== userId) {
      return withSecurityHeaders(NextResponse.json({ error: 'Producción no encontrada' }, { status: 404 }));
    }

    return withSecurityHeaders(NextResponse.json(production));
  } catch (error) {
    logger.error('Error fetching production detail', { error: String(error) });
    return withSecurityHeaders(NextResponse.json({ error: 'Error al obtener producción' }, { status: 500 }));
  }
}
