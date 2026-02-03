import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withSecurityHeaders, getAuthUser } from '@/middleware/auth';
import { rateLimit, API_RATE_LIMIT } from '@/middleware/rateLimit';
import { AuthService, AuthError } from '@/application/services/AuthService';
import { PostgresUserRepository } from '@/infrastructure/repositories/PostgresUserRepository';
import { PostgresSessionRepository } from '@/infrastructure/repositories/PostgresSessionRepository';

const userRepository = new PostgresUserRepository();
const sessionRepository = new PostgresSessionRepository();
const authService = new AuthService(userRepository, sessionRepository);

const passwordSchema = z.object({
  passwordActual: z.string().min(8, 'La contraseña actual es obligatoria'),
  passwordNueva: z.string().min(8, 'La nueva contraseña debe tener al menos 8 caracteres'),
});

function unauthorizedResponse() {
  return withSecurityHeaders(NextResponse.json({ error: 'No autorizado' }, { status: 401 }));
}

function handleError(error: unknown) {
  if (error instanceof AuthError) {
    return withSecurityHeaders(NextResponse.json({ error: error.message, code: error.code }, { status: 400 }));
  }
  console.error('[Cambio contraseña] Error inesperado', error);
  return withSecurityHeaders(NextResponse.json({ error: 'No pudimos actualizar la contraseña' }, { status: 500 }));
}

export const POST = rateLimit(API_RATE_LIMIT)(async (request: NextRequest) => {
  try {
    const userId = getAuthUser(request)?.userId;
    if (!userId) return unauthorizedResponse();

    const body = await request.json();
    const data = passwordSchema.parse(body);
    await authService.changePassword(userId, data.passwordActual, data.passwordNueva);
    return withSecurityHeaders(NextResponse.json({ mensaje: 'Contraseña actualizada' }));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return withSecurityHeaders(NextResponse.json({ error: 'Datos inválidos', detalles: error.flatten() }, { status: 400 }));
    }
    return handleError(error);
  }
});
