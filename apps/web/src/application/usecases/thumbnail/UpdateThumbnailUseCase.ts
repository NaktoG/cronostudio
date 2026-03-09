// application/usecases/thumbnail/UpdateThumbnailUseCase.ts
// Use Case: Update an existing thumbnail

import { ThumbnailRepository, ThumbnailRow, ThumbnailStatus } from '@/domain/repositories/ThumbnailRepository';
import { ProductionThumbnailSyncService } from '@/application/services/ProductionThumbnailSyncService';

export interface UpdateThumbnailRequest {
    userId: string;
    thumbnailId: string;
    title?: string;
    notes?: string;
    imageUrl?: string;
    status?: ThumbnailStatus;
}

export class UpdateThumbnailUseCase {
    constructor(
        private thumbnailRepository: ThumbnailRepository,
        private productionSync: ProductionThumbnailSyncService
    ) { }

    async execute(request: UpdateThumbnailRequest): Promise<ThumbnailRow | null> {
        const updated = await this.thumbnailRepository.update(request.thumbnailId, request.userId, {
            title: request.title,
            notes: request.notes,
            imageUrl: request.imageUrl,
            status: request.status,
        });

        if (!updated) return null;

        if (request.status === 'approved') {
            const thumbnailId = updated.id as string;
            await this.productionSync.publishThumbnail(request.userId, {
                thumbnailId,
                scriptId: updated.script_id as string | null | undefined,
                videoId: updated.video_id as string | null | undefined,
            });
        }

        return updated;
    }
}
