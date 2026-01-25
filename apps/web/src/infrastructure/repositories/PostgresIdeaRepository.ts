// infrastructure/repositories/PostgresIdeaRepository.ts
// Implementation of IdeaRepository using PostgreSQL

import { query } from '@/lib/db';
import { IdeaRepository, IdeaFilters } from '@/domain/repositories/IdeaRepository';
import { Idea, CreateIdeaInput, UpdateIdeaInput } from '@/domain/entities/Idea';
import { IdeaStatus, IDEA_STATUSES } from '@/domain/value-objects/IdeaStatus';

export class PostgresIdeaRepository implements IdeaRepository {

    async findById(id: string): Promise<Idea | null> {
        const result = await query(
            'SELECT * FROM ideas WHERE id = $1',
            [id]
        );

        if (result.rows.length === 0) return null;
        return this.toDomain(result.rows[0]);
    }

    async findByUser(userId: string, filters?: IdeaFilters): Promise<Idea[]> {
        let queryText = `
      SELECT i.*, c.name as channel_name 
      FROM ideas i 
      LEFT JOIN channels c ON i.channel_id = c.id 
      WHERE i.user_id = $1
    `;
        const params: (string | null)[] = [userId];
        let paramIndex = 2;

        if (filters?.status) {
            queryText += ` AND i.status = $${paramIndex}`;
            params.push(filters.status);
            paramIndex++;
        }

        if (filters?.channelId) {
            queryText += ` AND i.channel_id = $${paramIndex}`;
            params.push(filters.channelId);
        }

        queryText += ' ORDER BY i.priority DESC, i.created_at DESC';

        const result = await query(queryText, params);
        return result.rows.map(row => this.toDomain(row));
    }

    async create(input: CreateIdeaInput): Promise<Idea> {
        const result = await query(
            `INSERT INTO ideas (user_id, channel_id, title, description, priority, tags, source)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
            [
                input.userId,
                input.channelId ?? null,
                input.title,
                input.description ?? null,
                input.priority ?? 0,
                input.tags ?? [],
                input.source ?? 'manual'
            ]
        );

        return this.toDomain(result.rows[0]);
    }

    async update(id: string, userId: string, input: UpdateIdeaInput): Promise<Idea | null> {
        const updates: string[] = [];
        const params: (string | number | string[] | null)[] = [];
        let paramIndex = 1;

        const fieldMap: Record<string, string> = {
            title: 'title',
            description: 'description',
            status: 'status',
            priority: 'priority',
            tags: 'tags',
        };

        for (const [key, dbColumn] of Object.entries(fieldMap)) {
            const value = input[key as keyof UpdateIdeaInput];
            if (value !== undefined) {
                updates.push(`${dbColumn} = $${paramIndex++}`);
                params.push(value as string | number | string[] | null);
            }
        }

        if (updates.length === 0) return null;

        params.push(id, userId);

        const result = await query(
            `UPDATE ideas SET ${updates.join(', ')}, updated_at = NOW() 
       WHERE id = $${paramIndex++} AND user_id = $${paramIndex} 
       RETURNING *`,
            params
        );

        if (result.rows.length === 0) return null;
        return this.toDomain(result.rows[0]);
    }

    async delete(id: string, userId: string): Promise<boolean> {
        const result = await query(
            'DELETE FROM ideas WHERE id = $1 AND user_id = $2 RETURNING id',
            [id, userId]
        );
        return result.rows.length > 0;
    }

    async countByStatus(userId: string): Promise<Record<IdeaStatus, number>> {
        const result = await query(
            `SELECT status, COUNT(*) as count 
       FROM ideas 
       WHERE user_id = $1 
       GROUP BY status`,
            [userId]
        );

        // Initialize all statuses with 0
        const counts = IDEA_STATUSES.reduce((acc, status) => {
            acc[status] = 0;
            return acc;
        }, {} as Record<IdeaStatus, number>);

        // Fill with actual counts
        for (const row of result.rows) {
            if (row.status in counts) {
                counts[row.status as IdeaStatus] = parseInt(row.count, 10);
            }
        }

        return counts;
    }

    private toDomain(row: Record<string, unknown>): Idea {
        return {
            id: row.id as string,
            userId: row.user_id as string,
            channelId: row.channel_id as string | null,
            title: row.title as string,
            description: row.description as string | null,
            status: row.status as IdeaStatus,
            priority: row.priority as number,
            tags: row.tags as string[],
            aiScore: row.ai_score as number | null,
            source: row.source as string,
            createdAt: new Date(row.created_at as string),
            updatedAt: new Date(row.updated_at as string),
        };
    }
}
