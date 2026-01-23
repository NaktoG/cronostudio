// middleware/auth.ts
// JWT authentication middleware

import { NextRequest, NextResponse } from 'next/server';

// Secret from environment (should be in .env)
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';

/**
 * Verifica que la request tiene un token válido
 * En desarrollo, acepta header Authorization: Bearer <token>
 */
export function withAuth(handler: Function) {
  return async (request: NextRequest, ...args: any[]) => {
    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        {
          error: 'Unauthorized',
          message: 'Missing or invalid Authorization header',
        },
        { status: 401 }
      );
    }

    const token = authHeader.slice(7); // Remove "Bearer " prefix

    try {
      // TODO: Verify JWT token signature
      // For now, just check if token exists
      if (!token || token.length < 10) {
        throw new Error('Invalid token format');
      }

      // Add user context to request
      (request as any).user = {
        id: 'user-placeholder', // Will be decoded from JWT
        email: 'user@example.com', // Will be decoded from JWT
      };

      return handler(request, ...args);
    } catch (error) {
      return NextResponse.json(
        {
          error: 'Unauthorized',
          message: 'Invalid token',
        },
        { status: 401 }
      );
    }
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

  return response;
}
