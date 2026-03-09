// infrastructure/repositories/PostgresProductionThumbnailSync.ts
// SQL implementation for production thumbnail updates

import { query } from '@/lib/db';
import { ProductionThumbnailSync } from '@/application/services/ProductionThumbnailSyncService';

export class PostgresProductionThumbnailSync implements ProductionThumbnailSync {
    async linkByScript(userId: string, scriptId: string, thumbnailId: string): Promise<void> {
        await query(
            `UPDATE productions
             SET thumbnail_id = $1, updated_at = NOW()
             WHERE script_id = $2 AND user_id = $3`,
            [thumbnailId, scriptId, userId]
        );
    }

    async linkByVideo(userId: string, videoId: string, thumbnailId: string): Promise<void> {
        await query(
            `UPDATE productions
             SET thumbnail_id = $1, updated_at = NOW()
             WHERE video_id = $2 AND user_id = $3`,
            [thumbnailId, videoId, userId]
        );
    }

    async publishByScript(userId: string, scriptId: string, thumbnailId: string): Promise<void> {
        await query(
            `UPDATE productions
             SET thumbnail_id = $1, status = 'publishing', updated_at = NOW()
             WHERE script_id = $2 AND user_id = $3`,
            [thumbnailId, scriptId, userId]
        );
    }

    async publishByVideo(userId: string, videoId: string, thumbnailId: string): Promise<void> {
        await query(
            `UPDATE productions
             SET thumbnail_id = $1, status = 'publishing', updated_at = NOW()
             WHERE video_id = $2 AND user_id = $3`,
            [thumbnailId, videoId, userId]
        );
    }
}
