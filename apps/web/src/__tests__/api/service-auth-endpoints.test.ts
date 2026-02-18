import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createRequest, TEST_EMAILS, TEST_IDS, TEST_SECRET } from '@/__tests__/utils/testConstants';
import { USER_ROLE_COLLABORATOR } from '@/domain/value-objects/UserRole';

vi.mock('@/lib/config', () => ({
    config: {
        webhooks: {
            secret: TEST_SECRET,
        },
        serviceUser: {
            id: TEST_IDS.userId,
        },
        isProduction: false,
        observability: {
            enabled: false,
            endpoint: undefined,
            alertWebhook: undefined,
            alertEmail: undefined,
        },
    },
}));
vi.mock('@/lib/db', () => ({
    query: vi.fn(),
}));
vi.mock('@/lib/logger', () => ({
    logger: {
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
        debug: vi.fn(),
    },
}));
vi.mock('@/lib/serviceUser', () => ({
    resolveServiceUserId: vi.fn(),
}));
vi.mock('@/middleware/auth', () => {
    const getAuthUser = vi.fn();
    return {
        getAuthUser,
        withSecurityHeaders: (response: Response) => response,
    };
});
vi.mock('@/lib/validation', () => ({
    validateInput: vi.fn(),
    CreateAnalyticsSchema: {},
    AnalyticsQuerySchema: {},
}));

import { query } from '@/lib/db';
import { getAuthUser, type JWTPayload } from '@/middleware/auth';
import { resolveServiceUserId } from '@/lib/serviceUser';
import { validateInput } from '@/lib/validation';

describe('Service auth endpoints', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const collaboratorUser = { userId: TEST_IDS.userId, email: TEST_EMAILS.user, role: USER_ROLE_COLLABORATOR } as JWTPayload;

    it('allows service secret on GET /api/channels', async () => {
        vi.mocked(getAuthUser).mockReturnValue(null);
        vi.mocked(resolveServiceUserId).mockResolvedValue(TEST_IDS.userId);
        vi.mocked(query).mockResolvedValue({ rows: [], rowCount: 0 });
        const { GET } = await import('@/app/api/channels/route');

        const request = createRequest('/api/channels', {
            headers: {
                'x-cronostudio-webhook-secret': TEST_SECRET,
            },
        });

        const response = await GET(request);
        expect(response.status).toBe(200);
    });

    it('returns 401 for GET /api/channels without secret or session', async () => {
        vi.mocked(getAuthUser).mockReturnValue(null);
        const { GET } = await import('@/app/api/channels/route');

        const request = createRequest('/api/channels');
        const response = await GET(request);

        expect(response.status).toBe(401);
    });

    it('returns 500 for GET /api/channels when service user is missing', async () => {
        vi.mocked(getAuthUser).mockReturnValue(null);
        vi.mocked(resolveServiceUserId).mockResolvedValue(null);
        const { GET } = await import('@/app/api/channels/route');

        const request = createRequest('/api/channels', {
            headers: {
                'x-cronostudio-webhook-secret': TEST_SECRET,
            },
        });

        const response = await GET(request);
        expect(response.status).toBe(500);
        await expect(response.json()).resolves.toEqual({ error: 'Service user misconfigured' });
    });

    it('allows service secret on GET /api/videos', async () => {
        vi.mocked(getAuthUser).mockReturnValue(null);
        vi.mocked(resolveServiceUserId).mockResolvedValue(TEST_IDS.userId);
        vi.mocked(query).mockResolvedValue({ rows: [], rowCount: 0 });
        const { GET } = await import('@/app/api/videos/route');

        const request = createRequest('/api/videos?limit=10&offset=0', {
            headers: {
                'x-cronostudio-webhook-secret': TEST_SECRET,
            },
        });

        const response = await GET(request);
        expect(response.status).toBe(200);
    });

    it('allows service secret on POST /api/analytics', async () => {
        vi.mocked(getAuthUser).mockReturnValue(null);
        vi.mocked(resolveServiceUserId).mockResolvedValue(TEST_IDS.userId);
        vi.mocked(validateInput).mockReturnValue({
            videoId: TEST_IDS.videoId,
            date: new Date('2026-02-01'),
            views: 10,
            watchTimeMinutes: 5,
            avgViewDurationSeconds: 30,
        });
        vi.mocked(query)
            .mockResolvedValueOnce({ rows: [{ id: TEST_IDS.videoId }], rowCount: 1 })
            .mockResolvedValueOnce({ rows: [{ id: TEST_IDS.analyticsId }], rowCount: 1 });
        const { POST } = await import('@/app/api/analytics/route');

        const request = createRequest('/api/analytics', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-cronostudio-webhook-secret': TEST_SECRET,
            },
            body: JSON.stringify({
                videoId: TEST_IDS.videoId,
                date: '2026-02-01',
                views: 10,
                watchTimeMinutes: 5,
                avgViewDurationSeconds: 30,
            }),
        });

        const response = await POST(request);
        expect(response.status).toBe(201);
    });

    it('returns 401 for invalid secret', async () => {
        vi.mocked(getAuthUser).mockReturnValue(null);
        const { GET } = await import('@/app/api/videos/route');

        const request = createRequest('/api/videos?limit=10&offset=0', {
            headers: {
                'x-cronostudio-webhook-secret': 'invalid-secret',
            },
        });

        const response = await GET(request);
        expect(response.status).toBe(401);
    });

    it('returns 403 for non-owner without secret', async () => {
        vi.mocked(getAuthUser).mockReturnValue(collaboratorUser);
        const { GET } = await import('@/app/api/channels/route');

        const request = createRequest('/api/channels');
        const response = await GET(request);
        expect(response.status).toBe(403);
    });
});
