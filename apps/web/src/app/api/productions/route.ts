// app/api/productions/route.ts
// Refactored to use Clean Architecture UseCases

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withSecurityHeaders } from '@/middleware/auth';
import { rateLimit, API_RATE_LIMIT } from '@/middleware/rateLimit';
import { validateInput } from '@/lib/validation';
import { logger } from '@/lib/logger';

// UseCases & Infrastructure
import { CreateProductionUseCase } from '@/application/usecases/production/CreateProductionUseCase';
import { ListProductionsUseCase } from '@/application/usecases/production/ListProductionsUseCase';
import { UpdateProductionUseCase } from '@/application/usecases/production/UpdateProductionUseCase';
import { PostgresProductionRepository } from '@/infrastructure/repositories/PostgresProductionRepository';
import { AuthService } from '@/application/services/AuthService';
import { PostgresUserRepository } from '@/infrastructure/repositories/PostgresUserRepository';
import { ProductionStatus } from '@/domain/value-objects/ProductionStatus';

// Schemas for HTTP validation
const PRODUCTION_STATUSES = ['idea', 'scripting', 'recording', 'editing', 'shorts', 'publishing', 'published'] as const;

const CreateProductionSchema = z.object({
    title: z.string().min(1).max(255),
    description: z.string().optional(),
    channelId: z.string().uuid().optional(),
    ideaId: z.string().uuid().optional(),
    targetDate: z.string().optional(),
    priority: z.number().int().min(0).max(10).optional(),
});

const UpdateProductionSchema = z.object({
    title: z.string().min(1).max(255).optional(),
    description: z.string().optional(),
    status: z.enum(PRODUCTION_STATUSES).optional(),
    priority: z.number().int().min(0).max(10).optional(),
    targetDate: z.string().optional().nullable(),
});

// Dependency injection
const productionRepository = new PostgresProductionRepository();
const userRepository = new PostgresUserRepository();
const authService = new AuthService(userRepository);

// Helper to extract userId
function getUserId(request: NextRequest): string | null {
    const authHeader = request.headers.get('authorization');
    return authService.extractUserIdFromHeader(authHeader);
}

/**
 * GET /api/productions
 * List productions with optional pipeline stats
 */
export async function GET(request: NextRequest) {
    try {
        const userId = getUserId(request);
        if (!userId) {
            return withSecurityHeaders(NextResponse.json({ error: 'No autorizado' }, { status: 401 }));
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status') as ProductionStatus | null;
        const channelId = searchParams.get('channelId');
        const includeStats = searchParams.get('stats') === 'true';

        const useCase = new ListProductionsUseCase(productionRepository);
        const result = await useCase.execute({
            userId,
            filters: {
                status: status ?? undefined,
                channelId: channelId ?? undefined,
            },
            includeStats,
        });

        if (includeStats) {
            return withSecurityHeaders(NextResponse.json({
                productions: result.productions,
                pipeline: result.pipeline,
            }));
        }

        return withSecurityHeaders(NextResponse.json(result.productions));
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error('Error fetching productions', { error: errorMessage });

        // Return empty array if table doesn't exist
        if (errorMessage.includes('does not exist') || errorMessage.includes('relation')) {
            return withSecurityHeaders(NextResponse.json({ productions: [], pipeline: {} }));
        }
        return withSecurityHeaders(NextResponse.json({ error: 'Error al obtener producciones' }, { status: 500 }));
    }
}

/**
 * POST /api/productions
 * Create a new production
 */
export const POST = rateLimit(API_RATE_LIMIT)(async (request: NextRequest) => {
    try {
        const userId = getUserId(request);
        if (!userId) {
            return withSecurityHeaders(NextResponse.json({ error: 'No autorizado' }, { status: 401 }));
        }

        const body = await request.json();
        const data = validateInput(CreateProductionSchema, body);

        const useCase = new CreateProductionUseCase(productionRepository);
        const production = await useCase.execute({
            userId,
            title: data.title,
            description: data.description,
            channelId: data.channelId,
            ideaId: data.ideaId,
            priority: data.priority,
            targetDate: data.targetDate,
        });

        return withSecurityHeaders(NextResponse.json(production, { status: 201 }));
    } catch (error) {
        logger.error('Error creating production', { error: String(error) });
        if (error instanceof z.ZodError) {
            return withSecurityHeaders(NextResponse.json({ error: 'Datos inválidos', details: error.errors }, { status: 400 }));
        }
        return withSecurityHeaders(NextResponse.json({ error: 'Error al crear producción' }, { status: 500 }));
    }
});

/**
 * PUT /api/productions?id=<uuid>
 * Update an existing production
 */
export const PUT = rateLimit(API_RATE_LIMIT)(async (request: NextRequest) => {
    try {
        const userId = getUserId(request);
        if (!userId) {
            return withSecurityHeaders(NextResponse.json({ error: 'No autorizado' }, { status: 401 }));
        }

        const { searchParams } = new URL(request.url);
        const productionId = searchParams.get('id');
        if (!productionId) {
            return withSecurityHeaders(NextResponse.json({ error: 'ID de producción requerido' }, { status: 400 }));
        }

        const body = await request.json();
        const data = validateInput(UpdateProductionSchema, body);

        if (Object.keys(data).length === 0) {
            return withSecurityHeaders(NextResponse.json({ error: 'No hay campos para actualizar' }, { status: 400 }));
        }

        const useCase = new UpdateProductionUseCase(productionRepository);
        const production = await useCase.execute({
            productionId,
            userId,
            updates: {
                title: data.title,
                description: data.description,
                status: data.status as ProductionStatus | undefined,
                priority: data.priority,
                targetDate: data.targetDate ? new Date(data.targetDate) : undefined,
            },
        });

        return withSecurityHeaders(NextResponse.json(production));
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error('Error updating production', { error: errorMessage });

        if (errorMessage.includes('not found') || errorMessage.includes('access denied')) {
            return withSecurityHeaders(NextResponse.json({ error: 'Producción no encontrada' }, { status: 404 }));
        }
        return withSecurityHeaders(NextResponse.json({ error: 'Error al actualizar producción' }, { status: 500 }));
    }
});

/**
 * DELETE /api/productions?id=<uuid>
 * Delete a production
 */
export const DELETE = rateLimit(API_RATE_LIMIT)(async (request: NextRequest) => {
    try {
        const userId = getUserId(request);
        if (!userId) {
            return withSecurityHeaders(NextResponse.json({ error: 'No autorizado' }, { status: 401 }));
        }

        const { searchParams } = new URL(request.url);
        const productionId = searchParams.get('id');
        if (!productionId) {
            return withSecurityHeaders(NextResponse.json({ error: 'ID de producción requerido' }, { status: 400 }));
        }

        const deleted = await productionRepository.delete(productionId, userId);

        if (!deleted) {
            return withSecurityHeaders(NextResponse.json({ error: 'Producción no encontrada' }, { status: 404 }));
        }

        return withSecurityHeaders(NextResponse.json({ message: 'Producción eliminada' }));
    } catch (error) {
        logger.error('Error deleting production', { error: String(error) });
        return withSecurityHeaders(NextResponse.json({ error: 'Error al eliminar producción' }, { status: 500 }));
    }
});
