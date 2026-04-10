// application/usecases/seo/ListSeoDataUseCase.ts
// Use Case: List SEO data for a user with filters

import { SeoRepository, SeoFilters, SeoRow } from '@/domain/repositories/SeoRepository';

export interface ListSeoDataRequest {
    userId: string;
    filters?: SeoFilters;
}

export class ListSeoDataUseCase {
    constructor(private seoRepository: SeoRepository) { }

    async execute(request: ListSeoDataRequest): Promise<SeoRow[]> {
        return this.seoRepository.listByUser(request.userId, request.filters);
    }
}
