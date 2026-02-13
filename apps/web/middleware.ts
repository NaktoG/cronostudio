import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { config as appConfig } from '@/lib/config';

const allowedOrigins = new Set(appConfig.cors.allowedOrigins);

function applyCorsHeaders(response: NextResponse, origin: string | null) {
    if (!origin || !allowedOrigins.has(origin)) {
        return response;
    }

    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Access-Control-Max-Age', '86400');
    return response;
}

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const origin = request.headers.get('origin');
    const isAllowedOrigin = origin ? allowedOrigins.has(origin) : false;

    if (request.method === 'OPTIONS') {
        if (!isAllowedOrigin) {
            return new NextResponse(null, { status: 403 });
        }
        const preflight = new NextResponse(null, { status: 204 });
        return applyCorsHeaders(preflight, origin);
    }

    const response = NextResponse.next();
    // Solo aplicar CORS a rutas API
    if (pathname.startsWith('/api/')) {
        return applyCorsHeaders(response, origin);
    }

    return response;
}

export const config = {
    matcher: ['/api/:path*'],
};
