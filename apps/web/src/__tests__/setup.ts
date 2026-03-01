import '@testing-library/jest-dom';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_secret_change_me_32_chars_min____';
process.env.DATABASE_URL = 'postgresql://USER:PASSWORD@localhost:5432/cronostudio_test';

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: vi.fn(),
        replace: vi.fn(),
        prefetch: vi.fn(),
        back: vi.fn(),
    }),
    usePathname: () => '/',
    useSearchParams: () => new URLSearchParams(),
}));

// Mock fetch globally
global.fetch = vi.fn();

// Reset mocks before each test
beforeEach(() => {
    vi.clearAllMocks();
});
