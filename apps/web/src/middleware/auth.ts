// middleware/auth.ts
// JWT authentication middleware

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { config } from '@/lib/config';
import { isValidUserRole } from '@/domain/value-objects/UserRole';
import { getAccessCookie, getCsrfCookie } from '@/lib/authCookies';
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

type TokenSource = 'bearer' | 'cookie';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

function getValidatedRole(role: unknown): User['role'] | null {
  if (typeof role !== 'string') return null;
  return isValidUserRole(role) ? (role as User['role']) : null;
}

/**
 * Verifica que la request tiene un token JWT válido
 */
export function withAuth<Context = RouteContext>(handler: RouteHandler<Context>): RouteHandler<Context> {
  return async (request: NextRequest, context: Context) => {
    const payload = await getAuthUser(request);
    if (!payload) {
      return withSecurityHeaders(NextResponse.json(
        {
          error: 'No autorizado',
          message: 'Token de autorización requerido',
        },
        { status: 401 }
      ));
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
  if (config.csp.reportOnly) {
    const reportOnlyPolicy = [...cspPolicy];
    if (config.csp.reportUri) {
      reportOnlyPolicy.push(`report-uri ${config.csp.reportUri}`);
    }
    response.headers.set('Content-Security-Policy-Report-Only', reportOnlyPolicy.join('; '));
  } else {
    response.headers.set('Content-Security-Policy', cspPolicy.join('; '));
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
  const extracted = extractTokenFromRequest(request);
  if (!extracted) return null;

  if (config.auth.csrfEnforce && extracted.source === 'cookie' && !SAFE_METHODS.has(request.method)) {
    if (!hasValidCsrfToken(request)) {
      return null;
    }
  }

  const token = extracted.token;
  try {
    const payload = jwt.verify(token, JWT_SECRET, {
      issuer: config.jwt.issuer,
      audience: config.jwt.audience,
      algorithms: ['HS256'],
    }) as JWTPayload;
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

function extractTokenFromRequest(request: NextRequest): { token: string; source: TokenSource } | null {
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return { token: authHeader.slice(7), source: 'bearer' };
  }
  const cookieToken = getAccessCookie(request);
  if (!cookieToken) return null;
  return { token: cookieToken, source: 'cookie' };
}

function hasValidCsrfToken(request: NextRequest): boolean {
  const expected = getCsrfCookie(request);
  const provided = request.headers.get('x-csrf-token') || request.headers.get('x-xsrf-token');
  if (!expected || !provided) return false;

  const expectedBuf = Buffer.from(expected);
  const providedBuf = Buffer.from(provided);
  if (expectedBuf.length !== providedBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, providedBuf);
}
