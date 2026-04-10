// infrastructure/repositories/PostgresWeeklyStatusRepository.ts
// SQL access for weekly-status computations

import { query } from '@/lib/db';

export type ChannelResolution = { id: string; name: string; source: 'explicit' | 'default' } | null;

export class PostgresWeeklyStatusRepository {
    async resolveChannel(userId: string, channelId?: string | null): Promise<ChannelResolution> {
        if (channelId) {
            const result = await query(
                `SELECT id, name FROM channels WHERE id = $1 AND user_id = $2 LIMIT 1`,
                [channelId, userId]
            );
            if (result.rows.length === 0) return null;
            return { ...result.rows[0], source: 'explicit' as const };
        }

        const result = await query(
            `SELECT id, name FROM channels WHERE user_id = $1 ORDER BY created_at ASC LIMIT 1`,
            [userId]
        );
        if (result.rows.length === 0) return null;
        return { ...result.rows[0], source: 'default' as const };
    }

    async getWeeklyGoal(userId: string, channelId: string, isoYear: number, isoWeek: number) {
        const result = await query(
            `SELECT target_videos, dias_publicacion, hora_corte
             FROM weekly_goals
             WHERE user_id = $1 AND channel_id = $2 AND iso_year = $3 AND iso_week = $4`,
            [userId, channelId, isoYear, isoWeek]
        );
        return result.rows[0] ?? null;
    }

    async listIdeas(userId: string, channelId: string) {
        const ideasQuery = `SELECT title, description FROM ideas WHERE user_id = $1 AND channel_id = $2 AND status <> 'archived'`;
        const ideasResult = await query(ideasQuery, [userId, channelId]);
        return ideasResult.rows;
    }

    async listProductionsForWeek(userId: string, channelId: string, isoYear: number, isoWeek: number) {
        const productionParams: (string | number | null)[] = [userId, channelId, isoYear, isoWeek];
        const productionQuery = `
            SELECT
              p.id,
              p.title,
              p.status,
              p.target_date,
              p.published_at,
              p.planned_publish_day,
              s.id as script_id,
              s.intro,
              s.body,
              s.cta,
              s.outro,
              t.id as thumbnail_id,
              t.status as thumbnail_status,
              t.image_url,
              seo.id as seo_id,
              seo.optimized_title as seo_title,
              seo.description as seo_description,
              seo.tags as seo_tags
            FROM productions p
            LEFT JOIN scripts s ON p.script_id = s.id
            LEFT JOIN thumbnails t ON p.thumbnail_id = t.id
            LEFT JOIN seo_data seo ON p.seo_id = seo.id
            WHERE p.user_id = $1 AND p.channel_id = $2 AND p.iso_year = $3 AND p.iso_week = $4
            ORDER BY p.planned_publish_day ASC NULLS LAST, p.created_at ASC
        `;
        const productionsResult = await query(productionQuery, productionParams);
        return productionsResult.rows;
    }

    async listProductionsForDateRange(userId: string, channelId: string, start: string, end: string) {
        const fallbackParams: (string | null)[] = [userId, start, end, channelId];
        const fallbackQuery = `
            SELECT
              p.id,
              p.title,
              p.status,
              p.target_date,
              p.published_at,
              p.planned_publish_day,
              s.id as script_id,
              s.intro,
              s.body,
              s.cta,
              s.outro,
              t.id as thumbnail_id,
              t.status as thumbnail_status,
              t.image_url,
              seo.id as seo_id,
              seo.optimized_title as seo_title,
              seo.description as seo_description,
              seo.tags as seo_tags
            FROM productions p
            LEFT JOIN scripts s ON p.script_id = s.id
            LEFT JOIN thumbnails t ON p.thumbnail_id = t.id
            LEFT JOIN seo_data seo ON p.seo_id = seo.id
            WHERE p.user_id = $1 AND p.target_date BETWEEN $2 AND $3 AND p.channel_id = $4
            ORDER BY p.target_date ASC NULLS LAST, p.created_at ASC
        `;
        const fallbackResult = await query(fallbackQuery, fallbackParams);
        return fallbackResult.rows;
    }

    async listPublishedThisWeek(userId: string, channelId: string, weekStartIso: string, weekEndIso: string) {
        const publishParams: (string | null)[] = [userId, weekStartIso, weekEndIso, channelId];
        const publishQuery = `
            SELECT id, title, published_at
            FROM productions
            WHERE user_id = $1 AND published_at BETWEEN $2 AND $3 AND channel_id = $4
            ORDER BY published_at DESC LIMIT 10
        `;
        const publishedResult = await query(publishQuery, publishParams);
        return publishedResult.rows;
    }
}
