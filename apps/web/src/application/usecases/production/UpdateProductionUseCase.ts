// application/usecases/production/UpdateProductionUseCase.ts
// Use Case: Update production status and data

import { ProductionRepository } from '@/domain/repositories/ProductionRepository';
import { Production, UpdateProductionInput } from '@/domain/entities/Production';
import { isValidProductionStatus } from '@/domain/value-objects/ProductionStatus';

export interface UpdateProductionRequest {
    productionId: string;
    userId: string;
    updates: UpdateProductionInput;
}

export class UpdateProductionUseCase {
    constructor(private productionRepository: ProductionRepository) { }

    async execute(request: UpdateProductionRequest): Promise<Production> {
        const { productionId, userId, updates } = request;

        // Validate status if provided
        if (updates.status && !isValidProductionStatus(updates.status)) {
            throw new Error(`Invalid status: ${updates.status}`);
        }

        // Validate priority
        if (updates.priority !== undefined && (updates.priority < 0 || updates.priority > 10)) {
            throw new Error('Priority must be between 0 and 10');
        }

        // Validate SEO score
        if (updates.seoScore !== undefined && (updates.seoScore < 0 || updates.seoScore > 100)) {
            throw new Error('SEO score must be between 0 and 100');
        }

        const production = await this.productionRepository.update(productionId, userId, updates);

        if (!production) {
            throw new Error('Production not found or access denied');
        }

        return production;
    }
}
