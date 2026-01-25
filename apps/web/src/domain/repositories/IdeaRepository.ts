// domain/repositories/IdeaRepository.ts
// Interface for Idea persistence - Dependency Inversion

import { Idea, CreateIdeaInput, UpdateIdeaInput } from '../entities/Idea';
import { IdeaStatus } from '../value-objects/IdeaStatus';

export interface IdeaFilters {
    status?: IdeaStatus;
    channelId?: string;
}

export interface IdeaRepository {
    /**
     * Find an idea by its unique ID
     */
    findById(id: string): Promise<Idea | null>;

    /**
     * Find all ideas for a specific user
     */
    findByUser(userId: string, filters?: IdeaFilters): Promise<Idea[]>;

    /**
     * Create a new idea
     */
    create(input: CreateIdeaInput): Promise<Idea>;

    /**
     * Update an existing idea
     */
    update(id: string, userId: string, input: UpdateIdeaInput): Promise<Idea | null>;

    /**
     * Delete an idea
     */
    delete(id: string, userId: string): Promise<boolean>;

    /**
     * Count ideas by status for a user
     */
    countByStatus(userId: string): Promise<Record<IdeaStatus, number>>;
}
