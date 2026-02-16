// lib/config.ts
// Centralized configuration with validation

const isProduction = process.env.NODE_ENV === 'production';

function getRequiredEnv(key: string, fallbackForDev?: string): string {
    const value = process.env[key];

    if (value) return value;

    if (!isProduction && fallbackForDev) {
        console.warn(`WARNING: Using fallback value for ${key} in ${process.env.NODE_ENV}. Do not rely on this outside local development.`);
        return fallbackForDev;
    }

    throw new Error(`Missing required environment variable: ${key}`);
}

function getOptionalEnv(key: string, defaultValue: string): string {
    return process.env[key] || defaultValue;
}

function getArrayEnv(key: string, defaultValues: string[]): string[] {
    const value = process.env[key];
    if (!value) return defaultValues;
    return value
        .split(',')
        .map((origin) => origin.trim())
        .filter((origin) => origin.length > 0);
}

export const config = {
    // Environment
    nodeEnv: getOptionalEnv('NODE_ENV', 'development'),
    isProduction,

    // JWT Configuration
    jwt: {
        secret: getRequiredEnv('JWT_SECRET', 'dev-secret-change-in-production'),
        expiresIn: getOptionalEnv('JWT_EXPIRES_IN', '7d'),
        refreshExpiresIn: getOptionalEnv('JWT_REFRESH_EXPIRES_IN', '30d'),
    },

    // Database
    database: {
        url: getRequiredEnv('DATABASE_URL', 'postgresql://crono:crono@localhost:5432/cronostudio'),
    },

    app: {
        baseUrl: getOptionalEnv('APP_BASE_URL', 'http://localhost:3000'),
    },

    automation: {
        n8nBaseUrl: getOptionalEnv('N8N_BASE_URL', 'http://localhost:5678'),
    },

    cors: {
        allowedOrigins: getArrayEnv('CORS_ALLOWED_ORIGINS', [
            'http://localhost:3000',
            'http://localhost:3001',
        ]),
    },

    observability: {
        enabled: getOptionalEnv('OBS_ENABLED', 'false') === 'true',
        endpoint: process.env.OBS_ENDPOINT,
        alertWebhook: process.env.OBS_ALERT_WEBHOOK,
        alertEmail: process.env.OBS_ALERT_EMAIL,
    },

    redis: {
        url: process.env.REDIS_URL,
        skipTlsVerify: process.env.REDIS_SKIP_TLS_VERIFY === 'true',
    },

    webhooks: {
        secret: process.env.CRONOSTUDIO_WEBHOOK_SECRET,
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
        if (!config.jwt.secret || config.jwt.secret === 'dev-secret-change-in-production') {
            throw new Error('CRITICAL: JWT_SECRET must be set in production!');
        }
        if (config.jwt.secret.length < 32) {
            throw new Error('CRITICAL: JWT_SECRET must be at least 32 characters in production!');
        }
        if (!config.database.url || config.database.url.includes('localhost')) {
            throw new Error('CRITICAL: DATABASE_URL must be set for production!');
        }
        if (!config.app.baseUrl || config.app.baseUrl.includes('localhost')) {
            throw new Error('CRITICAL: APP_BASE_URL must be set for production!');
        }
        if (config.cors.allowedOrigins.length === 0) {
            throw new Error('CRITICAL: CORS_ALLOWED_ORIGINS must include at least one origin in production!');
        }
        if (!config.redis.url) {
            throw new Error('CRITICAL: REDIS_URL must be configured in production for rate limiting!');
        }
        if (config.redis.skipTlsVerify) {
            throw new Error('CRITICAL: Disable REDIS_SKIP_TLS_VERIFY in production to avoid MITM vulnerabilities.');
        }
    }
}

export default config;
