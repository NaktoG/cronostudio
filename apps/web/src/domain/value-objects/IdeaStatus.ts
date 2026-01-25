// domain/value-objects/IdeaStatus.ts
// Value Object for Idea status - Immutable and self-validating

export const IDEA_STATUSES = ['draft', 'approved', 'in_production', 'completed', 'archived'] as const;
export type IdeaStatus = typeof IDEA_STATUSES[number];

export function isValidIdeaStatus(status: string): status is IdeaStatus {
    return IDEA_STATUSES.includes(status as IdeaStatus);
}

export function getNextIdeaStatus(current: IdeaStatus): IdeaStatus | null {
    const index = IDEA_STATUSES.indexOf(current);
    if (index === -1 || index >= IDEA_STATUSES.length - 1) return null;
    return IDEA_STATUSES[index + 1];
}
