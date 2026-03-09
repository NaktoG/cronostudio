// infrastructure/repositories/PostgresThumbnailRepository.ts
// Implementation of ThumbnailRepository using PostgreSQL

import { query } from '@/lib/db';
import {
    ThumbnailRepository,
    ThumbnailFilters,
    ThumbnailCreateInput,
    ThumbnailUpdateInput,
    ThumbnailRow,
} from '@/domain/repositories/ThumbnailRepository';

export class PostgresThumbnailRepository implements ThumbnailRepository {
    async listByUser(userId: string, filters?: ThumbnailFilters): Promise<ThumbnailRow[]> {
        let queryText = `
            SELECT t.*, s.title as script_title, p.id as production_id, c.id as channel_id
            FROM thumbnails t
            LEFT JOIN scripts s ON t.script_id = s.id
            LEFT JOIN ideas i ON s.idea_id = i.id
            LEFT JOIN videos v ON t.video_id = v.id
            LEFT JOIN productions p ON (p.script_id = t.script_id OR p.video_id = t.video_id) AND p.user_id = $1
            LEFT JOIN channels c ON c.id = COALESCE(i.channel_id, v.channel_id)
            WHERE t.user_id = $1`;
        const params: (string | null)[] = [userId];

        if (filters?.status) {
            queryText += ` AND t.status = $${params.length + 1}`;
            params.push(filters.status);
        }
        if (filters?.channelId) {
            queryText += ` AND c.id = $${params.length + 1}`;
            params.push(filters.channelId);
        }
        queryText += ' ORDER BY t.created_at DESC';

        const result = await query(queryText, params);
        return result.rows as ThumbnailRow[];
    }

    async create(input: ThumbnailCreateInput): Promise<ThumbnailRow> {
        const result = await query(
            `INSERT INTO thumbnails (user_id, script_id, video_id, title, notes, image_url)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING *`,
            [
                input.userId,
                input.scriptId ?? null,
                input.videoId ?? null,
                input.title,
                input.notes ?? null,
                input.imageUrl ?? null,
            ]
        );

        return result.rows[0] as ThumbnailRow;
    }

    async update(id: string, userId: string, input: ThumbnailUpdateInput): Promise<ThumbnailRow | null> {
        const updates: string[] = [];
        const params: (string | null)[] = [];
        let paramIndex = 1;

        if (input.title !== undefined) { updates.push(`title = $${paramIndex++}`); params.push(input.title); }
        if (input.notes !== undefined) { updates.push(`notes = $${paramIndex++}`); params.push(input.notes); }
        if (input.imageUrl !== undefined) { updates.push(`image_url = $${paramIndex++}`); params.push(input.imageUrl); }
        if (input.status !== undefined) { updates.push(`status = $${paramIndex++}`); params.push(input.status); }

        if (updates.length === 0) return null;

        params.push(id, userId);
        const result = await query(
            `UPDATE thumbnails SET ${updates.join(', ')} WHERE id = $${paramIndex++} AND user_id = $${paramIndex} RETURNING *`,
            params
        );

        if (result.rows.length === 0) return null;
        return result.rows[0] as ThumbnailRow;
    }

    async delete(id: string, userId: string): Promise<boolean> {
        const result = await query(
            'DELETE FROM thumbnails WHERE id = $1 AND user_id = $2 RETURNING id',
            [id, userId]
        );

        return result.rows.length > 0;
    }
}
