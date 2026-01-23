import { Pool, QueryResult } from 'pg';

// Configuración del pool de conexiones
const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DB || 'cronostudio',
  user: process.env.POSTGRES_USER || 'cronostudio',
  password: process.env.POSTGRES_PASSWORD || 'cronostudio',
  max: 20, // Máximo de conexiones en el pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Manejar errores del pool
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

/**
 * Ejecutar query SQL
 * @param text - Query SQL
 * @param params - Parámetros para la query
 * @returns Resultado de la query
 */
export async function query(
  text: string,
  params?: any[]
): Promise<QueryResult> {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    
    // Log solo en desarrollo
    if (process.env.NODE_ENV === 'development') {
      console.log('[DB Query]', { 
        text: text.substring(0, 100), 
        duration: `${duration}ms`, 
        rows: res.rowCount 
      });
    }
    
    return res;
  } catch (error) {
    console.error('[DB Error]', { 
      text: text.substring(0, 100), 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    throw error;
  }
}

/**
 * Obtener cliente del pool (para transacciones)
 * @returns Cliente de PostgreSQL
 */
export async function getClient() {
  return await pool.connect();
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
    console.error('[DB Connection Test] Failed:', error);
    return false;
  }
}

export default pool;
