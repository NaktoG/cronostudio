// domain/repositories/ScriptRepository.ts
// Interface for Script persistence

export type ScriptStatus = 'draft' | 'review' | 'approved' | 'recorded';

export interface ScriptFilters {
    status?: ScriptStatus;
    ideaId?: string;
    channelId?: string;
}

export interface ScriptCreateInput {
    userId: string;
    title: string;
    ideaId?: string | null;
    intro?: string | null;
    body?: string | null;
    cta?: string | null;
    outro?: string | null;
    fullContent: string;
    wordCount: number;
    estimatedDurationSeconds: number;
}

export interface ScriptUpdateInput {
    title?: string;
    intro?: string | null;
    body?: string | null;
    cta?: string | null;
    outro?: string | null;
    status?: ScriptStatus;
    fullContent: string;
    wordCount: number;
    estimatedDurationSeconds: number;
}

export type ScriptContentSnapshot = {
    intro: string | null;
    body: string | null;
    cta: string | null;
    outro: string | null;
};

export type ScriptRow = Record<string, unknown>;

export interface ScriptRepository {
    listByUser(userId: string, filters?: ScriptFilters): Promise<ScriptRow[]>;
    create(input: ScriptCreateInput): Promise<ScriptRow>;
    findContentById(id: string, userId: string): Promise<ScriptContentSnapshot | null>;
    update(id: string, userId: string, input: ScriptUpdateInput): Promise<ScriptRow | null>;
    delete(id: string, userId: string): Promise<boolean>;
}
