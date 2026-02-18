import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createRequest, TEST_IDS } from '@/__tests__/utils/testConstants';

vi.mock('@/lib/observability', () => ({
    emitMetric: vi.fn(),
}));

// Mock JWT module
vi.mock('jsonwebtoken', () => ({
    default: {
        sign: vi.fn(() => 'mock-token'),
        verify: vi.fn((token: string) => {
            if (token === 'valid-token') {
                return { userId: TEST_IDS.userId, email: 'test@example.com' };
            }
            if (token === 'expired-token') {
                const error = new Error('Token expired');
                error.name = 'TokenExpiredError';
                throw error;
            }
            throw new Error('Invalid token');
        }),
    },
}));

// Mock bcrypt
vi.mock('bcrypt', () => ({
    default: {
        hash: vi.fn(() => Promise.resolve('hashed-password')),
        compare: vi.fn((password: string, _hash: string) => {
            return Promise.resolve(password === 'correct-password' && typeof _hash === 'string');
        }),
    },
}));

// Mock database
vi.mock('@/lib/db', () => ({
    query: vi.fn(),
}));

import { query } from '@/lib/db';
import { emitMetric } from '@/lib/observability';

describe('Auth API', () => {
    const emitMetricMock = vi.mocked(emitMetric);
    beforeEach(() => {
        vi.clearAllMocks();
        emitMetricMock.mockClear();
    });

    describe('POST /api/auth/login', () => {
        it('should return 401 for invalid credentials', async () => {
            // Mock no user found
            vi.mocked(query).mockResolvedValueOnce({ rows: [], rowCount: 0 });

            const { POST } = await import('@/app/api/auth/login/route');

            const request = createRequest('/api/auth/login', {
                method: 'POST',
                body: JSON.stringify({
                    email: 'nonexistent@example.com',
                    password: 'password123',
                }),
            });

            const response = await POST(request);
            const data = await response.json();

            expect(response.status).toBe(401);
            expect(data.error).toBe('Credenciales inválidas');
            expect(emitMetricMock).toHaveBeenCalledWith(expect.objectContaining({ name: 'auth.login.failure' }));
        });

        it('should return 400 for invalid email format', async () => {
            const { POST } = await import('@/app/api/auth/login/route');

            const request = createRequest('/api/auth/login', {
                method: 'POST',
                body: JSON.stringify({
                    email: 'invalid-email',
                    password: 'password123',
                }),
            });

            const response = await POST(request);
            expect(response.status).toBe(400);
            expect(emitMetricMock).not.toHaveBeenCalledWith(expect.objectContaining({ name: 'auth.login.success' }));
        });
    });

    describe('POST /api/auth/register', () => {
        it('should return 400 for weak password', async () => {
            const { POST } = await import('@/app/api/auth/register/route');

            const request = createRequest('/api/auth/register', {
                method: 'POST',
                body: JSON.stringify({
                    email: 'test@example.com',
                    password: 'weak',
                    name: 'Test User',
                }),
            });

            const response = await POST(request);
            expect(response.status).toBe(400);
            expect(emitMetricMock).not.toHaveBeenCalledWith(expect.objectContaining({ name: 'auth.register.success' }));
        });

        it('should return 409 for duplicate email', async () => {
            // Mock existing user
            vi.mocked(query).mockResolvedValueOnce({
                rows: [{ id: TEST_IDS.existingUserId }],
                rowCount: 1
            });

            const { POST } = await import('@/app/api/auth/register/route');

            const request = createRequest('/api/auth/register', {
                method: 'POST',
                body: JSON.stringify({
                    email: 'existing@example.com',
                    password: 'Password123',
                    name: 'Test User',
                }),
            });

            const response = await POST(request);
            expect(response.status).toBe(409);
            expect(emitMetricMock).toHaveBeenCalledWith(expect.objectContaining({ name: 'auth.register.failure' }));
        });
    });
});
