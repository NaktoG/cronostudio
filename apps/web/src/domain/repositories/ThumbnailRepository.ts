// domain/repositories/ThumbnailRepository.ts
// Interface for Thumbnail persistence

export type ThumbnailStatus = 'pending' | 'designing' | 'designed' | 'approved';

export interface ThumbnailFilters {
    status?: ThumbnailStatus;
    channelId?: string;
}

export interface ThumbnailCreateInput {
    userId: string;
    scriptId?: string | null;
    videoId?: string | null;
    title: string;
    notes?: string | null;
    imageUrl?: string | null;
}

export interface ThumbnailUpdateInput {
    title?: string;
    notes?: string | null;
    imageUrl?: string | null;
    status?: ThumbnailStatus;
}

export type ThumbnailRow = Record<string, unknown>;

export interface ThumbnailRepository {
    listByUser(userId: string, filters?: ThumbnailFilters): Promise<ThumbnailRow[]>;
    create(input: ThumbnailCreateInput): Promise<ThumbnailRow>;
    update(id: string, userId: string, input: ThumbnailUpdateInput): Promise<ThumbnailRow | null>;
    delete(id: string, userId: string): Promise<boolean>;
}
