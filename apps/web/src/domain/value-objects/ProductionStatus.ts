// domain/value-objects/ProductionStatus.ts
// Value Object for Production status - Pipeline stages

export const PRODUCTION_STATUSES = [
    'idea',
    'scripting',
    'recording',
    'editing',
    'shorts',
    'publishing',
    'published'
] as const;

export type ProductionStatus = typeof PRODUCTION_STATUSES[number];

export function isValidProductionStatus(status: string): status is ProductionStatus {
    return PRODUCTION_STATUSES.includes(status as ProductionStatus);
}

export function getNextProductionStatus(current: ProductionStatus): ProductionStatus | null {
    const index = PRODUCTION_STATUSES.indexOf(current);
    if (index === -1 || index >= PRODUCTION_STATUSES.length - 1) return null;
    return PRODUCTION_STATUSES[index + 1];
}

export function getPreviousProductionStatus(current: ProductionStatus): ProductionStatus | null {
    const index = PRODUCTION_STATUSES.indexOf(current);
    if (index <= 0) return null;
    return PRODUCTION_STATUSES[index - 1];
}

export function getProductionStatusIndex(status: ProductionStatus): number {
    return PRODUCTION_STATUSES.indexOf(status);
}
