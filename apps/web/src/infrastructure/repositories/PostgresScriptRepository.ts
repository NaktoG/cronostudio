// infrastructure/repositories/PostgresScriptRepository.ts
// Implementation of ScriptRepository using PostgreSQL

import { query } from '@/lib/db';
import {
    ScriptRepository,
    ScriptFilters,
    ScriptCreateInput,
    ScriptUpdateInput,
    ScriptContentSnapshot,
    ScriptRow,
} from '@/domain/repositories/ScriptRepository';

export class PostgresScriptRepository implements ScriptRepository {
    async listByUser(userId: string, filters?: ScriptFilters): Promise<ScriptRow[]> {
        let queryText = `SELECT s.*, i.title as idea_title FROM scripts s LEFT JOIN ideas i ON s.idea_id = i.id WHERE s.user_id = $1`;
        const params: (string | null)[] = [userId];
        let paramIndex = 2;

        if (filters?.status) { queryText += ` AND s.status = $${paramIndex++}`; params.push(filters.status); }
        if (filters?.ideaId) { queryText += ` AND s.idea_id = $${paramIndex}`; params.push(filters.ideaId); }
        if (filters?.channelId) { queryText += ` AND i.channel_id = $${paramIndex++}`; params.push(filters.channelId); }
        queryText += ' ORDER BY s.created_at DESC';

        const result = await query(queryText, params);
        return result.rows as ScriptRow[];
    }

    async create(input: ScriptCreateInput): Promise<ScriptRow> {
        const result = await query(
            `INSERT INTO scripts (user_id, idea_id, title, intro, body, cta, outro, full_content, word_count, estimated_duration_seconds)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
            [
                input.userId,
                input.ideaId ?? null,
                input.title,
                input.intro ?? null,
                input.body ?? null,
                input.cta ?? null,
                input.outro ?? null,
                input.fullContent,
                input.wordCount,
                input.estimatedDurationSeconds,
            ]
        );

        return result.rows[0] as ScriptRow;
    }

    async findContentById(id: string, userId: string): Promise<ScriptContentSnapshot | null> {
        const result = await query(
            'SELECT intro, body, cta, outro FROM scripts WHERE id = $1 AND user_id = $2',
            [id, userId]
        );

        if (result.rows.length === 0) return null;
        return {
            intro: result.rows[0].intro as string | null,
            body: result.rows[0].body as string | null,
            cta: result.rows[0].cta as string | null,
            outro: result.rows[0].outro as string | null,
        };
    }

    async update(id: string, userId: string, input: ScriptUpdateInput): Promise<ScriptRow | null> {
        const updates: string[] = ['full_content = $1', 'word_count = $2', 'estimated_duration_seconds = $3'];
        const params: (string | number | null)[] = [input.fullContent, input.wordCount, input.estimatedDurationSeconds];
        let paramIndex = 4;

        if (input.title !== undefined) { updates.push(`title = $${paramIndex++}`); params.push(input.title); }
        if (input.intro !== undefined) { updates.push(`intro = $${paramIndex++}`); params.push(input.intro); }
        if (input.body !== undefined) { updates.push(`body = $${paramIndex++}`); params.push(input.body); }
        if (input.cta !== undefined) { updates.push(`cta = $${paramIndex++}`); params.push(input.cta); }
        if (input.outro !== undefined) { updates.push(`outro = $${paramIndex++}`); params.push(input.outro); }
        if (input.status !== undefined) { updates.push(`status = $${paramIndex++}`); params.push(input.status); }

        params.push(id, userId);
        const result = await query(
            `UPDATE scripts SET ${updates.join(', ')} WHERE id = $${paramIndex++} AND user_id = $${paramIndex} RETURNING *`,
            params
        );

        if (result.rows.length === 0) return null;
        return result.rows[0] as ScriptRow;
    }

    async delete(id: string, userId: string): Promise<boolean> {
        const result = await query(
            'DELETE FROM scripts WHERE id = $1 AND user_id = $2 RETURNING id',
            [id, userId]
        );

        return result.rows.length > 0;
    }
}
