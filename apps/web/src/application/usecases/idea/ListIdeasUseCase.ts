// application/usecases/idea/ListIdeasUseCase.ts
// Use Case: List ideas for a user with filters

import { IdeaRepository, IdeaFilters } from '@/domain/repositories/IdeaRepository';
import { Idea } from '@/domain/entities/Idea';

export interface ListIdeasRequest {
    userId: string;
    filters?: IdeaFilters;
}

export interface ListIdeasResponse {
    ideas: Idea[];
    total: number;
}

export class ListIdeasUseCase {
    constructor(private ideaRepository: IdeaRepository) { }

    async execute(request: ListIdeasRequest): Promise<ListIdeasResponse> {
        const ideas = await this.ideaRepository.findByUser(request.userId, request.filters);

        return {
            ideas,
            total: ideas.length,
        };
    }
}
