// application/services/ProductionReadinessService.ts
// Calculates readiness for production assets

export class ProductionReadinessService {
    private isNonEmpty(value: unknown) {
        return typeof value === 'string' && value.trim().length > 0;
    }

    isScriptComplete(row: Record<string, unknown>) {
        return Boolean(row.script_id)
            && this.isNonEmpty(row.intro)
            && this.isNonEmpty(row.body)
            && this.isNonEmpty(row.cta)
            && this.isNonEmpty(row.outro);
    }

    isThumbnailComplete(row: Record<string, unknown>) {
        const status = (row.thumbnail_status as string | null) ?? '';
        return Boolean(row.thumbnail_id)
            && (['designed', 'approved'].includes(status) || this.isNonEmpty(row.image_url));
    }

    isSeoComplete(row: Record<string, unknown>) {
        const tags = (row.seo_tags as string[] | null) ?? [];
        return Boolean(row.seo_id)
            && this.isNonEmpty(row.seo_title)
            && this.isNonEmpty(row.seo_description)
            && tags.length >= 5;
    }
}
