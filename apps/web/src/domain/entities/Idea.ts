// domain/entities/Idea.ts
// Idea entity - Content idea representation

import { IdeaStatus } from '../value-objects/IdeaStatus';

export interface Idea {
    readonly id: string;
    readonly userId: string;
    readonly channelId: string | null;
    readonly title: string;
    readonly description: string | null;
    readonly status: IdeaStatus;
    readonly priority: number;
    readonly tags: string[];
    readonly aiScore: number | null;
    readonly source: string;
    readonly createdAt: Date;
    readonly updatedAt: Date;
}

export interface CreateIdeaInput {
    userId: string;
    title: string;
    description?: string | null;
    channelId?: string | null;
    priority?: number;
    tags?: string[];
    source?: string;
}

export interface UpdateIdeaInput {
    title?: string;
    description?: string | null;
    status?: IdeaStatus;
    priority?: number;
    tags?: string[];
}

// Factory function to create a new Idea
export function createIdea(input: CreateIdeaInput): Omit<Idea, 'id' | 'createdAt' | 'updatedAt'> {
    return {
        userId: input.userId,
        channelId: input.channelId ?? null,
        title: input.title,
        description: input.description ?? null,
        status: 'draft',
        priority: input.priority ?? 0,
        tags: input.tags ?? [],
        aiScore: null,
        source: input.source ?? 'manual',
    };
}
