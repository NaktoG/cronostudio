// application/services/ProductionThumbnailSyncService.ts
// Transitional service to sync thumbnails with productions

export interface ProductionThumbnailSync {
    linkByScript(userId: string, scriptId: string, thumbnailId: string): Promise<void>;
    linkByVideo(userId: string, videoId: string, thumbnailId: string): Promise<void>;
    publishByScript(userId: string, scriptId: string, thumbnailId: string): Promise<void>;
    publishByVideo(userId: string, videoId: string, thumbnailId: string): Promise<void>;
}

export class ProductionThumbnailSyncService {
    constructor(private sync: ProductionThumbnailSync) { }

    async linkThumbnail(userId: string, payload: { scriptId?: string | null; videoId?: string | null; thumbnailId: string }) {
        if (payload.scriptId) {
            await this.sync.linkByScript(userId, payload.scriptId, payload.thumbnailId);
        } else if (payload.videoId) {
            await this.sync.linkByVideo(userId, payload.videoId, payload.thumbnailId);
        }
    }

    async publishThumbnail(userId: string, payload: { scriptId?: string | null; videoId?: string | null; thumbnailId: string }) {
        if (payload.scriptId) {
            await this.sync.publishByScript(userId, payload.scriptId, payload.thumbnailId);
        } else if (payload.videoId) {
            await this.sync.publishByVideo(userId, payload.videoId, payload.thumbnailId);
        }
    }
}
