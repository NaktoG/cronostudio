// application/usecases/script/DeleteScriptUseCase.ts
// Use Case: Delete a script

import { ScriptRepository } from '@/domain/repositories/ScriptRepository';

export interface DeleteScriptRequest {
    userId: string;
    scriptId: string;
}

export class DeleteScriptUseCase {
    constructor(private scriptRepository: ScriptRepository) { }

    async execute(request: DeleteScriptRequest): Promise<boolean> {
        return this.scriptRepository.delete(request.scriptId, request.userId);
    }
}
