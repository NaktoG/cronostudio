// application/usecases/production/PublishProductionUseCase.ts
// Use Case: Mark a production as published

import { ProductionPublishService } from '@/application/services/ProductionPublishService';

export interface PublishProductionRequest {
    userId: string;
    productionId: string;
    publishedUrl?: string | null;
    platformId?: string | null;
    platform?: string | null;
}

export interface PublishProductionResponse {
    productionId: string;
    title: string;
    publishedAt: string;
    publishedUrl: string | null;
    platformId: string | null;
}

export class PublishProductionUseCase {
    constructor(private service: ProductionPublishService) { }

    async execute(request: PublishProductionRequest): Promise<PublishProductionResponse | null> {
        const result = await this.service.publish({
            userId: request.userId,
            productionId: request.productionId,
            publishedUrl: request.publishedUrl ?? null,
            platformId: request.platformId ?? null,
            platform: request.platform ?? 'youtube',
        });

        if (!result) return null;

        return {
            productionId: result.productionId,
            title: result.title,
            publishedAt: result.publishedAt,
            publishedUrl: result.publishedUrl,
            platformId: result.platformId,
        };
    }
}
