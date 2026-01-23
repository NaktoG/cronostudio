// middleware/auth.ts
// JWT authentication middleware

import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';

export interface JWTPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

export interface AuthenticatedRequest extends NextRequest {
  user: JWTPayload;
}

/**
 * Verifica que la request tiene un token JWT válido
 */
export function withAuth(handler: Function) {
  return async (request: NextRequest, ...args: unknown[]) => {
    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        {
          error: 'No autorizado',
          message: 'Token de autorización requerido',
        },
        { status: 401 }
      );
    }

    const token = authHeader.slice(7); // Remove "Bearer " prefix

    try {
      // Verificar y decodificar JWT
      const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;

      // Agregar usuario al request
      (request as AuthenticatedRequest).user = {
        userId: decoded.userId,
        email: decoded.email,
      };

      return handler(request, ...args);
    } catch (error) {
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

      console.error('[Auth Middleware] Error:', error);
      return NextResponse.json(
        {
          error: 'Error de autenticación',
          message: 'Error al verificar token',
        },
        { status: 500 }
      );
    }
  };
}

/**
 * Middleware opcional de autenticación
 * No falla si no hay token, pero agrega usuario si existe
 */
export function withOptionalAuth(handler: Function) {
  return async (request: NextRequest, ...args: unknown[]) => {
    const authHeader = request.headers.get('authorization');

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
        (request as AuthenticatedRequest).user = {
          userId: decoded.userId,
          email: decoded.email,
        };
      } catch {
        // Ignorar errores, es opcional
      }
    }

    return handler(request, ...args);
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
  response.headers.set('Cache-Control', 'no-store');

  return response;
}

/**
 * Helper para obtener usuario del request autenticado
 */
export function getAuthUser(request: NextRequest): JWTPayload | null {
  return (request as AuthenticatedRequest).user || null;
}
