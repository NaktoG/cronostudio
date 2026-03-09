import { NextRequest, NextResponse } from 'next/server';
import { withSecurityHeaders, getAuthUser } from '@/middleware/auth';
import { rateLimit, API_RATE_LIMIT } from '@/middleware/rateLimit';
import { requireRoles } from '@/middleware/rbac';
import { z } from 'zod';
import { validateInput } from '@/lib/validation';
import { logger } from '@/lib/logger';
import { PostgresScriptRepository } from '@/infrastructure/repositories/PostgresScriptRepository';
import { ScriptMetricsService } from '@/application/services/ScriptMetricsService';
import { ListScriptsUseCase } from '@/application/usecases/script/ListScriptsUseCase';
import { CreateScriptUseCase } from '@/application/usecases/script/CreateScriptUseCase';
import { UpdateScriptUseCase } from '@/application/usecases/script/UpdateScriptUseCase';
import { DeleteScriptUseCase } from '@/application/usecases/script/DeleteScriptUseCase';

export const dynamic = 'force-dynamic';



const CreateScriptSchema = z.object({
    title: z.string().min(1).max(200),
    ideaId: z.string().uuid().optional(),
    intro: z.string().optional(),
    body: z.string().optional(),
    cta: z.string().optional(),
    outro: z.string().optional(),
});

const UpdateScriptSchema = z.object({
    title: z.string().min(1).max(200).optional(),
    intro: z.string().optional(),
    body: z.string().optional(),
    cta: z.string().optional(),
    outro: z.string().optional(),
    status: z.enum(['draft', 'review', 'approved', 'recorded']).optional(),
});

const ScriptQuerySchema = z.object({
    status: z.enum(['draft', 'review', 'approved', 'recorded']).optional(),
    ideaId: z.string().uuid().optional(),
    channelId: z.string().uuid().optional(),
});

function isValidationError(error: unknown): boolean {
    return error instanceof Error && error.message.startsWith('Validation error:');
}

const scriptRepository = new PostgresScriptRepository();
const metricsService = new ScriptMetricsService();
const listScriptsUseCase = new ListScriptsUseCase(scriptRepository);
const createScriptUseCase = new CreateScriptUseCase(scriptRepository, metricsService);
const updateScriptUseCase = new UpdateScriptUseCase(scriptRepository, metricsService);
const deleteScriptUseCase = new DeleteScriptUseCase(scriptRepository);

export const GET = rateLimit(API_RATE_LIMIT)(async (request: NextRequest) => {
    try {
        const userId = (await getAuthUser(request))?.userId;

        if (!userId) {
            return withSecurityHeaders(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
        }

        const { searchParams } = new URL(request.url);
        const queryParams = validateInput(ScriptQuerySchema, {
            status: searchParams.get('status') || undefined,
            ideaId: searchParams.get('ideaId') || undefined,
            channelId: searchParams.get('channelId') || undefined,
        });
        const { status, ideaId, channelId } = queryParams;

        const scripts = await listScriptsUseCase.execute({
            userId,
            filters: {
                status,
                ideaId,
                channelId,
            },
        });

        return withSecurityHeaders(NextResponse.json(scripts));
    } catch (error) {
        logger.error('scripts.fetch.error', { error: String(error) });
        if (error instanceof z.ZodError || isValidationError(error)) {
            return withSecurityHeaders(NextResponse.json({ error: 'Datos inválidos' }, { status: 400 }));
        }
        return withSecurityHeaders(NextResponse.json({ error: 'Error al obtener guiones' }, { status: 500 }));
    }
});

export const POST = requireRoles(['owner'])(rateLimit(API_RATE_LIMIT)(async (request: NextRequest) => {
    try {
        const userId = (await getAuthUser(request))?.userId;

        if (!userId) {
            return withSecurityHeaders(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
        }

        const body = await request.json();
        const data = validateInput(CreateScriptSchema, body);
        const script = await createScriptUseCase.execute({
            userId,
            title: data.title,
            ideaId: data.ideaId,
            intro: data.intro,
            body: data.body,
            cta: data.cta,
            outro: data.outro,
        });

        return withSecurityHeaders(NextResponse.json(script, { status: 201 }));
    } catch (error) {
        logger.error('scripts.create.error', { error: String(error) });
        if (error instanceof z.ZodError || isValidationError(error)) {
            return withSecurityHeaders(NextResponse.json({ error: 'Datos inválidos' }, { status: 400 }));
        }
        return withSecurityHeaders(NextResponse.json({ error: 'Error al crear guion' }, { status: 500 }));
    }
}));

export const PUT = requireRoles(['owner'])(rateLimit(API_RATE_LIMIT)(async (request: NextRequest) => {
    try {
        const userId = (await getAuthUser(request))?.userId;

        if (!userId) {
            return withSecurityHeaders(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
        }

        const { searchParams } = new URL(request.url);
        const scriptId = searchParams.get('id');
        if (!scriptId) {
            return withSecurityHeaders(NextResponse.json({ error: 'ID requerido' }, { status: 400 }));
        }

        const body = await request.json();
        const data = validateInput(UpdateScriptSchema, body);

        const updated = await updateScriptUseCase.execute({
            userId,
            scriptId,
            title: data.title,
            intro: data.intro,
            body: data.body,
            cta: data.cta,
            outro: data.outro,
            status: data.status,
        });

        if (!updated) {
            return withSecurityHeaders(NextResponse.json({ error: 'Guion no encontrado' }, { status: 404 }));
        }

        return withSecurityHeaders(NextResponse.json(updated));
    } catch (error) {
        logger.error('scripts.update.error', { error: String(error) });
        if (isValidationError(error)) {
            return withSecurityHeaders(NextResponse.json({ error: 'Datos inválidos' }, { status: 400 }));
        }
        return withSecurityHeaders(NextResponse.json({ error: 'Error al actualizar guion' }, { status: 500 }));
    }
}));

export const DELETE = requireRoles(['owner'])(rateLimit(API_RATE_LIMIT)(async (request: NextRequest) => {
    try {
        const userId = (await getAuthUser(request))?.userId;

        if (!userId) {
            return withSecurityHeaders(NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
        }

        const { searchParams } = new URL(request.url);
        const scriptId = searchParams.get('id');
        if (!scriptId) {
            return withSecurityHeaders(NextResponse.json({ error: 'ID requerido' }, { status: 400 }));
        }

        const deleted = await deleteScriptUseCase.execute({ userId, scriptId });
        if (!deleted) {
            return withSecurityHeaders(NextResponse.json({ error: 'Guion no encontrado' }, { status: 404 }));
        }

        return withSecurityHeaders(NextResponse.json({ message: 'Guion eliminado' }));
    } catch (error) {
        logger.error('scripts.delete.error', { error: String(error) });
        return withSecurityHeaders(NextResponse.json({ error: 'Error al eliminar guion' }, { status: 500 }));
    }
}));
