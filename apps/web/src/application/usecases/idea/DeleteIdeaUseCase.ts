// application/usecases/idea/DeleteIdeaUseCase.ts
// Use Case: Delete an idea

import { IdeaRepository } from '@/domain/repositories/IdeaRepository';

export interface DeleteIdeaRequest {
    ideaId: string;
    userId: string;
}

export class DeleteIdeaUseCase {
    constructor(private ideaRepository: IdeaRepository) { }

    async execute(request: DeleteIdeaRequest): Promise<void> {
        const { ideaId, userId } = request;

        const deleted = await this.ideaRepository.delete(ideaId, userId);

        if (!deleted) {
            throw new Error('Idea not found or access denied');
        }
    }
}
