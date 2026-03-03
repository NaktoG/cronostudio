import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withSecurityHeaders, getAuthUser } from '@/middleware/auth';
import { rateLimit, API_RATE_LIMIT } from '@/middleware/rateLimit';
import { requireRoles } from '@/middleware/rbac';
import { getClient } from '@/lib/db';

export const dynamic = 'force-dynamic';

const PublishSchema = z.object({
  productionId: z.string().uuid(),
  publishedUrl: z.string().url().optional().nullable(),
  platformId: z.string().optional().nullable(),
  platform: z.string().optional().default('youtube'),
});

export const POST = requireRoles(['owner'])(rateLimit(API_RATE_LIMIT)(async (request: NextRequest) => {
  const userId = getAuthUser(request)?.userId ?? null;
  if (!userId) {
    return withSecurityHeaders(NextResponse.json({ error: 'No autorizado' }, { status: 401 }));
  }

  const body = await request.json();
  const parsed = PublishSchema.safeParse(body);
  if (!parsed.success) {
    return withSecurityHeaders(NextResponse.json({ error: 'Datos inválidos' }, { status: 400 }));
  }
  const data = parsed.data;

  const client = await getClient();
  try {
    await client.query('BEGIN');

    const updateResult = await client.query(
      `UPDATE productions
       SET status = 'published',
           published_at = NOW(),
           published_url = $1,
           platform_id = $2,
           updated_at = NOW()
       WHERE id = $3 AND user_id = $4
       RETURNING id, channel_id, title, published_at, published_url, platform_id`,
      [data.publishedUrl ?? null, data.platformId ?? null, data.productionId, userId]
    );

    if (updateResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return withSecurityHeaders(NextResponse.json({ error: 'Producción no encontrada' }, { status: 404 }));
    }

    const production = updateResult.rows[0];

    await client.query(
      `INSERT INTO publish_events (production_id, user_id, channel_id, platform, platform_id, published_url, published_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        production.id,
        userId,
        production.channel_id,
        data.platform ?? 'youtube',
        data.platformId ?? null,
        data.publishedUrl ?? null,
        production.published_at,
      ]
    );

    await client.query('COMMIT');

    return withSecurityHeaders(NextResponse.json({
      productionId: production.id,
      title: production.title,
      publishedAt: production.published_at,
      publishedUrl: production.published_url,
      platformId: production.platform_id,
    }));
  } catch (error) {
    await client.query('ROLLBACK');
    return withSecurityHeaders(NextResponse.json({ error: 'Error al marcar como publicado' }, { status: 500 }));
  } finally {
    client.release();
  }
}));
