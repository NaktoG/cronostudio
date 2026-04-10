// application/usecases/thumbnail/ListThumbnailsUseCase.ts
// Use Case: List thumbnails for a user with filters

import { ThumbnailRepository, ThumbnailFilters, ThumbnailRow } from '@/domain/repositories/ThumbnailRepository';

export interface ListThumbnailsRequest {
    userId: string;
    filters?: ThumbnailFilters;
}

export class ListThumbnailsUseCase {
    constructor(private thumbnailRepository: ThumbnailRepository) { }

    async execute(request: ListThumbnailsRequest): Promise<ThumbnailRow[]> {
        return this.thumbnailRepository.listByUser(request.userId, request.filters);
    }
}
