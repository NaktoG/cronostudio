import { describe, it, expect } from 'vitest';
import {
    IDEA_STATUSES,
    isValidIdeaStatus,
    getNextIdeaStatus
} from '@/domain/value-objects/IdeaStatus';
import {
    PRODUCTION_STATUSES,
    isValidProductionStatus,
    getNextProductionStatus,
    getPreviousProductionStatus,
    getProductionStatusIndex
} from '@/domain/value-objects/ProductionStatus';

describe('IdeaStatus Value Object', () => {
    it('should have 5 valid statuses', () => {
        expect(IDEA_STATUSES).toHaveLength(5);
        expect(IDEA_STATUSES).toContain('draft');
        expect(IDEA_STATUSES).toContain('approved');
        expect(IDEA_STATUSES).toContain('completed');
    });

    it('should validate correct statuses', () => {
        expect(isValidIdeaStatus('draft')).toBe(true);
        expect(isValidIdeaStatus('approved')).toBe(true);
        expect(isValidIdeaStatus('archived')).toBe(true);
    });

    it('should reject invalid statuses', () => {
        expect(isValidIdeaStatus('invalid')).toBe(false);
        expect(isValidIdeaStatus('')).toBe(false);
        expect(isValidIdeaStatus('DRAFT')).toBe(false);
    });

    it('should get next status correctly', () => {
        expect(getNextIdeaStatus('draft')).toBe('approved');
        expect(getNextIdeaStatus('approved')).toBe('in_production');
        expect(getNextIdeaStatus('archived')).toBe(null);
    });
});

describe('ProductionStatus Value Object', () => {
    it('should have 7 pipeline stages', () => {
        expect(PRODUCTION_STATUSES).toHaveLength(7);
        expect(PRODUCTION_STATUSES[0]).toBe('idea');
        expect(PRODUCTION_STATUSES[6]).toBe('published');
    });

    it('should validate production statuses', () => {
        expect(isValidProductionStatus('idea')).toBe(true);
        expect(isValidProductionStatus('editing')).toBe(true);
        expect(isValidProductionStatus('published')).toBe(true);
        expect(isValidProductionStatus('invalid')).toBe(false);
    });

    it('should navigate pipeline forward', () => {
        expect(getNextProductionStatus('idea')).toBe('scripting');
        expect(getNextProductionStatus('scripting')).toBe('recording');
        expect(getNextProductionStatus('published')).toBe(null);
    });

    it('should navigate pipeline backward', () => {
        expect(getPreviousProductionStatus('scripting')).toBe('idea');
        expect(getPreviousProductionStatus('published')).toBe('publishing');
        expect(getPreviousProductionStatus('idea')).toBe(null);
    });

    it('should return correct index', () => {
        expect(getProductionStatusIndex('idea')).toBe(0);
        expect(getProductionStatusIndex('editing')).toBe(3);
        expect(getProductionStatusIndex('published')).toBe(6);
    });
});
