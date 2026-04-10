import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthUser, withSecurityHeaders } from '@/middleware/auth';
import { rateLimit, API_RATE_LIMIT } from '@/middleware/rateLimit';
import { clearAccessCookie, clearRefreshCookie } from '@/lib/authCookies';
import { CollaborationError } from '@/application/services/CollaborationService';
import { buildCollaborationService } from '@/application/factories/collaborationServiceFactory';
import { logger } from '@/lib/logger';

const acceptSchema = z.object({
  token: z.string().min(20),
});

export const POST = rateLimit(API_RATE_LIMIT)(async (request: NextRequest) => {
  try {
    const auth = await getAuthUser(request);
    if (!auth?.userId) {
      return withSecurityHeaders(NextResponse.json({ error: 'No autorizado' }, { status: 401 }));
    }

    const body = await request.json();
    const data = acceptSchema.parse(body);
    const collaborationService = buildCollaborationService();
    await collaborationService.acceptInvite({ token: data.token, userId: auth.userId, userEmail: auth.email });

    const response = NextResponse.json({ success: true, message: 'Invitacion aceptada. Vuelve a iniciar sesion.' });
    clearAccessCookie(response);
    clearRefreshCookie(response);
    return withSecurityHeaders(response);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return withSecurityHeaders(NextResponse.json({ error: 'Datos invalidos', details: error.flatten() }, { status: 400 }));
    }
    if (error instanceof CollaborationError) {
      const status = error.code === 'INVITE_INVALID' ? 404 : 403;
      return withSecurityHeaders(NextResponse.json({ error: error.message, code: error.code }, { status }));
    }
    logger.error('collaborators.invite.accept.error', { error: String(error) });
    return withSecurityHeaders(NextResponse.json({ error: 'No pudimos aceptar la invitacion' }, { status: 500 }));
  }
});
