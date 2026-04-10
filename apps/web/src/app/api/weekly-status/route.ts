import { NextRequest, NextResponse } from 'next/server';
import { withSecurityHeaders, getAuthUser } from '@/middleware/auth';
import { rateLimit, API_RATE_LIMIT } from '@/middleware/rateLimit';
import { EvaluateWeeklyStatusUseCase } from '@/application/usecases/weekly-status/EvaluateWeeklyStatusUseCase';
import { BuildWeeklyTasksUseCase } from '@/application/usecases/weekly-status/BuildWeeklyTasksUseCase';
import { CalculateWeeklyStreakUseCase } from '@/application/usecases/weekly-status/CalculateWeeklyStreakUseCase';
import { ProductionReadinessService } from '@/application/services/ProductionReadinessService';
import { PostgresWeeklyStatusRepository } from '@/infrastructure/repositories/PostgresWeeklyStatusRepository';

export const dynamic = 'force-dynamic';

export const GET = rateLimit(API_RATE_LIMIT)(async (request: NextRequest) => {
  try {
    const userId = (await getAuthUser(request))?.userId ?? null;
    if (!userId) {
      return withSecurityHeaders(NextResponse.json({ error: 'No autorizado' }, { status: 401 }));
    }

    const { searchParams } = new URL(request.url);
    const channelIdParam = searchParams.get('channelId');
    const isoYearParam = searchParams.get('isoYear');
    const isoWeekParam = searchParams.get('isoWeek');

    const now = new Date();
    const repository = new PostgresWeeklyStatusRepository();
    const readinessService = new ProductionReadinessService();
    const buildTasksUseCase = new BuildWeeklyTasksUseCase();
    const streakUseCase = new CalculateWeeklyStreakUseCase();
    const useCase = new EvaluateWeeklyStatusUseCase(repository, readinessService, buildTasksUseCase, streakUseCase);
    const result = await useCase.execute({
      userId,
      channelIdParam,
      isoYearParam,
      isoWeekParam,
      now,
    });

    if (!result.ok) {
      return withSecurityHeaders(NextResponse.json({ error: result.error }, { status: result.status }));
    }

    return withSecurityHeaders(NextResponse.json(result.data));
  } catch {
    return withSecurityHeaders(NextResponse.json({ error: 'Error al evaluar la semana' }, { status: 500 }));
  }
});
