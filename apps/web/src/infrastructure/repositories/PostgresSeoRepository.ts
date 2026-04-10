// infrastructure/repositories/PostgresSeoRepository.ts
// Implementation of SeoRepository using PostgreSQL

import { query } from '@/lib/db';
import { SeoRepository, SeoFilters, SeoCreateInput, SeoUpdateInput, SeoRow } from '@/domain/repositories/SeoRepository';

export class PostgresSeoRepository implements SeoRepository {
    async listByUser(userId: string, filters?: SeoFilters): Promise<SeoRow[]> {
        let queryText = `SELECT s.*, v.title as video_title FROM seo_data s LEFT JOIN videos v ON s.video_id = v.id`;
        if (filters?.channelId) {
            queryText += ' LEFT JOIN productions p ON p.seo_id = s.id AND p.user_id = $1';
        }
        queryText += ' WHERE s.user_id = $1';
        const params: (string | null)[] = [userId];
        let paramIndex = 2;

        if (filters?.videoId) { queryText += ` AND s.video_id = $${paramIndex++}`; params.push(filters.videoId); }
        if (filters?.channelId) { queryText += ` AND p.channel_id = $${paramIndex++}`; params.push(filters.channelId); }
        queryText += ' ORDER BY s.created_at DESC';

        const result = await query(queryText, params);
        return result.rows as SeoRow[];
    }

    async findById(id: string, userId: string): Promise<SeoRow | null> {
        const result = await query(
            'SELECT optimized_title, description, tags FROM seo_data WHERE id = $1 AND user_id = $2',
            [id, userId]
        );

        if (result.rows.length === 0) return null;
        return result.rows[0] as SeoRow;
    }

    async create(input: SeoCreateInput): Promise<SeoRow> {
        const result = await query(
            `INSERT INTO seo_data (user_id, video_id, optimized_title, description, tags, keywords, score) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [
                input.userId,
                input.videoId,
                input.optimizedTitle,
                input.description ?? null,
                input.tags ?? [],
                input.keywords ?? [],
                input.score,
            ]
        );

        return result.rows[0] as SeoRow;
    }

    async update(id: string, userId: string, input: SeoUpdateInput): Promise<SeoRow | null> {
        const updates: string[] = ['score = $1'];
        const params: (string | number | string[] | null)[] = [input.score];
        let paramIndex = 2;

        if (input.optimizedTitle !== undefined) { updates.push(`optimized_title = $${paramIndex++}`); params.push(input.optimizedTitle); }
        if (input.description !== undefined) { updates.push(`description = $${paramIndex++}`); params.push(input.description); }
        if (input.tags !== undefined) { updates.push(`tags = $${paramIndex++}`); params.push(input.tags); }
        if (input.keywords !== undefined) { updates.push(`keywords = $${paramIndex++}`); params.push(input.keywords); }

        params.push(id, userId);
        const result = await query(
            `UPDATE seo_data SET ${updates.join(', ')} WHERE id = $${paramIndex++} AND user_id = $${paramIndex} RETURNING *`,
            params
        );

        if (result.rows.length === 0) return null;
        return result.rows[0] as SeoRow;
    }

    async delete(id: string, userId: string): Promise<boolean> {
        const result = await query(
            'DELETE FROM seo_data WHERE id = $1 AND user_id = $2 RETURNING id',
            [id, userId]
        );

        return result.rows.length > 0;
    }
}
