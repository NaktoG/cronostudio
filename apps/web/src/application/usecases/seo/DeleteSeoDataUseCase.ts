// application/usecases/seo/DeleteSeoDataUseCase.ts
// Use Case: Delete SEO data

import { SeoRepository } from '@/domain/repositories/SeoRepository';

export interface DeleteSeoDataRequest {
    userId: string;
    seoId: string;
}

export class DeleteSeoDataUseCase {
    constructor(private seoRepository: SeoRepository) { }

    async execute(request: DeleteSeoDataRequest): Promise<boolean> {
        return this.seoRepository.delete(request.seoId, request.userId);
    }
}
