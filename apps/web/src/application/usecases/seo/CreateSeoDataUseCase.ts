// application/usecases/seo/CreateSeoDataUseCase.ts
// Use Case: Create SEO data

import { SeoRepository, SeoRow } from '@/domain/repositories/SeoRepository';
import { SeoScoreService } from '@/application/services/SeoScoreService';

export interface CreateSeoDataRequest {
    userId: string;
    videoId: string;
    optimizedTitle: string;
    description?: string;
    tags?: string[];
    keywords?: string[];
}

export class CreateSeoDataUseCase {
    constructor(
        private seoRepository: SeoRepository,
        private scoreService: SeoScoreService
    ) { }

    async execute(request: CreateSeoDataRequest): Promise<SeoRow> {
        const score = this.scoreService.calculate(request.optimizedTitle, request.description, request.tags);

        return this.seoRepository.create({
            userId: request.userId,
            videoId: request.videoId,
            optimizedTitle: request.optimizedTitle,
            description: request.description,
            tags: request.tags,
            keywords: request.keywords,
            score,
        });
    }
}
