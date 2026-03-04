// lib/config.ts
// Centralized configuration with validation

import { z } from 'zod';

const isProduction = process.env.NODE_ENV === 'production';

const envSchema = z
  .object({
    NODE_ENV: z.string().optional(),
    PORT: z.string().optional(),
    LOG_LEVEL: z.string().optional(),

    JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
    JWT_EXPIRES_IN: z.string().optional(),
    JWT_REFRESH_EXPIRES_IN: z.string().optional(),

    DATABASE_URL: z.string().min(1, 'DATABASE_URL is required').optional(),

    APP_BASE_URL: z.string().optional(),
    N8N_BASE_URL: z.string().optional(),
    CORS_ALLOWED_ORIGINS: z.string().optional(),

    OBS_ENABLED: z.string().optional(),
    OBS_ENDPOINT: z.string().optional(),
    OBS_ALERT_WEBHOOK: z.string().optional(),
    OBS_ALERT_EMAIL: z.string().optional(),

    REDIS_URL: z.string().optional(),
    REDIS_SKIP_TLS_VERIFY: z.string().optional(),

    CRONOSTUDIO_WEBHOOK_SECRET: z.string().optional(),

    CSP_CONNECT_SRC: z.string().optional(),
    CSP_IMG_SRC: z.string().optional(),
    CSP_SCRIPT_SRC: z.string().optional(),
    CSP_STYLE_SRC: z.string().optional(),
    CSP_FONT_SRC: z.string().optional(),
    CSP_REPORT_ONLY: z.string().optional(),
    CSP_REPORT_URI: z.string().optional(),
  })
  .passthrough();

function formatEnvErrors(errors: z.ZodIssue[]) {
  const missing = errors.map((issue) => issue.path.join('.')).filter(Boolean);
  const unique = Array.from(new Set(missing));
  return `Missing or invalid environment variables: ${unique.join(', ')}.\n` +
    'Set them in apps/web/.env.local (recommended) or apps/web/.env.\n' +
    'Copy apps/web/.env.example and fill in the required values.';
}

function requireDatabaseEnv() {
  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl) return;

  const missing: string[] = [];
  if (!process.env.POSTGRES_HOST) missing.push('POSTGRES_HOST');
  if (!process.env.POSTGRES_PORT) missing.push('POSTGRES_PORT');
  if (!process.env.POSTGRES_DB) missing.push('POSTGRES_DB');
  if (!process.env.POSTGRES_USER) missing.push('POSTGRES_USER');
  if (!process.env.POSTGRES_PASSWORD) missing.push('POSTGRES_PASSWORD');

  if (missing.length > 0) {
    throw new Error(
      `Missing required database environment variables: ${missing.join(', ')}.\n` +
        'Set DATABASE_URL or configure all POSTGRES_* variables in apps/web/.env.local.'
    );
  }
}

function getArrayEnv(value: string | undefined, defaultValues: string[]): string[] {
  if (!value) return defaultValues;
  return value
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
}

let cachedConfig: ReturnType<typeof buildConfig> | null = null;

function buildConfig() {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error(formatEnvErrors(parsed.error.issues));
  }

  const env = parsed.data;
  requireDatabaseEnv();

  return {
    nodeEnv: env.NODE_ENV || 'development',
    isProduction,

    jwt: {
      secret: env.JWT_SECRET,
      expiresIn: env.JWT_EXPIRES_IN || '7d',
      refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN || '30d',
    },

    database: {
      url: env.DATABASE_URL || '',
    },

    app: {
      baseUrl: env.APP_BASE_URL || 'http://localhost:3000',
    },

    automation: {
      n8nBaseUrl: env.N8N_BASE_URL || 'http://localhost:5678',
    },

    cors: {
      allowedOrigins: getArrayEnv(env.CORS_ALLOWED_ORIGINS, [
        'http://localhost:3000',
        'http://localhost:3001',
      ]),
    },

    observability: {
      enabled: (env.OBS_ENABLED || 'false') === 'true',
      endpoint: env.OBS_ENDPOINT,
      alertWebhook: env.OBS_ALERT_WEBHOOK,
      alertEmail: env.OBS_ALERT_EMAIL,
    },

    redis: {
      url: env.REDIS_URL,
      skipTlsVerify: env.REDIS_SKIP_TLS_VERIFY === 'true',
    },

    webhooks: {
      secret: env.CRONOSTUDIO_WEBHOOK_SECRET,
    },

    csp: {
      connectSrc: getArrayEnv(env.CSP_CONNECT_SRC, ["'self'"]),
      imgSrc: getArrayEnv(env.CSP_IMG_SRC, ["'self'", 'data:', 'https:']),
      scriptSrc: getArrayEnv(env.CSP_SCRIPT_SRC, ["'self'"]),
      styleSrc: getArrayEnv(env.CSP_STYLE_SRC, ["'self'", "'unsafe-inline'"]),
      fontSrc: getArrayEnv(env.CSP_FONT_SRC, ["'self'", 'data:', 'https://fonts.gstatic.com']),
      reportOnly: (env.CSP_REPORT_ONLY || 'false') === 'true',
      reportUri: env.CSP_REPORT_URI,
    },

    rateLimit: {
      api: {
        windowMs: 15 * 60 * 1000,
        max: 100,
      },
      auth: {
        windowMs: 15 * 60 * 1000,
        max: 5,
      },
    },

    logging: {
      level: env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
    },
  };
}

export function getConfig() {
  if (!cachedConfig) {
    cachedConfig = buildConfig();
  }
  return cachedConfig;
}

export const config = getConfig();

// Validate critical config on startup
export function validateConfig(): void {
  const current = getConfig();

  if (current.jwt.secret.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters.');
  }

  if (!current.database.url && !process.env.DATABASE_URL) {
    requireDatabaseEnv();
  }

  if (current.isProduction) {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL must be set in production.');
    }
    if (!current.app.baseUrl || current.app.baseUrl.includes('localhost')) {
      throw new Error('APP_BASE_URL must be set for production.');
    }
    if (current.cors.allowedOrigins.length === 0) {
      throw new Error('CORS_ALLOWED_ORIGINS must include at least one origin in production.');
    }
    if (!current.redis.url) {
      throw new Error('REDIS_URL must be configured in production for rate limiting.');
    }
    if (current.redis.skipTlsVerify) {
      throw new Error('Disable REDIS_SKIP_TLS_VERIFY in production to avoid MITM vulnerabilities.');
    }
  }
}

export default config;
