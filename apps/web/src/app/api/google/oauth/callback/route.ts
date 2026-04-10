import { NextRequest } from 'next/server';
import { GET as youtubeCallback } from '@/app/api/integrations/youtube/callback/route';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<Record<string, string>> };

export function GET(request: NextRequest, context: RouteContext) {
  return youtubeCallback(request, context);
}
