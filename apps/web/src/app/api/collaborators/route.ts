import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, withSecurityHeaders } from '@/middleware/auth';
import { requireRoles } from '@/middleware/rbac';
import { rateLimit, API_RATE_LIMIT } from '@/middleware/rateLimit';
import { buildCollaborationService } from '@/application/factories/collaborationServiceFactory';

export const GET = requireRoles(['owner'])(rateLimit(API_RATE_LIMIT)(async (request: NextRequest) => {
  try {
    const userId = (await getAuthUser(request))?.userId;
    if (!userId) {
      return withSecurityHeaders(NextResponse.json({ error: 'No autorizado' }, { status: 401 }));
    }

    const collaborationService = buildCollaborationService();
    const collaborators = await collaborationService.listCollaborators();
    return withSecurityHeaders(NextResponse.json({
      collaborators: collaborators.map((collab) => ({
        id: collab.id,
        email: collab.email,
        name: collab.name,
        role: collab.role,
        created_at: collab.createdAt.toISOString(),
      })),
    }));
  } catch (error) {
    console.error('[Collaborators] Error listing collaborators', error);
    return withSecurityHeaders(NextResponse.json({ error: 'No pudimos obtener colaboradores' }, { status: 500 }));
  }
}));
