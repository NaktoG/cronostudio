// middleware/auth.ts
// JWT authentication middleware

import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { config } from '@/lib/config';
import { logger } from '@/lib/logger';
import { isValidUserRole } from '@/domain/value-objects/UserRole';
import { getAccessCookie } from '@/lib/authCookies';
import type { User } from '@/domain/entities/User';
import { PostgresSessionRepository } from '@/infrastructure/repositories/PostgresSessionRepository';

const JWT_SECRET = config.jwt.secret;

type RouteContext = { params: Promise<Record<string, string>> };
type RouteHandler<Context = RouteContext> = (request: NextRequest, context: Context) => Promise<NextResponse> | NextResponse;


export interface JWTPayload {
  userId: string;
  email: string;
  role: User['role'];
  sid?: string;
  iat?: number;
  exp?: number;
}

export interface AuthenticatedRequest extends NextRequest {
  user: JWTPayload;
}

function getValidatedRole(role: unknown): User['role'] | null {
  if (typeof role !== 'string') return null;
  return isValidUserRole(role) ? (role as User['role']) : null;
}

function unauthorizedRoleResponse(): NextResponse {
  return NextResponse.json(
    {
      error: 'No autorizado',
      message: 'Rol inválido en el token de acceso',
    },
    { status: 401 }
  );
}

/**
 * Verifica que la request tiene un token JWT válido
 */
export function withAuth<Context = RouteContext>(handler: RouteHandler<Context>): RouteHandler<Context> {
  return async (request: NextRequest, context: Context) => {
    const payload = await getAuthUser(request);
    if (!payload) {
      return NextResponse.json(
        {
          error: 'No autorizado',
          message: 'Token de autorización requerido',
        },
        { status: 401 }
      );
    }
    (request as AuthenticatedRequest).user = payload;
    return handler(request, context);
  };
}

/**
 * Middleware opcional de autenticación
 * No falla si no hay token, pero agrega usuario si existe
 */
export function withOptionalAuth<Context = RouteContext>(handler: RouteHandler<Context>): RouteHandler<Context> {
  return async (request: NextRequest, context: Context) => {
    const payload = await getAuthUser(request);
    if (payload) {
      (request as AuthenticatedRequest).user = payload;
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
  const cspPolicy = [
    "default-src 'self'",
    `img-src ${config.csp.imgSrc.join(' ')}`,
    `script-src ${config.csp.scriptSrc.join(' ')}`,
    `style-src ${config.csp.styleSrc.join(' ')}`,
    `font-src ${config.csp.fontSrc.join(' ')}`,
    `connect-src ${config.csp.connectSrc.join(' ')}`,
    "object-src 'none'",
    "frame-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ];
  response.headers.set('Content-Security-Policy', cspPolicy.join('; '));
  if (config.csp.reportOnly) {
    const reportOnlyPolicy = [...cspPolicy];
    if (config.csp.reportUri) {
      reportOnlyPolicy.push(`report-uri ${config.csp.reportUri}`);
    }
    response.headers.set('Content-Security-Policy-Report-Only', reportOnlyPolicy.join('; '));
  }
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  response.headers.set('Cross-Origin-Embedder-Policy', 'credentialless');

  return response;
}

/**
 * Helper para obtener usuario del request autenticado
 */
export async function getAuthUser(request: NextRequest): Promise<JWTPayload | null> {
  const cached = (request as AuthenticatedRequest).user;
  if (cached) {
    return cached;
  }
  const token = extractTokenFromRequest(request);
  if (!token) return null;
  try {
    const payload = jwt.verify(token, JWT_SECRET) as JWTPayload;
    const role = getValidatedRole(payload.role);
    if (!role) return null;

    if (payload.sid) {
      const sessionRepository = new PostgresSessionRepository();
      const session = await sessionRepository.findValidById(payload.sid);
      if (!session || session.userId !== payload.userId) {
        return null;
      }
    }

    return {
      userId: payload.userId,
      email: payload.email,
      role,
      sid: payload.sid,
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
