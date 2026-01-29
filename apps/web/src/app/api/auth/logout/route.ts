import { NextRequest, NextResponse } from 'next/server';
import { validateInput, RefreshTokenSchema } from '@/lib/validation';
import { withSecurityHeaders } from '@/middleware/auth';
import { rateLimit, LOGIN_RATE_LIMIT } from '@/middleware/rateLimit';
import { AuthService } from '@/application/services/AuthService';
import { PostgresUserRepository } from '@/infrastructure/repositories/PostgresUserRepository';
import { PostgresSessionRepository } from '@/infrastructure/repositories/PostgresSessionRepository';

const userRepository = new PostgresUserRepository();
const sessionRepository = new PostgresSessionRepository();
const authService = new AuthService(userRepository, sessionRepository);

export const POST = rateLimit(LOGIN_RATE_LIMIT)(async (request: NextRequest) => {
  try {
    const body = await request.json();
    const validated = validateInput(RefreshTokenSchema, body);
    await authService.logout(validated.refreshToken);

    const response = NextResponse.json({ message: 'Sesion cerrada' });
    return withSecurityHeaders(response);
  } catch (error) {
    return NextResponse.json({ error: 'Error al cerrar sesion' }, { status: 500 });
  }
});
