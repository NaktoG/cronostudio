import { NextRequest, NextResponse } from 'next/server';
import { withSecurityHeaders, getAuthUser } from '@/middleware/auth';
import { rateLimit, API_RATE_LIMIT } from '@/middleware/rateLimit';
import { AI_PROFILES } from '@/lib/ai/profiles';

export const dynamic = 'force-dynamic';

export const GET = rateLimit(API_RATE_LIMIT)(async (request: NextRequest) => {
  const userId = (await getAuthUser(request))?.userId;
  if (!userId) {
    return withSecurityHeaders(NextResponse.json({ error: 'No autorizado' }, { status: 401 }));
  }

  const profiles = AI_PROFILES.map((profile) => ({
    key: profile.key,
    version: profile.version,
    name: profile.name,
    description: profile.description,
  }));

  return withSecurityHeaders(NextResponse.json({ profiles }));
});
