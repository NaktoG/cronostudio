type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const levelOrder: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const configuredLevel = (process.env.LOG_LEVEL || 'info') as LogLevel;
const minLevel = levelOrder[configuredLevel] ?? levelOrder.info;

const SENSITIVE_KEYS = [
  'authorization',
  'cookie',
  'set-cookie',
  'token',
  'secret',
  'password',
  'jwt',
  'api_key',
  'apikey',
  'access_key',
  'refresh_token',
  'session',
];

function shouldRedact(key: string): boolean {
  const normalized = key.toLowerCase();
  return SENSITIVE_KEYS.some((entry) => normalized.includes(entry));
}

function redactValue(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) {
    return value.map((item) => redactValue(item));
  }
  if (typeof value === 'object') {
    const record = value as Record<string, unknown>;
    return redactMeta(record);
  }
  return '[REDACTED]';
}

function redactMeta(meta: Record<string, unknown>): Record<string, unknown> {
  const output: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(meta)) {
    output[key] = shouldRedact(key) ? '[REDACTED]' : redactValue(value);
  }
  return output;
}

function shouldLog(level: LogLevel): boolean {
  return levelOrder[level] >= minLevel;
}

function write(level: LogLevel, message: string, meta?: Record<string, unknown>) {
  if (!shouldLog(level)) return;
  const payload = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...(meta ? { meta: redactMeta(meta) } : {}),
  };
  const output = JSON.stringify(payload);

  if (level === 'error') {
    console.error(output);
    return;
  }
  if (level === 'warn') {
    console.warn(output);
    return;
  }
  console.log(output);
}

export const logger = {
  debug(message: string, meta?: Record<string, unknown>) {
    write('debug', message, meta);
  },
  info(message: string, meta?: Record<string, unknown>) {
    write('info', message, meta);
  },
  warn(message: string, meta?: Record<string, unknown>) {
    write('warn', message, meta);
  },
  error(message: string, meta?: Record<string, unknown>) {
    write('error', message, meta);
  },
};
