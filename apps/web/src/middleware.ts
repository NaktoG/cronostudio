import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const DEFAULT_ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001',
];

function getAllowedOrigins(): string[] {
  const raw = process.env.CORS_ALLOWED_ORIGINS;
  if (!raw) return DEFAULT_ALLOWED_ORIGINS;
  return raw
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function isOriginAllowed(origin: string | null): origin is string {
  if (!origin) return false;
  return getAllowedOrigins().includes(origin);
}

function withCorsHeaders(response: NextResponse, origin: string) {
  response.headers.set('Access-Control-Allow-Origin', origin);
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  response.headers.set('Access-Control-Max-Age', '86400');
  return response;
}

export function middleware(request: NextRequest) {
  const origin = request.headers.get('origin');

  if (request.method === 'OPTIONS') {
    if (isOriginAllowed(origin)) {
      return withCorsHeaders(new NextResponse(null, { status: 204 }), origin);
    }
    return new NextResponse(null, { status: 403 });
  }

  const response = NextResponse.next();
  if (isOriginAllowed(origin)) {
    return withCorsHeaders(response, origin);
  }
  return response;
}

export const config = {
  matcher: ['/api/:path*'],
};
