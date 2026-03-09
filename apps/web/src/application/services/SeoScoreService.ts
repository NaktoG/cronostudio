// application/services/SeoScoreService.ts
// Calculates SEO score using current heuristic

export class SeoScoreService {
    calculate(title?: string | null, description?: string | null, tags?: string[] | null): number {
        let score = 0;
        if (title) {
            if (title.length >= 30 && title.length <= 60) score += 20;
            else if (title.length >= 20 && title.length <= 70) score += 10;
            if (/\||-|:/.test(title)) score += 5;
            if (title.length > 0) score += 5;
        }
        if (description) {
            if (description.length >= 100 && description.length <= 500) score += 25;
            else if (description.length >= 50) score += 15;
            if (/http|www|👇|⬇️|📌/.test(description)) score += 10;
            if (description.length > 0) score += 5;
        }
        if (tags && tags.length > 0) {
            if (tags.length >= 5 && tags.length <= 15) score += 20;
            else if (tags.length >= 3) score += 10;
            score += Math.min(tags.length, 10);
        }
        return Math.min(score, 100);
    }
}
