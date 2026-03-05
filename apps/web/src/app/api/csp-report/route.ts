import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, API_RATE_LIMIT } from '@/middleware/rateLimit';
import { withSecurityHeaders } from '@/middleware/auth';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export const POST = rateLimit(API_RATE_LIMIT)(async (request: NextRequest) => {
  try {
    const contentType = request.headers.get('content-type') || '';
    let payload: unknown = null;

    if (contentType.includes('application/json')) {
      payload = await request.json();
    } else {
      payload = await request.text();
    }

    logger.warn('csp.report', {
      contentType,
      payload: typeof payload === 'string' ? payload.slice(0, 2000) : payload,
    });

    return withSecurityHeaders(new NextResponse(null, { status: 204 }));
  } catch (error) {
    logger.error('csp.report.error', { error: String(error) });
    return withSecurityHeaders(NextResponse.json({ error: 'Error al procesar CSP' }, { status: 500 }));
  }
});
