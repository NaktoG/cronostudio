import { NextRequest, NextResponse } from 'next/server';
import { validateInput, RefreshTokenSchema } from '@/lib/validation';
import { withSecurityHeaders } from '@/middleware/auth';
import { rateLimit, LOGIN_RATE_LIMIT } from '@/middleware/rateLimit';
import { AuthService, AuthError } from '@/application/services/AuthService';
import { PostgresUserRepository } from '@/infrastructure/repositories/PostgresUserRepository';
import { PostgresSessionRepository } from '@/infrastructure/repositories/PostgresSessionRepository';
import { logger } from '@/lib/logger';
import { getRefreshCookie, setAccessCookie, setRefreshCookie } from '@/lib/authCookies';

const userRepository = new PostgresUserRepository();
const sessionRepository = new PostgresSessionRepository();
const authService = new AuthService(userRepository, sessionRepository);

export const POST = rateLimit(LOGIN_RATE_LIMIT)(async (request: NextRequest) => {
  try {
    let body: unknown = {};
    try {
      body = await request.json();
    } catch {
      body = {};
    }
    const validated = validateInput(RefreshTokenSchema, body);
    const refreshToken = getRefreshCookie(request) || validated.refreshToken;
    if (!refreshToken) {
      return withSecurityHeaders(NextResponse.json({ error: 'Refresh token requerido' }, { status: 401 }));
    }

    const result = await authService.refresh(refreshToken);
    const response = NextResponse.json({
      message: 'Token actualizado',
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
      },
    });

    setAccessCookie(response, result.token);
    setRefreshCookie(response, result.refreshToken);
    logger.info('auth.refresh.success', { userId: result.user.id });
    return withSecurityHeaders(response);
  } catch (error) {
    if (error instanceof AuthError) {
      logger.warn('auth.refresh.invalid', { error: error.message });
      return withSecurityHeaders(NextResponse.json({ error: 'Refresh token invalido' }, { status: 401 }));
    }
    logger.error('auth.refresh.error', { error: String(error) });
    return withSecurityHeaders(NextResponse.json({ error: 'Error al refrescar token' }, { status: 500 }));
  }
});
