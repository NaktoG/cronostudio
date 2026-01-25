// application/usecases/production/ListProductionsUseCase.ts
// Use Case: List productions with pipeline stats

import { ProductionRepository, ProductionFilters, PipelineStats } from '@/domain/repositories/ProductionRepository';
import { Production } from '@/domain/entities/Production';

export interface ListProductionsRequest {
    userId: string;
    filters?: ProductionFilters;
    includeStats?: boolean;
}

export interface ListProductionsResponse {
    productions: Production[];
    total: number;
    pipeline?: PipelineStats;
}

export class ListProductionsUseCase {
    constructor(private productionRepository: ProductionRepository) { }

    async execute(request: ListProductionsRequest): Promise<ListProductionsResponse> {
        const productions = await this.productionRepository.findByUser(
            request.userId,
            request.filters
        );

        const response: ListProductionsResponse = {
            productions,
            total: productions.length,
        };

        // Include pipeline stats if requested
        if (request.includeStats) {
            response.pipeline = await this.productionRepository.getPipelineStats(request.userId);
        }

        return response;
    }
}
