import 'server-only'

import { Pool, PoolClient } from 'pg'

// Remove DatabasePool interface as it conflicts with Pool type

let pool: Pool | null = null;

// Initialize PostgreSQL connection pool
function initializePool(): Pool {
  if (!pool) {
    const databaseUrl = process.env.DATABASE_URL;
    
    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is not set');
    }

    pool = new Pool({
      connectionString: databaseUrl,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: 20, // Maximum number of connections in the pool
      idleTimeoutMillis: 30000, // How long a client is allowed to remain idle
      connectionTimeoutMillis: 2000, // How long to wait when connecting a new client
    });

    // Handle pool errors
    pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
    });

    console.log('PostgreSQL connection pool initialized');
  }

  return pool;
}

// Database interface with connection health checks
const database = {
  async query(text: string, params: unknown[] = []) {
    const pool = initializePool();
    const client = await pool.connect();
    try {
      const result = await client.query(text, params);
      return result;
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    } finally {
      client.release();
    }
  },

  async getClient(): Promise<PoolClient> {
    const pool = initializePool();
    return pool.connect();
  },

  async healthCheck(): Promise<boolean> {
    try {
      const result = await this.query('SELECT 1 as health');
      return result.rows[0].health === 1;
    } catch (error) {
      console.error('Database health check failed:', error);
      return false;
    }
  },

  async close(): Promise<void> {
    if (pool) {
      await pool.end();
      pool = null;
      console.log('PostgreSQL connection pool closed');
    }
  }
};

export default database;
export { database };