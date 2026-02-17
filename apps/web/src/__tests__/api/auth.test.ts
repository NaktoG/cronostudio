import { describe, it, expect, vi, beforeEach } from 'vitest';
import { makeApiRequest } from '@/__tests__/utils/requests';
import { makeTestId } from '@/__tests__/utils/testIds';
import { makeQueryResult } from '@/__tests__/utils/db';

const VALID_TOKEN = makeTestId('token');
const EXPIRED_TOKEN = makeTestId('token_expired');
const JWT_USER_ID = makeTestId('user');
const JWT_EMAIL = `${makeTestId('email')}@example.test`;

vi.mock('@/lib/observability', () => ({
    emitMetric: vi.fn(),
}));

// Mock JWT module
vi.mock('jsonwebtoken', () => ({
    default: {
        sign: vi.fn(() => 'mock-token'),
        verify: vi.fn((token: string) => {
            if (token === VALID_TOKEN) {
                return { userId: JWT_USER_ID, email: JWT_EMAIL };
            }
            if (token === EXPIRED_TOKEN) {
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
            vi.mocked(query).mockResolvedValueOnce(makeQueryResult([]));

            const { POST } = await import('@/app/api/auth/login/route');

            const request = makeApiRequest('/api/auth/login', {
                method: 'POST',
                body: JSON.stringify({
                    email: `${makeTestId('email')}@example.test`,
                    password: makeTestId('password'),
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

            const request = makeApiRequest('/api/auth/login', {
                method: 'POST',
                body: JSON.stringify({
                    email: 'invalid-email',
                    password: makeTestId('password'),
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

            const request = makeApiRequest('/api/auth/register', {
                method: 'POST',
                body: JSON.stringify({
                    email: `${makeTestId('email')}@example.test`,
                    password: 'weak',
                    name: makeTestId('name'),
                }),
            });

            const response = await POST(request);
            expect(response.status).toBe(400);
            expect(emitMetricMock).not.toHaveBeenCalledWith(expect.objectContaining({ name: 'auth.register.success' }));
        });

        it('should return 409 for duplicate email', async () => {
            // Mock existing user
            vi.mocked(query).mockResolvedValueOnce(makeQueryResult([{ id: makeTestId('user') }]));

            const { POST } = await import('@/app/api/auth/register/route');

            const request = makeApiRequest('/api/auth/register', {
                method: 'POST',
                body: JSON.stringify({
                    email: `${makeTestId('email')}@example.test`,
                    password: makeTestId('password'),
                    name: makeTestId('name'),
                }),
            });

            const response = await POST(request);
            expect(response.status).toBe(409);
            expect(emitMetricMock).toHaveBeenCalledWith(expect.objectContaining({ name: 'auth.register.failure' }));
        });
    });
});
