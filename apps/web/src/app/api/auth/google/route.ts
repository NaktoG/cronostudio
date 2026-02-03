import { NextRequest, NextResponse } from 'next/server';
import { OAuth2Client } from 'google-auth-library';
import { withSecurityHeaders } from '@/middleware/auth';
import { rateLimit, LOGIN_RATE_LIMIT } from '@/middleware/rateLimit';
import { setAccessCookie, setRefreshCookie } from '@/lib/authCookies';
import { AuthService } from '@/application/services/AuthService';
import { PostgresUserRepository } from '@/infrastructure/repositories/PostgresUserRepository';
import { PostgresSessionRepository } from '@/infrastructure/repositories/PostgresSessionRepository';
import { logger } from '@/lib/logger';

const clientId = process.env.GOOGLE_CLIENT_ID;
if (!clientId) {
  console.warn('GOOGLE_CLIENT_ID no está definido. El login con Google no funcionará.');
}
const oauthClient = clientId ? new OAuth2Client(clientId) : null;

const userRepository = new PostgresUserRepository();
const sessionRepository = new PostgresSessionRepository();
const authService = new AuthService(userRepository, sessionRepository);

export const POST = rateLimit(LOGIN_RATE_LIMIT)(async (request: NextRequest) => {
  if (!oauthClient || !clientId) {
    return withSecurityHeaders(NextResponse.json({ error: 'Login con Google no configurado' }, { status: 503 }));
  }

  try {
    const body = await request.json();
    const credential = body?.credential as string | undefined;
    if (!credential) {
      return withSecurityHeaders(NextResponse.json({ error: 'Token de Google ausente' }, { status: 400 }));
    }

    const ticket = await oauthClient.verifyIdToken({ idToken: credential, audience: clientId });
    const payload = ticket.getPayload();

    if (!payload || !payload.email) {
      return withSecurityHeaders(NextResponse.json({ error: 'No pudimos validar tu cuenta de Google' }, { status: 400 }));
    }

    const nombre = payload.name || payload.email.split('@')[0];
    const resultado = await authService.loginWithProvider(payload.email, nombre);

    const response = NextResponse.json({
      mensaje: 'Sesión iniciada con Google',
      user: {
        id: resultado.user.id,
        email: resultado.user.email,
        name: resultado.user.name,
      },
    });

    setAccessCookie(response, resultado.token);
    setRefreshCookie(response, resultado.refreshToken);

    return withSecurityHeaders(response);
  } catch (error) {
    logger.error('auth.google.error', { error: String(error) });
    return withSecurityHeaders(NextResponse.json({ error: 'No pudimos iniciar sesión con Google' }, { status: 500 }));
  }
});
