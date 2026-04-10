// domain/repositories/SeoRepository.ts
// Interface for SEO data persistence

export interface SeoFilters {
    videoId?: string;
    channelId?: string;
}

export interface SeoCreateInput {
    userId: string;
    videoId: string;
    optimizedTitle: string;
    description?: string | null;
    tags?: string[];
    keywords?: string[];
    score: number;
}

export interface SeoUpdateInput {
    optimizedTitle?: string;
    description?: string | null;
    tags?: string[];
    keywords?: string[];
    score: number;
}

export type SeoRow = Record<string, unknown>;

export interface SeoRepository {
    listByUser(userId: string, filters?: SeoFilters): Promise<SeoRow[]>;
    findById(id: string, userId: string): Promise<SeoRow | null>;
    create(input: SeoCreateInput): Promise<SeoRow>;
    update(id: string, userId: string, input: SeoUpdateInput): Promise<SeoRow | null>;
    delete(id: string, userId: string): Promise<boolean>;
}
