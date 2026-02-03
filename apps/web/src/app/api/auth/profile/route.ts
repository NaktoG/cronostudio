import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withSecurityHeaders, getAuthUser } from '@/middleware/auth';
import { AuthService, AuthError } from '@/application/services/AuthService';
import { PostgresUserRepository } from '@/infrastructure/repositories/PostgresUserRepository';
import { PostgresSessionRepository } from '@/infrastructure/repositories/PostgresSessionRepository';
import { clearAccessCookie, clearRefreshCookie } from '@/lib/authCookies';

const userRepository = new PostgresUserRepository();
const sessionRepository = new PostgresSessionRepository();
const authService = new AuthService(userRepository, sessionRepository);

const profileSchema = z.object({
  name: z.string().min(2, 'El nombre es obligatorio').max(100).optional(),
  email: z.string().email('Correo inválido').optional(),
}).refine((data) => data.name || data.email, {
  message: 'Debes enviar al menos un campo para actualizar',
});

function unauthorizedResponse() {
  return withSecurityHeaders(NextResponse.json({ error: 'No autorizado' }, { status: 401 }));
}

function handleError(error: unknown, defaultMessage: string) {
  if (error instanceof AuthError) {
    return withSecurityHeaders(NextResponse.json({ error: error.message, code: error.code }, { status: 400 }));
  }
  console.error('[Perfil] Error inesperado', error);
  return withSecurityHeaders(NextResponse.json({ error: defaultMessage }, { status: 500 }));
}

export async function GET(request: NextRequest) {
  try {
    const userId = getAuthUser(request)?.userId;
    if (!userId) return unauthorizedResponse();

    const user = await authService.getProfile(userId);
    return withSecurityHeaders(NextResponse.json({ user }));
  } catch (error) {
    return handleError(error, 'No pudimos obtener tu perfil');
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const userId = getAuthUser(request)?.userId;
    if (!userId) return unauthorizedResponse();

    const body = await request.json();
    const data = profileSchema.parse(body);
    const user = await authService.updateProfile(userId, data);
    return withSecurityHeaders(NextResponse.json({ user, mensaje: 'Perfil actualizado' }));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return withSecurityHeaders(NextResponse.json({ error: 'Datos inválidos', detalles: error.flatten() }, { status: 400 }));
    }
    return handleError(error, 'No pudimos guardar los cambios');
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = getAuthUser(request)?.userId;
    if (!userId) return unauthorizedResponse();

    await authService.deleteAccount(userId);
    const response = NextResponse.json({ mensaje: 'Cuenta eliminada' });
    clearAccessCookie(response);
    clearRefreshCookie(response);
    return withSecurityHeaders(response);
  } catch (error) {
    return handleError(error, 'No pudimos eliminar la cuenta');
  }
}
