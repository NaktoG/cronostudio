import { NextRequest, NextResponse } from 'next/server';
import { withSecurityHeaders, getAuthUser } from '@/middleware/auth';
import { rateLimit, API_RATE_LIMIT } from '@/middleware/rateLimit';
import { requireRoles } from '@/middleware/rbac';
import { z } from 'zod';
import { validateInput } from '@/lib/validation';
import { logger } from '@/lib/logger';
import { PostgresSeoRepository } from '@/infrastructure/repositories/PostgresSeoRepository';
import { SeoScoreService } from '@/application/services/SeoScoreService';
import { ListSeoDataUseCase } from '@/application/usecases/seo/ListSeoDataUseCase';
import { CreateSeoDataUseCase } from '@/application/usecases/seo/CreateSeoDataUseCase';
import { UpdateSeoDataUseCase } from '@/application/usecases/seo/UpdateSeoDataUseCase';
import { DeleteSeoDataUseCase } from '@/application/usecases/seo/DeleteSeoDataUseCase';

export const dynamic = 'force-dynamic';



const CreateSeoSchema = z.object({
    videoId: z.string().uuid(),
    optimizedTitle: z.string().min(1).max(100),
    description: z.string().optional(),
    tags: z.array(z.string()).optional(),
    keywords: z.array(z.string()).optional(),
});

const UpdateSeoSchema = z.object({
    optimizedTitle: z.string().min(1).max(100).optional(),
    description: z.string().optional(),
    tags: z.array(z.string()).optional(),
    keywords: z.array(z.string()).optional(),
    score: z.number().int().min(0).max(100).optional(),
});

function isValidationError(error: unknown): boolean {
    return error instanceof Error && error.message.startsWith('Validation error:');
}

const seoRepository = new PostgresSeoRepository();
const scoreService = new SeoScoreService();
const listSeoDataUseCase = new ListSeoDataUseCase(seoRepository);
const createSeoDataUseCase = new CreateSeoDataUseCase(seoRepository, scoreService);
const updateSeoDataUseCase = new UpdateSeoDataUseCase(seoRepository, scoreService);
const deleteSeoDataUseCase = new DeleteSeoDataUseCase(seoRepository);

export const GET = rateLimit(API_RATE_LIMIT)(async (request: NextRequest) => {
    try {
        const userId = (await getAuthUser(request))?.userId;

        if (!userId) {
            return withSecurityHeaders(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
        }

        const { searchParams } = new URL(request.url);
        const videoId = searchParams.get('videoId');
        const channelId = searchParams.get('channelId');

        const items = await listSeoDataUseCase.execute({
            userId,
            filters: {
                videoId: videoId || undefined,
                channelId: channelId || undefined,
            },
        });
        return withSecurityHeaders(NextResponse.json(items));
    } catch (error) {
        logger.error('seo.fetch.error', { error: String(error) });
        return withSecurityHeaders(NextResponse.json({ error: 'Error al obtener datos SEO' }, { status: 500 }));
    }
});

export const POST = requireRoles(['owner'])(rateLimit(API_RATE_LIMIT)(async (request: NextRequest) => {
    try {
        const userId = (await getAuthUser(request))?.userId;

        if (!userId) {
            return withSecurityHeaders(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
        }

        const body = await request.json();
        const data = validateInput(CreateSeoSchema, body);
        const created = await createSeoDataUseCase.execute({
            userId,
            videoId: data.videoId,
            optimizedTitle: data.optimizedTitle,
            description: data.description,
            tags: data.tags,
            keywords: data.keywords,
        });

        return withSecurityHeaders(NextResponse.json(created, { status: 201 }));
    } catch (error) {
        logger.error('seo.create.error', { error: String(error) });
        if (error instanceof z.ZodError || isValidationError(error)) {
            return withSecurityHeaders(NextResponse.json({ error: 'Datos inválidos' }, { status: 400 }));
        }
        return withSecurityHeaders(NextResponse.json({ error: 'Error al crear datos SEO' }, { status: 500 }));
    }
}));

export const PUT = requireRoles(['owner'])(rateLimit(API_RATE_LIMIT)(async (request: NextRequest) => {
    try {
        const userId = (await getAuthUser(request))?.userId;

        if (!userId) {
            return withSecurityHeaders(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
        }

        const { searchParams } = new URL(request.url);
        const seoId = searchParams.get('id');
        if (!seoId) {
            return withSecurityHeaders(NextResponse.json({ error: 'ID requerido' }, { status: 400 }));
        }

        const body = await request.json();
        const data = validateInput(UpdateSeoSchema, body);

        const updated = await updateSeoDataUseCase.execute({
            userId,
            seoId,
            optimizedTitle: data.optimizedTitle,
            description: data.description,
            tags: data.tags,
            keywords: data.keywords,
            score: data.score,
        });

        if (!updated) {
            return withSecurityHeaders(NextResponse.json({ error: 'Datos SEO no encontrados' }, { status: 404 }));
        }

        return withSecurityHeaders(NextResponse.json(updated));
    } catch (error) {
        logger.error('seo.update.error', { error: String(error) });
        if (isValidationError(error)) {
            return withSecurityHeaders(NextResponse.json({ error: 'Datos inválidos' }, { status: 400 }));
        }
        return withSecurityHeaders(NextResponse.json({ error: 'Error al actualizar datos SEO' }, { status: 500 }));
    }
}));

export const DELETE = requireRoles(['owner'])(rateLimit(API_RATE_LIMIT)(async (request: NextRequest) => {
    try {
        const userId = (await getAuthUser(request))?.userId;

        if (!userId) {
            return withSecurityHeaders(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
        }

        const { searchParams } = new URL(request.url);
        const seoId = searchParams.get('id');
        if (!seoId) {
            return withSecurityHeaders(NextResponse.json({ error: 'ID requerido' }, { status: 400 }));
        }

        const deleted = await deleteSeoDataUseCase.execute({ userId, seoId });
        if (!deleted) {
            return withSecurityHeaders(NextResponse.json({ error: 'Datos SEO no encontrados' }, { status: 404 }));
        }

        return withSecurityHeaders(NextResponse.json({ message: 'Datos SEO eliminados' }));
    } catch (error) {
        logger.error('seo.delete.error', { error: String(error) });
        return withSecurityHeaders(NextResponse.json({ error: 'Error al eliminar datos SEO' }, { status: 500 }));
    }
}));
