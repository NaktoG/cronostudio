// application/usecases/script/CreateScriptUseCase.ts
// Use Case: Create a new script

import { ScriptRepository, ScriptRow } from '@/domain/repositories/ScriptRepository';
import { ScriptMetricsService } from '@/application/services/ScriptMetricsService';

export interface CreateScriptRequest {
    userId: string;
    title: string;
    ideaId?: string;
    intro?: string;
    body?: string;
    cta?: string;
    outro?: string;
}

export class CreateScriptUseCase {
    constructor(
        private scriptRepository: ScriptRepository,
        private metricsService: ScriptMetricsService
    ) { }

    async execute(request: CreateScriptRequest): Promise<ScriptRow> {
        const metrics = this.metricsService.calculate(request.intro, request.body, request.cta, request.outro);

        return this.scriptRepository.create({
            userId: request.userId,
            title: request.title,
            ideaId: request.ideaId,
            intro: request.intro,
            body: request.body,
            cta: request.cta,
            outro: request.outro,
            fullContent: metrics.fullContent,
            wordCount: metrics.wordCount,
            estimatedDurationSeconds: metrics.estimatedDurationSeconds,
        });
    }
}
