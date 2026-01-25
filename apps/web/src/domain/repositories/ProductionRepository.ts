// domain/repositories/ProductionRepository.ts
// Interface for Production persistence - Dependency Inversion

import { Production, CreateProductionInput, UpdateProductionInput } from '../entities/Production';
import { ProductionStatus } from '../value-objects/ProductionStatus';

export interface ProductionFilters {
    status?: ProductionStatus;
    channelId?: string;
}

export interface PipelineStats {
    idea: number;
    scripting: number;
    recording: number;
    editing: number;
    shorts: number;
    publishing: number;
    published: number;
}

export interface ProductionRepository {
    /**
     * Find a production by its unique ID
     */
    findById(id: string): Promise<Production | null>;

    /**
     * Find all productions for a specific user
     */
    findByUser(userId: string, filters?: ProductionFilters): Promise<Production[]>;

    /**
     * Create a new production
     */
    create(input: CreateProductionInput): Promise<Production>;

    /**
     * Update an existing production
     */
    update(id: string, userId: string, input: UpdateProductionInput): Promise<Production | null>;

    /**
     * Delete a production
     */
    delete(id: string, userId: string): Promise<boolean>;

    /**
     * Get pipeline statistics for a user
     */
    getPipelineStats(userId: string): Promise<PipelineStats>;

    /**
     * Move production to next pipeline stage
     */
    advanceStatus(id: string, userId: string): Promise<Production | null>;
}
