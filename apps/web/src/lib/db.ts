import { Pool, QueryResult } from 'pg';
import { validateConfig } from '@/lib/config';
import { emitMetric, emitAlert } from '@/lib/observability';
import { logger } from '@/lib/logger';



// Using global variable to cache pool across hot reloads in development
let pool: Pool | null = null;

function getPool(): Pool {
  if (pool) return pool;

  if (process.env.NODE_ENV === 'production') {
    validateConfig();
  }

  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
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

  pool = new Pool(
    databaseUrl
      ? {
          connectionString: databaseUrl,
          max: 20,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 2000,
          ...getSslConfig(databaseUrl),
        }
      : {
          host: process.env.POSTGRES_HOST as string,
          port: parseInt(process.env.POSTGRES_PORT as string, 10),
          database: process.env.POSTGRES_DB as string,
          user: process.env.POSTGRES_USER as string,
          password: process.env.POSTGRES_PASSWORD as string,
          max: 20, // Máximo de conexiones en el pool
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 2000,
        }
  );

  // Manejar errores del pool
  pool.on('error', (err) => {
    logger.error('db.pool.error', {
      error: err instanceof Error ? err.message : String(err),
    });
    emitAlert(
      {
        title: 'DB pool error',
        message: err instanceof Error ? err.message : 'Unexpected pool error',
        severity: 'critical',
        tags: { component: 'database' },
      },
      { dedupeKey: 'db.pool_error', cooldownMs: 300000 }
    );
    pool = null;
  });

  return pool;
}

function getSslConfig(databaseUrl: string) {
  const explicit = process.env.DB_SSL?.toLowerCase();
  if (explicit === 'false') {
    return {};
  }

  const url = new URL(databaseUrl);
  const host = url.hostname;
  const isLocalHost = ['localhost', '127.0.0.1'].includes(host);
  const shouldUseSsl = explicit === 'true' || !isLocalHost;

  if (!shouldUseSsl) {
    return {};
  }

  const rejectUnauthorized = process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false';
  return {
    ssl: {
      rejectUnauthorized,
    },
  };
}

/**
 * Ejecutar query SQL
 * @param text - Query SQL
 * @param params - Parámetros para la query
 * @returns Resultado de la query
 */
export async function query(
  text: string,
  params?: unknown[]
): Promise<QueryResult> {
  const start = Date.now();
  try {
    const res = await getPool().query(text, params);
    const duration = Date.now() - start;

    // Log solo en desarrollo
    if (process.env.NODE_ENV === 'development') {
      logger.debug('db.query', {
        text: text.substring(0, 100),
        duration: `${duration}ms`,
        rows: res.rowCount
      });
    }

    return res;
  } catch (error) {
    logger.error('db.query.error', {
      text: text.substring(0, 100),
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    emitMetric({ name: 'db.query_error', value: 1 });
    emitAlert(
      {
        title: 'DB query error',
        message: error instanceof Error ? error.message : 'Unknown query error',
        severity: 'warning',
        tags: { component: 'database' },
        context: { query: text.substring(0, 100) },
      },
      { dedupeKey: 'db.query_error', cooldownMs: 60000 }
    );
    throw error;
  }
}

/**
 * Obtener cliente del pool (para transacciones)
 * @returns Cliente de PostgreSQL
 */
export async function getClient() {
  return await getPool().connect();
}

/**
 * Verificar conexión a la base de datos
 * @returns true si la conexión es exitosa
 */
export async function testConnection(): Promise<boolean> {
  try {
    const result = await query('SELECT NOW()');
    return result.rows.length > 0;
  } catch (error) {
    logger.error('db.connection.error', {
      error: error instanceof Error ? error.message : String(error),
    });
    emitMetric({ name: 'db.connection_error', value: 1 });
    emitAlert(
      {
        title: 'Database connection failure',
        message: error instanceof Error ? error.message : 'Unknown connection error',
        severity: 'critical',
        tags: { component: 'database' },
      },
      { dedupeKey: 'db.connection_error', cooldownMs: 300000 }
    );
    return false;
  }
}

export default getPool;
