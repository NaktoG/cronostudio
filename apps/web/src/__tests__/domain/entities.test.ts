import { describe, it, expect } from 'vitest';
import { createIdea } from '@/domain/entities/Idea';
import { createProduction } from '@/domain/entities/Production';

describe('Idea Entity', () => {
    describe('createIdea factory', () => {
        it('should create idea with required fields', () => {
            const idea = createIdea({
                userId: 'user-123',
                title: 'Test Idea',
            });

            expect(idea.userId).toBe('user-123');
            expect(idea.title).toBe('Test Idea');
            expect(idea.status).toBe('draft');
            expect(idea.priority).toBe(0);
            expect(idea.tags).toEqual([]);
            expect(idea.source).toBe('manual');
        });

        it('should create idea with optional fields', () => {
            const idea = createIdea({
                userId: 'user-123',
                title: 'Test Idea',
                description: 'A description',
                channelId: 'channel-456',
                priority: 8,
                tags: ['tech', 'tutorial'],
                source: 'ai',
            });

            expect(idea.description).toBe('A description');
            expect(idea.channelId).toBe('channel-456');
            expect(idea.priority).toBe(8);
            expect(idea.tags).toEqual(['tech', 'tutorial']);
            expect(idea.source).toBe('ai');
        });

        it('should default null for optional fields', () => {
            const idea = createIdea({
                userId: 'user-123',
                title: 'Test',
            });

            expect(idea.channelId).toBeNull();
            expect(idea.description).toBeNull();
            expect(idea.aiScore).toBeNull();
        });
    });
});

describe('Production Entity', () => {
    describe('createProduction factory', () => {
        it('should create production with default status "idea"', () => {
            const production = createProduction({
                userId: 'user-123',
                title: 'My Video',
            });

            expect(production.userId).toBe('user-123');
            expect(production.title).toBe('My Video');
            expect(production.status).toBe('idea');
            expect(production.priority).toBe(0);
            expect(production.shortsCount).toBe(0);
            expect(production.postsCount).toBe(0);
        });

        it('should create production with all optional fields', () => {
            const targetDate = new Date('2026-02-01');
            const production = createProduction({
                userId: 'user-123',
                title: 'My Video',
                description: 'Description',
                channelId: 'channel-456',
                ideaId: 'idea-789',
                priority: 10,
                targetDate,
            });

            expect(production.description).toBe('Description');
            expect(production.channelId).toBe('channel-456');
            expect(production.ideaId).toBe('idea-789');
            expect(production.priority).toBe(10);
            expect(production.targetDate).toEqual(targetDate);
        });

        it('should initialize counts to zero', () => {
            const production = createProduction({
                userId: 'user-123',
                title: 'Test',
            });

            expect(production.shortsCount).toBe(0);
            expect(production.shortsPublished).toBe(0);
            expect(production.postsCount).toBe(0);
            expect(production.postsPublished).toBe(0);
        });

        it('should set publishedAt to null', () => {
            const production = createProduction({
                userId: 'user-123',
                title: 'Test',
            });

            expect(production.publishedAt).toBeNull();
        });
    });
});
