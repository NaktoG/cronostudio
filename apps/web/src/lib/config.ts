// lib/config.ts
// Centralized configuration with validation

function getRequiredEnv(key: string, fallbackForDev?: string): string {
    const value = process.env[key];

    if (value) return value;

    // Allow fallback even in production (for build safety when .env is missing due to EPERM)
    if (fallbackForDev) {
        console.warn(`CRITICAL WARNING: Using fallback value for ${key} in ${process.env.NODE_ENV}. Ensure this is configured!`);
        return fallbackForDev;
    }

    throw new Error(`Missing required environment variable: ${key}`);
}

function getOptionalEnv(key: string, defaultValue: string): string {
    return process.env[key] || defaultValue;
}

export const config = {
    // Environment
    nodeEnv: getOptionalEnv('NODE_ENV', 'development'),
    isProduction: process.env.NODE_ENV === 'production',

    // JWT Configuration
    jwt: {
        secret: getRequiredEnv('JWT_SECRET', 'dev-secret-change-in-production'),
        expiresIn: getOptionalEnv('JWT_EXPIRES_IN', '7d'),
    },

    // Database
    database: {
        url: getRequiredEnv('DATABASE_URL', 'postgresql://crono:crono@localhost:5432/cronostudio'),
    },

    // Rate Limiting
    rateLimit: {
        api: {
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 100,
        },
        auth: {
            windowMs: 15 * 60 * 1000,
            max: 5,
        },
    },

    // Logging
    logging: {
        level: getOptionalEnv('LOG_LEVEL', process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
    },
};

// Validate critical config on startup
export function validateConfig(): void {
    if (config.isProduction) {
        if (config.jwt.secret === 'dev-secret-change-in-production') {
            throw new Error('CRITICAL: JWT_SECRET must be set in production!');
        }
        if (config.jwt.secret.length < 32) {
            throw new Error('CRITICAL: JWT_SECRET must be at least 32 characters in production!');
        }
    }
}

export default config;
