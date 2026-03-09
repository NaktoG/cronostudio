import { NextRequest, NextResponse } from 'next/server';
import { withSecurityHeaders, getAuthUser } from '@/middleware/auth';
import { rateLimit, API_RATE_LIMIT } from '@/middleware/rateLimit';
import { requireRoles } from '@/middleware/rbac';
import { z } from 'zod';
import { validateInput } from '@/lib/validation';
import { logger } from '@/lib/logger';
import { PostgresThumbnailRepository } from '@/infrastructure/repositories/PostgresThumbnailRepository';
import { PostgresProductionThumbnailSync } from '@/infrastructure/repositories/PostgresProductionThumbnailSync';
import { ProductionThumbnailSyncService } from '@/application/services/ProductionThumbnailSyncService';
import { ListThumbnailsUseCase } from '@/application/usecases/thumbnail/ListThumbnailsUseCase';
import { CreateThumbnailUseCase } from '@/application/usecases/thumbnail/CreateThumbnailUseCase';
import { UpdateThumbnailUseCase } from '@/application/usecases/thumbnail/UpdateThumbnailUseCase';
import { DeleteThumbnailUseCase } from '@/application/usecases/thumbnail/DeleteThumbnailUseCase';

export const dynamic = 'force-dynamic';



const CreateThumbnailSchema = z.object({
    title: z.string().min(1).max(200),
    scriptId: z.string().uuid().optional(),
    videoId: z.string().uuid().optional(),
    notes: z.string().optional(),
    imageUrl: z.string().url().optional(),
});

const UpdateThumbnailSchema = z.object({
    title: z.string().min(1).max(200).optional(),
    notes: z.string().optional(),
    imageUrl: z.string().url().optional(),
    status: z.enum(['pending', 'designing', 'designed', 'approved']).optional(),
});

function isValidationError(error: unknown): boolean {
    return error instanceof Error && error.message.startsWith('Validation error:');
}

const thumbnailRepository = new PostgresThumbnailRepository();
const productionSync = new ProductionThumbnailSyncService(new PostgresProductionThumbnailSync());
const listThumbnailsUseCase = new ListThumbnailsUseCase(thumbnailRepository);
const createThumbnailUseCase = new CreateThumbnailUseCase(thumbnailRepository, productionSync);
const updateThumbnailUseCase = new UpdateThumbnailUseCase(thumbnailRepository, productionSync);
const deleteThumbnailUseCase = new DeleteThumbnailUseCase(thumbnailRepository);

export const GET = rateLimit(API_RATE_LIMIT)(async (request: NextRequest) => {
    try {
        const userId = (await getAuthUser(request))?.userId;

        if (!userId) {
            return withSecurityHeaders(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const channelId = searchParams.get('channelId');

        const items = await listThumbnailsUseCase.execute({
            userId,
            filters: {
                status: status || undefined,
                channelId: channelId || undefined,
            },
        });
        return withSecurityHeaders(NextResponse.json(items));
    } catch (error) {
        logger.error('thumbnails.fetch.error', { error: String(error) });
        return withSecurityHeaders(NextResponse.json({ error: 'Error al obtener miniaturas' }, { status: 500 }));
    }
});

export const POST = requireRoles(['owner'])(rateLimit(API_RATE_LIMIT)(async (request: NextRequest) => {
    try {
        const userId = (await getAuthUser(request))?.userId;

        if (!userId) {
            return withSecurityHeaders(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
        }

        const body = await request.json();
        const data = validateInput(CreateThumbnailSchema, body);

        const created = await createThumbnailUseCase.execute({
            userId,
            title: data.title,
            notes: data.notes,
            imageUrl: data.imageUrl,
            scriptId: data.scriptId,
            videoId: data.videoId,
        });

        return withSecurityHeaders(NextResponse.json(created, { status: 201 }));
    } catch (error) {
        logger.error('thumbnails.create.error', { error: String(error) });
        if (error instanceof z.ZodError || isValidationError(error)) {
            return withSecurityHeaders(NextResponse.json({ error: 'Datos inválidos' }, { status: 400 }));
        }
        return withSecurityHeaders(NextResponse.json({ error: 'Error al crear miniatura' }, { status: 500 }));
    }
}));

export const PUT = requireRoles(['owner'])(rateLimit(API_RATE_LIMIT)(async (request: NextRequest) => {
    try {
        const userId = (await getAuthUser(request))?.userId;

        if (!userId) {
            return withSecurityHeaders(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
        }

        const { searchParams } = new URL(request.url);
        const thumbnailId = searchParams.get('id');
        if (!thumbnailId) {
            return withSecurityHeaders(NextResponse.json({ error: 'ID requerido' }, { status: 400 }));
        }

        const body = await request.json();
        const data = validateInput(UpdateThumbnailSchema, body);

        if (data.title === undefined && data.notes === undefined && data.imageUrl === undefined && data.status === undefined) {
            return withSecurityHeaders(NextResponse.json({ error: 'No hay campos' }, { status: 400 }));
        }
        const updated = await updateThumbnailUseCase.execute({
            userId,
            thumbnailId,
            title: data.title,
            notes: data.notes,
            imageUrl: data.imageUrl,
            status: data.status,
        });

        if (!updated) {
            return withSecurityHeaders(NextResponse.json({ error: 'Miniatura no encontrada' }, { status: 404 }));
        }

        return withSecurityHeaders(NextResponse.json(updated));
    } catch (error) {
        logger.error('thumbnails.update.error', { error: String(error) });
        if (isValidationError(error)) {
            return withSecurityHeaders(NextResponse.json({ error: 'Datos inválidos' }, { status: 400 }));
        }
        return withSecurityHeaders(NextResponse.json({ error: 'Error al actualizar miniatura' }, { status: 500 }));
    }
}));

export const DELETE = requireRoles(['owner'])(rateLimit(API_RATE_LIMIT)(async (request: NextRequest) => {
    try {
        const userId = (await getAuthUser(request))?.userId;

        if (!userId) {
            return withSecurityHeaders(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
        }

        const { searchParams } = new URL(request.url);
        const thumbnailId = searchParams.get('id');
        if (!thumbnailId) {
            return withSecurityHeaders(NextResponse.json({ error: 'ID requerido' }, { status: 400 }));
        }

        const deleted = await deleteThumbnailUseCase.execute({ userId, thumbnailId });
        if (!deleted) {
            return withSecurityHeaders(NextResponse.json({ error: 'Miniatura no encontrada' }, { status: 404 }));
        }

        return withSecurityHeaders(NextResponse.json({ message: 'Miniatura eliminada' }));
    } catch (error) {
        logger.error('thumbnails.delete.error', { error: String(error) });
        return withSecurityHeaders(NextResponse.json({ error: 'Error al eliminar miniatura' }, { status: 500 }));
    }
}));
