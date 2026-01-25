// application/usecases/idea/UpdateIdeaUseCase.ts
// Use Case: Update an existing idea

import { IdeaRepository } from '@/domain/repositories/IdeaRepository';
import { Idea, UpdateIdeaInput } from '@/domain/entities/Idea';
import { isValidIdeaStatus } from '@/domain/value-objects/IdeaStatus';

export interface UpdateIdeaRequest {
    ideaId: string;
    userId: string;
    updates: UpdateIdeaInput;
}

export class UpdateIdeaUseCase {
    constructor(private ideaRepository: IdeaRepository) { }

    async execute(request: UpdateIdeaRequest): Promise<Idea> {
        const { ideaId, userId, updates } = request;

        // Validate status if provided
        if (updates.status && !isValidIdeaStatus(updates.status)) {
            throw new Error(`Invalid status: ${updates.status}`);
        }

        // Validate priority if provided
        if (updates.priority !== undefined && (updates.priority < 0 || updates.priority > 10)) {
            throw new Error('Priority must be between 0 and 10');
        }

        // Validate title if provided
        if (updates.title !== undefined && !updates.title.trim()) {
            throw new Error('Title cannot be empty');
        }

        // Update through repository
        const idea = await this.ideaRepository.update(ideaId, userId, updates);

        if (!idea) {
            throw new Error('Idea not found or access denied');
        }

        return idea;
    }
}
