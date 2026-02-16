// middleware/auth.ts
// JWT authentication middleware

import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { config } from '@/lib/config';
import { logger } from '@/lib/logger';
import { getAccessCookie } from '@/lib/authCookies';
import type { User } from '@/domain/entities/User';

const JWT_SECRET = config.jwt.secret;

type RouteContext = { params: Promise<Record<string, string>> };
type RouteHandler<Context = RouteContext> = (request: NextRequest, context: Context) => Promise<NextResponse> | NextResponse;


export interface JWTPayload {
  userId: string;
  email: string;
  role: User['role'];
  iat?: number;
  exp?: number;
}

export interface AuthenticatedRequest extends NextRequest {
  user: JWTPayload;
}

/**
 * Verifica que la request tiene un token JWT válido
 */
export function withAuth<Context = RouteContext>(handler: RouteHandler<Context>): RouteHandler<Context> {
  return async (request: NextRequest, context: Context) => {
    const token = extractTokenFromRequest(request);

    if (!token) {
      return NextResponse.json(
        {
          error: 'No autorizado',
          message: 'Token de autorización requerido',
        },
        { status: 401 }
      );
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
      (request as AuthenticatedRequest).user = {
          userId: decoded.userId,
          email: decoded.email,
          role: decoded.role ?? 'owner',
      };
      return handler(request, context);
    } catch (error) {
      return handleJwtError(error);
    }
  };
}

/**
 * Middleware opcional de autenticación
 * No falla si no hay token, pero agrega usuario si existe
 */
export function withOptionalAuth<Context = RouteContext>(handler: RouteHandler<Context>): RouteHandler<Context> {
  return async (request: NextRequest, context: Context) => {
    const token = extractTokenFromRequest(request);

    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
        (request as AuthenticatedRequest).user = {
          userId: decoded.userId,
          email: decoded.email,
          role: decoded.role ?? 'owner',
        };
      } catch {
        // Opcional, ignorar errores
      }
    }

    return handler(request, context);
  };
}

/**
 * Agrega headers de seguridad a la response
 */
export function withSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  response.headers.set('Referrer-Policy', 'no-referrer');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.headers.set('Cache-Control', 'no-store');
  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "img-src 'self' data: https:",
      "script-src 'self'",
      "style-src 'self' 'unsafe-inline'",
      "font-src 'self' data: https://fonts.gstatic.com",
      "connect-src 'self'",
      "frame-ancestors 'none'",
    ].join('; ')
  );
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  response.headers.set('Cross-Origin-Embedder-Policy', 'credentialless');

  return response;
}

/**
 * Helper para obtener usuario del request autenticado
 */
export function getAuthUser(request: NextRequest): JWTPayload | null {
  const cached = (request as AuthenticatedRequest).user;
  if (cached) {
    return cached;
  }
  const token = extractTokenFromRequest(request);
  if (!token) return null;
  try {
    const payload = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return {
      userId: payload.userId,
      email: payload.email,
      role: payload.role ?? 'owner',
    };
  } catch {
    return null;
  }
}

function extractTokenFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }
  const cookieToken = getAccessCookie(request);
  return cookieToken || null;
}

function handleJwtError(error: unknown): NextResponse {
  if (error instanceof jwt.TokenExpiredError) {
    return NextResponse.json(
      {
        error: 'Token expirado',
        message: 'Por favor inicia sesión nuevamente',
      },
      { status: 401 }
    );
  }

  if (error instanceof jwt.JsonWebTokenError) {
    return NextResponse.json(
      {
        error: 'Token inválido',
        message: 'Token de autorización inválido',
      },
      { status: 401 }
    );
  }

  logger.error('[Auth Middleware] Token verification failed', { error: String(error) });
  return NextResponse.json(
    {
      error: 'Error de autenticación',
      message: 'Error al verificar token',
    },
    { status: 500 }
  );
}
