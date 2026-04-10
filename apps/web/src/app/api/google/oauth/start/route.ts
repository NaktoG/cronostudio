import { NextRequest } from 'next/server';
import { GET as youtubeConnect } from '@/app/api/integrations/youtube/connect/route';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<Record<string, string>> };

export function GET(request: NextRequest, context: RouteContext) {
  return youtubeConnect(request, context);
}
