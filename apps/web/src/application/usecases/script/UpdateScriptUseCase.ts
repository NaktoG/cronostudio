// application/usecases/script/UpdateScriptUseCase.ts
// Use Case: Update an existing script

import { ScriptRepository, ScriptRow, ScriptContentSnapshot } from '@/domain/repositories/ScriptRepository';
import { ScriptMetricsService } from '@/application/services/ScriptMetricsService';

export interface UpdateScriptRequest {
    userId: string;
    scriptId: string;
    title?: string;
    intro?: string;
    body?: string;
    cta?: string;
    outro?: string;
    status?: 'draft' | 'review' | 'approved' | 'recorded';
}

export class UpdateScriptUseCase {
    constructor(
        private scriptRepository: ScriptRepository,
        private metricsService: ScriptMetricsService
    ) { }

    async execute(request: UpdateScriptRequest): Promise<ScriptRow | null> {
        const current = await this.scriptRepository.findContentById(request.scriptId, request.userId);
        if (!current) return null;

        const merged = this.mergeContent(current, request);
        const metrics = this.metricsService.calculate(merged.intro, merged.body, merged.cta, merged.outro);

        return this.scriptRepository.update(request.scriptId, request.userId, {
            title: request.title,
            intro: request.intro,
            body: request.body,
            cta: request.cta,
            outro: request.outro,
            status: request.status,
            fullContent: metrics.fullContent,
            wordCount: metrics.wordCount,
            estimatedDurationSeconds: metrics.estimatedDurationSeconds,
        });
    }

    private mergeContent(current: ScriptContentSnapshot, request: UpdateScriptRequest) {
        return {
            intro: request.intro ?? current.intro,
            body: request.body ?? current.body,
            cta: request.cta ?? current.cta,
            outro: request.outro ?? current.outro,
        };
    }
}
