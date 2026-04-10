// infrastructure/repositories/PostgresProductionPublish.ts
// SQL implementation for production publish transaction

import { getClient } from '@/lib/db';

export type PublishResult = {
    productionId: string;
    title: string;
    publishedAt: string;
    publishedUrl: string | null;
    platformId: string | null;
    channelId: string | null;
};

export class PostgresProductionPublish {
    async publish(params: {
        userId: string;
        productionId: string;
        publishedUrl?: string | null;
        platformId?: string | null;
        platform?: string | null;
    }): Promise<PublishResult | null> {
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
                [params.publishedUrl ?? null, params.platformId ?? null, params.productionId, params.userId]
            );

            if (updateResult.rows.length === 0) {
                await client.query('ROLLBACK');
                return null;
            }

            const production = updateResult.rows[0];

            await client.query(
                `INSERT INTO publish_events (production_id, user_id, channel_id, platform, platform_id, published_url, published_at)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [
                    production.id,
                    params.userId,
                    production.channel_id,
                    params.platform ?? 'youtube',
                    params.platformId ?? null,
                    params.publishedUrl ?? null,
                    production.published_at,
                ]
            );

            await client.query('COMMIT');

            return {
                productionId: production.id,
                title: production.title,
                publishedAt: production.published_at,
                publishedUrl: production.published_url,
                platformId: production.platform_id,
                channelId: production.channel_id,
            };
        } catch {
            await client.query('ROLLBACK');
            throw new Error('publish_failed');
        } finally {
            client.release();
        }
    }
}
