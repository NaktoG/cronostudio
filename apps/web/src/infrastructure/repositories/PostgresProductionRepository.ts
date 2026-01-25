// infrastructure/repositories/PostgresProductionRepository.ts
// Implementation of ProductionRepository using PostgreSQL

import { query } from '@/lib/db';
import { ProductionRepository, ProductionFilters, PipelineStats } from '@/domain/repositories/ProductionRepository';
import { Production, CreateProductionInput, UpdateProductionInput } from '@/domain/entities/Production';
import { ProductionStatus, PRODUCTION_STATUSES, getNextProductionStatus } from '@/domain/value-objects/ProductionStatus';

export class PostgresProductionRepository implements ProductionRepository {

    async findById(id: string): Promise<Production | null> {
        const result = await query(
            'SELECT * FROM productions WHERE id = $1',
            [id]
        );

        if (result.rows.length === 0) return null;
        return this.toDomain(result.rows[0]);
    }

    async findByUser(userId: string, filters?: ProductionFilters): Promise<Production[]> {
        let queryText = `
      SELECT p.*, c.name as channel_name 
      FROM productions p 
      LEFT JOIN channels c ON p.channel_id = c.id 
      WHERE p.user_id = $1
    `;
        const params: (string | null)[] = [userId];
        let paramIndex = 2;

        if (filters?.status) {
            queryText += ` AND p.status = $${paramIndex}`;
            params.push(filters.status);
            paramIndex++;
        }

        if (filters?.channelId) {
            queryText += ` AND p.channel_id = $${paramIndex}`;
            params.push(filters.channelId);
        }

        queryText += ' ORDER BY p.priority DESC, p.updated_at DESC';

        const result = await query(queryText, params);
        return result.rows.map(row => this.toDomain(row));
    }

    async create(input: CreateProductionInput): Promise<Production> {
        const result = await query(
            `INSERT INTO productions (user_id, channel_id, idea_id, title, description, priority, target_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
            [
                input.userId,
                input.channelId ?? null,
                input.ideaId ?? null,
                input.title,
                input.description ?? null,
                input.priority ?? 0,
                input.targetDate ?? null
            ]
        );

        return this.toDomain(result.rows[0]);
    }

    async update(id: string, userId: string, input: UpdateProductionInput): Promise<Production | null> {
        const updates: string[] = [];
        const params: (string | number | null)[] = [];
        let paramIndex = 1;

        const fieldMap: Record<string, string> = {
            title: 'title',
            description: 'description',
            status: 'status',
            priority: 'priority',
            targetDate: 'target_date',
            scriptStatus: 'script_status',
            thumbnailStatus: 'thumbnail_status',
            seoScore: 'seo_score',
        };

        for (const [key, dbColumn] of Object.entries(fieldMap)) {
            const value = input[key as keyof UpdateProductionInput];
            if (value !== undefined) {
                updates.push(`${dbColumn} = $${paramIndex++}`);
                params.push(value as string | number | null);
            }
        }

        // Auto-set published_at when status changes to published
        if (input.status === 'published') {
            updates.push('published_at = NOW()');
        }

        if (updates.length === 0) return null;

        params.push(id, userId);

        const result = await query(
            `UPDATE productions SET ${updates.join(', ')}, updated_at = NOW() 
       WHERE id = $${paramIndex++} AND user_id = $${paramIndex} 
       RETURNING *`,
            params
        );

        if (result.rows.length === 0) return null;
        return this.toDomain(result.rows[0]);
    }

    async delete(id: string, userId: string): Promise<boolean> {
        const result = await query(
            'DELETE FROM productions WHERE id = $1 AND user_id = $2 RETURNING id',
            [id, userId]
        );
        return result.rows.length > 0;
    }

    async getPipelineStats(userId: string): Promise<PipelineStats> {
        const result = await query(
            `SELECT status, COUNT(*) as count 
       FROM productions 
       WHERE user_id = $1 
       GROUP BY status`,
            [userId]
        );

        // Initialize all statuses with 0
        const stats: PipelineStats = {
            idea: 0,
            scripting: 0,
            recording: 0,
            editing: 0,
            shorts: 0,
            publishing: 0,
            published: 0,
        };

        // Fill with actual counts
        for (const row of result.rows) {
            const status = row.status as ProductionStatus;
            if (status in stats) {
                stats[status] = parseInt(row.count, 10);
            }
        }

        return stats;
    }

    async advanceStatus(id: string, userId: string): Promise<Production | null> {
        // Get current production
        const current = await this.findById(id);
        if (!current || current.userId !== userId) return null;

        const nextStatus = getNextProductionStatus(current.status);
        if (!nextStatus) return null;

        return this.update(id, userId, { status: nextStatus });
    }

    private toDomain(row: Record<string, unknown>): Production {
        return {
            id: row.id as string,
            userId: row.user_id as string,
            channelId: row.channel_id as string | null,
            ideaId: row.idea_id as string | null,
            title: row.title as string,
            description: row.description as string | null,
            status: row.status as ProductionStatus,
            priority: row.priority as number,
            targetDate: row.target_date ? new Date(row.target_date as string) : null,
            publishedAt: row.published_at ? new Date(row.published_at as string) : null,
            scriptStatus: row.script_status as string | null,
            thumbnailStatus: row.thumbnail_status as string | null,
            seoScore: row.seo_score as number | null,
            shortsCount: (row.shorts_count as number) ?? 0,
            shortsPublished: (row.shorts_published as number) ?? 0,
            postsCount: (row.posts_count as number) ?? 0,
            postsPublished: (row.posts_published as number) ?? 0,
            createdAt: new Date(row.created_at as string),
            updatedAt: new Date(row.updated_at as string),
        };
    }
}
