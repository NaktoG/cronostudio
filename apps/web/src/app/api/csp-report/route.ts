import { NextRequest, NextResponse } from 'next/server';
import { withSecurityHeaders } from '@/middleware/auth';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    logger.warn('csp.report', { report: body });
  } catch (error) {
    logger.error('csp.report.error', { error: String(error) });
  }

  return withSecurityHeaders(new NextResponse(null, { status: 204 }));
}
