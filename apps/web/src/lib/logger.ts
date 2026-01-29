type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const levelOrder: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const configuredLevel = (process.env.LOG_LEVEL || 'info') as LogLevel;
const minLevel = levelOrder[configuredLevel] ?? levelOrder.info;

function shouldLog(level: LogLevel): boolean {
  return levelOrder[level] >= minLevel;
}

function write(level: LogLevel, message: string, meta?: Record<string, unknown>) {
  if (!shouldLog(level)) return;
  const payload = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...(meta ? { meta } : {}),
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
