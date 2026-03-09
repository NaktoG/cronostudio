// application/usecases/script/ListScriptsUseCase.ts
// Use Case: List scripts for a user with filters

import { ScriptRepository, ScriptFilters, ScriptRow } from '@/domain/repositories/ScriptRepository';

export interface ListScriptsRequest {
    userId: string;
    filters?: ScriptFilters;
}

export class ListScriptsUseCase {
    constructor(private scriptRepository: ScriptRepository) { }

    async execute(request: ListScriptsRequest): Promise<ScriptRow[]> {
        return this.scriptRepository.listByUser(request.userId, request.filters);
    }
}
