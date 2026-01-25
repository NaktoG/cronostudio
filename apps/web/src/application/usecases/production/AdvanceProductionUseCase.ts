// application/usecases/production/AdvanceProductionUseCase.ts
// Use Case: Advance production to next pipeline stage

import { ProductionRepository } from '@/domain/repositories/ProductionRepository';
import { Production } from '@/domain/entities/Production';
import { getNextProductionStatus } from '@/domain/value-objects/ProductionStatus';

export interface AdvanceProductionRequest {
    productionId: string;
    userId: string;
}

export class AdvanceProductionUseCase {
    constructor(private productionRepository: ProductionRepository) { }

    async execute(request: AdvanceProductionRequest): Promise<Production> {
        const { productionId, userId } = request;

        // Get current production
        const current = await this.productionRepository.findById(productionId);

        if (!current) {
            throw new Error('Production not found');
        }

        if (current.userId !== userId) {
            throw new Error('Access denied');
        }

        // Check if can advance
        const nextStatus = getNextProductionStatus(current.status);
        if (!nextStatus) {
            throw new Error(`Cannot advance from status: ${current.status}`);
        }

        // Advance using repository
        const production = await this.productionRepository.advanceStatus(productionId, userId);

        if (!production) {
            throw new Error('Failed to advance production status');
        }

        return production;
    }
}
