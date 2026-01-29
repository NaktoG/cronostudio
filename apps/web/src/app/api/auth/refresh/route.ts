import { NextRequest, NextResponse } from 'next/server';
import { validateInput, RefreshTokenSchema } from '@/lib/validation';
import { withSecurityHeaders } from '@/middleware/auth';
import { rateLimit, LOGIN_RATE_LIMIT } from '@/middleware/rateLimit';
import { AuthService, AuthError } from '@/application/services/AuthService';
import { PostgresUserRepository } from '@/infrastructure/repositories/PostgresUserRepository';
import { PostgresSessionRepository } from '@/infrastructure/repositories/PostgresSessionRepository';

const userRepository = new PostgresUserRepository();
const sessionRepository = new PostgresSessionRepository();
const authService = new AuthService(userRepository, sessionRepository);

export const POST = rateLimit(LOGIN_RATE_LIMIT)(async (request: NextRequest) => {
  try {
    const body = await request.json();
    const validated = validateInput(RefreshTokenSchema, body);

    const result = await authService.refresh(validated.refreshToken);
    const response = NextResponse.json({
      message: 'Token actualizado',
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
      },
      token: result.token,
      refreshToken: result.refreshToken,
    });

    return withSecurityHeaders(response);
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: 'Refresh token invalido' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Error al refrescar token' }, { status: 500 });
  }
});
