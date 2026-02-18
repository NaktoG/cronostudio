import { NextRequest } from 'next/server';

export const TEST_BASE_URL = 'https://test.local';

export const TEST_EMAILS = {
    owner: 'owner@test.local',
    user: 'user@test.local',
} as const;

export const TEST_IDS = {
    userId: 'user-123',
    automationRunId: 'run-123',
    channelId: 'channel-123',
    videoId: 'video-123',
    analyticsId: 'analytics-123',
    existingUserId: 'user-456',
    ideaId: 'idea-123',
    productionId: 'production-123',
} as const;

export const TEST_SECRET = 'test-secret';
export const TEST_REDIS_URL = 'redis://test.local:6379';

export function createRequest(path: string, init?: RequestInit): NextRequest {
    return new NextRequest(`${TEST_BASE_URL}${path}`, init);
}
