// application/usecases/production/CreateProductionUseCase.ts
// Use Case: Create a new production

import { ProductionRepository } from '@/domain/repositories/ProductionRepository';
import { Production, CreateProductionInput } from '@/domain/entities/Production';

export interface CreateProductionRequest {
    userId: string;
    title: string;
    description?: string;
    channelId?: string;
    ideaId?: string;
    priority?: number;
    targetDate?: string;
}

export class CreateProductionUseCase {
    constructor(private productionRepository: ProductionRepository) { }

    async execute(request: CreateProductionRequest): Promise<Production> {
        // Validate business rules
        if (!request.title.trim()) {
            throw new Error('Title cannot be empty');
        }

        if (request.priority !== undefined && (request.priority < 0 || request.priority > 10)) {
            throw new Error('Priority must be between 0 and 10');
        }

        // Parse target date if provided
        let targetDate: Date | null = null;
        if (request.targetDate) {
            targetDate = new Date(request.targetDate);
            if (isNaN(targetDate.getTime())) {
                throw new Error('Invalid target date format');
            }
        }

        // Create production
        const production = await this.productionRepository.create({
            userId: request.userId,
            title: request.title.trim(),
            description: request.description,
            channelId: request.channelId,
            ideaId: request.ideaId,
            priority: request.priority ?? 0,
            targetDate,
        });

        return production;
    }
}
