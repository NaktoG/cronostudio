import { NextRequest, NextResponse } from 'next/server';
import { validateInput, RefreshTokenSchema } from '@/lib/validation';
import { withSecurityHeaders } from '@/middleware/auth';
import { rateLimit, LOGIN_RATE_LIMIT } from '@/middleware/rateLimit';
import { AuthService } from '@/application/services/AuthService';
import { PostgresUserRepository } from '@/infrastructure/repositories/PostgresUserRepository';
import { PostgresSessionRepository } from '@/infrastructure/repositories/PostgresSessionRepository';
import { logger } from '@/lib/logger';
import { clearAccessCookie, clearRefreshCookie, getRefreshCookie } from '@/lib/authCookies';

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
    if (refreshToken) {
      await authService.logout(refreshToken);
    }

    logger.info('auth.logout.success');
    const response = NextResponse.json({ message: 'Sesion cerrada' });
    clearRefreshCookie(response);
    clearAccessCookie(response);
    return withSecurityHeaders(response);
  } catch (error) {
    logger.error('auth.logout.error', { error: String(error) });
    return withSecurityHeaders(NextResponse.json({ error: 'Error al cerrar sesion' }, { status: 500 }));
  }
});
