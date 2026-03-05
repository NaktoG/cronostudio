import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuthUser, withSecurityHeaders } from '@/middleware/auth';
import { requireRoles } from '@/middleware/rbac';
import { rateLimit, API_RATE_LIMIT } from '@/middleware/rateLimit';
import { CollaborationError } from '@/application/services/CollaborationService';
import { buildCollaborationService } from '@/application/factories/collaborationServiceFactory';

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(['collaborator']).optional(),
});

const collaborationService = buildCollaborationService();

export const GET = requireRoles(['owner'])(rateLimit(API_RATE_LIMIT)(async (request: NextRequest) => {
  try {
    const userId = (await getAuthUser(request))?.userId;
    if (!userId) {
      return withSecurityHeaders(NextResponse.json({ error: 'No autorizado' }, { status: 401 }));
    }

    const invites = await collaborationService.listInvites(userId);
    return withSecurityHeaders(NextResponse.json({ invites: invites.map((invite) => ({
      id: invite.id,
      email: invite.email,
      role: invite.role,
      status: invite.status,
      created_at: invite.createdAt.toISOString(),
      accepted_at: invite.acceptedAt ? invite.acceptedAt.toISOString() : null,
    })) }));
  } catch (error) {
    console.error('[Collaborators] Error listing invites', error);
    return withSecurityHeaders(NextResponse.json({ error: 'No pudimos obtener las invitaciones' }, { status: 500 }));
  }
}));

export const POST = requireRoles(['owner'])(rateLimit(API_RATE_LIMIT)(async (request: NextRequest) => {
  try {
    const auth = await getAuthUser(request);
    if (!auth?.userId) {
      return withSecurityHeaders(NextResponse.json({ error: 'No autorizado' }, { status: 401 }));
    }

    const body = await request.json();
    const data = inviteSchema.parse(body);
    const result = await collaborationService.createInvite({
      email: data.email,
      invitedBy: auth.userId,
      role: data.role ?? 'collaborator',
      requesterEmail: auth.email,
    });
    return withSecurityHeaders(NextResponse.json({ inviteUrl: result.inviteUrl }));
  } catch (error) {
    if (error instanceof z.ZodError) {
      return withSecurityHeaders(NextResponse.json({ error: 'Datos invalidos', details: error.flatten() }, { status: 400 }));
    }
    if (error instanceof CollaborationError) {
      const status = error.code === 'INVITE_EXISTS' || error.code === 'ALREADY_COLLABORATOR' ? 409 : 400;
      return withSecurityHeaders(NextResponse.json({ error: error.message, code: error.code }, { status }));
    }
    console.error('[Collaborators] Error creating invite', error);
    return withSecurityHeaders(NextResponse.json({ error: 'No pudimos crear la invitacion' }, { status: 500 }));
  }
}));
