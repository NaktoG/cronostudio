// application/usecases/thumbnail/DeleteThumbnailUseCase.ts
// Use Case: Delete a thumbnail

import { ThumbnailRepository } from '@/domain/repositories/ThumbnailRepository';

export interface DeleteThumbnailRequest {
    userId: string;
    thumbnailId: string;
}

export class DeleteThumbnailUseCase {
    constructor(private thumbnailRepository: ThumbnailRepository) { }

    async execute(request: DeleteThumbnailRequest): Promise<boolean> {
        return this.thumbnailRepository.delete(request.thumbnailId, request.userId);
    }
}
