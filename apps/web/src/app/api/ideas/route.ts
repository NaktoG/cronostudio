// app/api/ideas/route.ts
// Refactored to use Clean Architecture UseCases

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withSecurityHeaders, getAuthUser } from '@/middleware/auth';
import { rateLimit, API_RATE_LIMIT } from '@/middleware/rateLimit';
import { requireRoles } from '@/middleware/rbac';
import { validateInput } from '@/lib/validation';
import { logger } from '@/lib/logger';
import { USER_ROLE_OWNER } from '@/domain/value-objects/UserRole';

export const dynamic = 'force-dynamic';

// UseCases & Infrastructure
import { CreateIdeaUseCase } from '@/application/usecases/idea/CreateIdeaUseCase';
import { ListIdeasUseCase } from '@/application/usecases/idea/ListIdeasUseCase';
import { UpdateIdeaUseCase } from '@/application/usecases/idea/UpdateIdeaUseCase';
import { DeleteIdeaUseCase } from '@/application/usecases/idea/DeleteIdeaUseCase';
import { PostgresIdeaRepository } from '@/infrastructure/repositories/PostgresIdeaRepository';
import { IdeaStatus } from '@/domain/value-objects/IdeaStatus';

// Schemas for HTTP validation
const CreateIdeaSchema = z.object({
    title: z.string().min(1).max(200),
    description: z.string().optional(),
    channelId: z.string().uuid().optional(),
    priority: z.number().int().min(0).max(10).optional(),
    tags: z.array(z.string()).optional(),
});

const UpdateIdeaSchema = z.object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().optional(),
    status: z.enum(['draft', 'approved', 'in_production', 'completed', 'archived']).optional(),
    priority: z.number().int().min(0).max(10).optional(),
    tags: z.array(z.string()).optional(),
});

// Helper to extract userId from request
function getUserId(request: NextRequest): string | null {
    return getAuthUser(request)?.userId ?? null;
}

/**
 * GET /api/ideas
 * List all ideas for authenticated user
 */
export async function GET(request: NextRequest) {
    try {
        const userId = getUserId(request);
        if (!userId) {
            return withSecurityHeaders(NextResponse.json({ error: 'No autorizado' }, { status: 401 }));
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status') as IdeaStatus | null;
        const channelId = searchParams.get('channelId');

        const ideaRepository = new PostgresIdeaRepository();
        const useCase = new ListIdeasUseCase(ideaRepository);
        const result = await useCase.execute({
            userId,
            filters: {
                status: status ?? undefined,
                channelId: channelId ?? undefined,
            },
        });

        return withSecurityHeaders(NextResponse.json(result.ideas));
    } catch (error) {
        logger.error('Error fetching ideas', { error: String(error) });
        return withSecurityHeaders(NextResponse.json({ error: 'Error al obtener ideas' }, { status: 500 }));
    }
}

/**
 * POST /api/ideas
 * Create a new idea
 */
export const POST = requireRoles([USER_ROLE_OWNER])(rateLimit(API_RATE_LIMIT)(async (request: NextRequest) => {
    try {
        const userId = getUserId(request);
        if (!userId) {
            return withSecurityHeaders(NextResponse.json({ error: 'No autorizado' }, { status: 401 }));
        }

        const body = await request.json();
        const data = validateInput(CreateIdeaSchema, body);

        const ideaRepository = new PostgresIdeaRepository(); // Instantiate repository here
        const useCase = new CreateIdeaUseCase(ideaRepository);
        const idea = await useCase.execute({
            userId,
            title: data.title,
            description: data.description,
            channelId: data.channelId,
            priority: data.priority,
            tags: data.tags,
        });

        return withSecurityHeaders(NextResponse.json(idea, { status: 201 }));
    } catch (error) {
        logger.error('Error creating idea', { error: String(error) });
        if (error instanceof z.ZodError) {
            return withSecurityHeaders(NextResponse.json({ error: 'Datos inválidos', details: error.errors }, { status: 400 }));
        }
        return withSecurityHeaders(NextResponse.json({ error: 'Error al crear idea' }, { status: 500 }));
    }
}));

/**
 * PUT /api/ideas?id=<uuid>
 * Update an existing idea
 */
export const PUT = requireRoles([USER_ROLE_OWNER])(rateLimit(API_RATE_LIMIT)(async (request: NextRequest) => {
    try {
        const userId = getUserId(request);
        if (!userId) {
            return withSecurityHeaders(NextResponse.json({ error: 'No autorizado' }, { status: 401 }));
        }

        const { searchParams } = new URL(request.url);
        const ideaId = searchParams.get('id');
        if (!ideaId) {
            return withSecurityHeaders(NextResponse.json({ error: 'ID de idea requerido' }, { status: 400 }));
        }

        const body = await request.json();
        const data = validateInput(UpdateIdeaSchema, body);

        if (Object.keys(data).length === 0) {
            return withSecurityHeaders(NextResponse.json({ error: 'No hay campos para actualizar' }, { status: 400 }));
        }

        const ideaRepository = new PostgresIdeaRepository();
        const useCase = new UpdateIdeaUseCase(ideaRepository);
        const idea = await useCase.execute({
            ideaId,
            userId,
            updates: {
                title: data.title,
                description: data.description,
                status: data.status as IdeaStatus | undefined,
                priority: data.priority,
                tags: data.tags,
            },
        });

        return withSecurityHeaders(NextResponse.json(idea));
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error('Error updating idea', { error: errorMessage });

        if (errorMessage.includes('not found') || errorMessage.includes('access denied')) {
            return withSecurityHeaders(NextResponse.json({ error: 'Idea no encontrada' }, { status: 404 }));
        }
        return withSecurityHeaders(NextResponse.json({ error: 'Error al actualizar idea' }, { status: 500 }));
    }
}));

/**
 * DELETE /api/ideas?id=<uuid>
 * Delete an idea
 */
export const DELETE = requireRoles([USER_ROLE_OWNER])(rateLimit(API_RATE_LIMIT)(async (request: NextRequest) => {
    try {
        const userId = getUserId(request);
        if (!userId) {
            return withSecurityHeaders(NextResponse.json({ error: 'No autorizado' }, { status: 401 }));
        }

        const { searchParams } = new URL(request.url);
        const ideaId = searchParams.get('id');
        if (!ideaId) {
            return withSecurityHeaders(NextResponse.json({ error: 'ID de idea requerido' }, { status: 400 }));
        }

        const ideaRepository = new PostgresIdeaRepository();
        const useCase = new DeleteIdeaUseCase(ideaRepository);
        await useCase.execute({ ideaId, userId });

        return withSecurityHeaders(NextResponse.json({ message: 'Idea eliminada' }));
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error('Error deleting idea', { error: errorMessage });

        if (errorMessage.includes('not found') || errorMessage.includes('access denied')) {
            return withSecurityHeaders(NextResponse.json({ error: 'Idea no encontrada' }, { status: 404 }));
        }
        return withSecurityHeaders(NextResponse.json({ error: 'Error al eliminar idea' }, { status: 500 }));
    }
}));
