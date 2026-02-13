import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/lib/config';

const ALLOWED_ORIGINS = config.cors.allowedOrigins;

/**
 * Middleware de CORS
 * Verifica el origin y agrega headers CORS apropiados
 */
type RouteHandler = (request: NextRequest, ...args: unknown[]) => Promise<NextResponse> | NextResponse;

export function withCORS(handler: RouteHandler): RouteHandler {
    return async (request: NextRequest, ...args: unknown[]) => {
        const origin = request.headers.get('origin');

        // Verificar si el origin está permitido
        const isAllowed = origin && ALLOWED_ORIGINS.includes(origin);

        // Ejecutar handler
        const response = await handler(request, ...args);

        // Agregar headers CORS si el origin está permitido
        if (isAllowed) {
            response.headers.set('Access-Control-Allow-Origin', origin);
            response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
            response.headers.set('Access-Control-Allow-Credentials', 'true');
            response.headers.set('Access-Control-Max-Age', '86400');
        }

        return response;
    };
}

/**
 * Manejar preflight requests (OPTIONS)
 */
export function handlePreflight(request: NextRequest): NextResponse {
    const origin = request.headers.get('origin');
    const isAllowed = origin && ALLOWED_ORIGINS.includes(origin);

    if (isAllowed) {
        return new NextResponse(null, {
            status: 204,
            headers: {
                'Access-Control-Allow-Origin': origin,
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                'Access-Control-Allow-Credentials': 'true',
                'Access-Control-Max-Age': '86400',
            },
        });
    }

    return new NextResponse(null, { status: 403 });
}
