// application/usecases/thumbnail/CreateThumbnailUseCase.ts
// Use Case: Create a new thumbnail

import { ThumbnailRepository, ThumbnailRow } from '@/domain/repositories/ThumbnailRepository';
import { ProductionThumbnailSyncService } from '@/application/services/ProductionThumbnailSyncService';

export interface CreateThumbnailRequest {
    userId: string;
    title: string;
    notes?: string;
    imageUrl?: string;
    scriptId?: string;
    videoId?: string;
}

export class CreateThumbnailUseCase {
    constructor(
        private thumbnailRepository: ThumbnailRepository,
        private productionSync: ProductionThumbnailSyncService
    ) { }

    async execute(request: CreateThumbnailRequest): Promise<ThumbnailRow> {
        const created = await this.thumbnailRepository.create({
            userId: request.userId,
            scriptId: request.scriptId,
            videoId: request.videoId,
            title: request.title,
            notes: request.notes,
            imageUrl: request.imageUrl,
        });

        const thumbnailId = created.id as string | undefined;
        if (thumbnailId) {
            await this.productionSync.linkThumbnail(request.userId, {
                thumbnailId,
                scriptId: request.scriptId,
                videoId: request.videoId,
            });
        }

        return created;
    }
}
