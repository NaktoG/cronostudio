// application/usecases/idea/CreateIdeaUseCase.ts
// Use Case: Create a new idea - Single Responsibility

import { IdeaRepository } from '@/domain/repositories/IdeaRepository';
import { Idea } from '@/domain/entities/Idea';
import { emitMetric } from '@/lib/observability';

export interface CreateIdeaRequest {
    userId: string;
    title: string;
    description?: string;
    channelId?: string;
    priority?: number;
    tags?: string[];
}

export class CreateIdeaUseCase {
    constructor(private ideaRepository: IdeaRepository) { }

    async execute(request: CreateIdeaRequest): Promise<Idea> {
        // Validate business rules
        if (!request.title.trim()) {
            throw new Error('Title cannot be empty');
        }

        if (request.priority !== undefined && (request.priority < 0 || request.priority > 10)) {
            throw new Error('Priority must be between 0 and 10');
        }

        try {
            const idea = await this.ideaRepository.create({
                userId: request.userId,
                title: request.title.trim(),
                description: request.description,
                channelId: request.channelId,
                priority: request.priority ?? 0,
                tags: request.tags ?? [],
            });

            emitMetric({ name: 'idea.created', value: 1 });
            return idea;
        } catch (error) {
            emitMetric({ name: 'idea.create.failure', value: 1 });
            throw error;
        }
    }
}
