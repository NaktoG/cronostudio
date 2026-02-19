// domain/entities/Production.ts
// Production entity - Content production pipeline

import { ProductionStatus } from '../value-objects/ProductionStatus';

export interface Production {
    readonly id: string;
    readonly userId: string;
    readonly channelId: string | null;
    readonly ideaId: string | null;
    readonly title: string;
    readonly description: string | null;
    readonly status: ProductionStatus;
    readonly priority: number;
    readonly targetDate: Date | null;
    readonly scheduledPublishAt: Date | null;
    readonly publishedAt: Date | null;
    readonly scriptStatus: string | null;
    readonly thumbnailStatus: string | null;
    readonly seoScore: number | null;
    readonly shortsCount: number;
    readonly shortsPublished: number;
    readonly postsCount: number;
    readonly postsPublished: number;
    readonly createdAt: Date;
    readonly updatedAt: Date;
}

export interface CreateProductionInput {
    userId: string;
    title: string;
    description?: string | null;
    channelId?: string | null;
    ideaId?: string | null;
    priority?: number;
    targetDate?: Date | null;
    scheduledPublishAt?: Date | null;
}

export interface UpdateProductionInput {
    title?: string;
    description?: string | null;
    status?: ProductionStatus;
    priority?: number;
    targetDate?: Date | null;
    scheduledPublishAt?: Date | null;
    scriptStatus?: string | null;
    thumbnailStatus?: string | null;
    seoScore?: number | null;
}

// Factory function
export function createProduction(input: CreateProductionInput): Omit<Production, 'id' | 'createdAt' | 'updatedAt'> {
    return {
        userId: input.userId,
        channelId: input.channelId ?? null,
        ideaId: input.ideaId ?? null,
        title: input.title,
        description: input.description ?? null,
        status: 'idea',
        priority: input.priority ?? 0,
        targetDate: input.targetDate ?? null,
        scheduledPublishAt: input.scheduledPublishAt ?? null,
        publishedAt: null,
        scriptStatus: null,
        thumbnailStatus: null,
        seoScore: null,
        shortsCount: 0,
        shortsPublished: 0,
        postsCount: 0,
        postsPublished: 0,
    };
}
