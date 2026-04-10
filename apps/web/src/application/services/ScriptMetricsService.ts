// application/services/ScriptMetricsService.ts
// Calculates script metrics based on content sections

export type ScriptMetrics = {
    fullContent: string;
    wordCount: number;
    estimatedDurationSeconds: number;
};

export class ScriptMetricsService {
    calculate(intro?: string | null, body?: string | null, cta?: string | null, outro?: string | null): ScriptMetrics {
        const fullContent = [intro, body, cta, outro].filter(Boolean).join('\n\n');
        const wordCount = fullContent.split(/\s+/).filter(Boolean).length;
        const estimatedDurationSeconds = Math.ceil((wordCount / 150) * 60);
        return { fullContent, wordCount, estimatedDurationSeconds };
    }
}
