// application/usecases/seo/UpdateSeoDataUseCase.ts
// Use Case: Update SEO data

import { SeoRepository, SeoRow } from '@/domain/repositories/SeoRepository';
import { SeoScoreService } from '@/application/services/SeoScoreService';

export interface UpdateSeoDataRequest {
    userId: string;
    seoId: string;
    optimizedTitle?: string;
    description?: string;
    tags?: string[];
    keywords?: string[];
    score?: number;
}

export class UpdateSeoDataUseCase {
    constructor(
        private seoRepository: SeoRepository,
        private scoreService: SeoScoreService
    ) { }

    async execute(request: UpdateSeoDataRequest): Promise<SeoRow | null> {
        const current = await this.seoRepository.findById(request.seoId, request.userId);
        if (!current) return null;

        const mergedTitle = request.optimizedTitle ?? (current.optimized_title as string);
        const mergedDescription = request.description ?? (current.description as string | null);
        const mergedTags = request.tags ?? (current.tags as string[] | null) ?? [];
        const nextScore = request.score ?? this.scoreService.calculate(mergedTitle, mergedDescription, mergedTags);

        return this.seoRepository.update(request.seoId, request.userId, {
            optimizedTitle: request.optimizedTitle,
            description: request.description,
            tags: request.tags,
            keywords: request.keywords,
            score: nextScore,
        });
    }
}
