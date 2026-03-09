// application/services/ProductionPublishService.ts
// Service to publish a production in a transaction

import { PostgresProductionPublish, PublishResult } from '@/infrastructure/repositories/PostgresProductionPublish';

export class ProductionPublishService {
    constructor(private repository: PostgresProductionPublish) { }

    async publish(params: {
        userId: string;
        productionId: string;
        publishedUrl?: string | null;
        platformId?: string | null;
        platform?: string | null;
    }): Promise<PublishResult | null> {
        return this.repository.publish(params);
    }
}
