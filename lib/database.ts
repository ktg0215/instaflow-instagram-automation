import 'server-only';
import { Pool } from 'pg';

let pool: Pool | null = null;

function createPool() {
  if (!pool) {
    try {
      // 環境変数から接続文字列を取得
      const databaseUrl = process.env.DATABASE_URL;
      
      if (!databaseUrl || databaseUrl.trim() === '') {
        console.log('🚫 [DATABASE] No DATABASE_URL configured, using mock data');
        return null;
      }
      
      console.log('🔗 [DATABASE] Creating Supabase PostgreSQL connection pool...');
      console.log('🔍 [DATABASE] Connection URL:', databaseUrl);
      console.log('🔍 [DATABASE] Raw env:', process.env.DATABASE_URL);
      
      pool = new Pool({
        connectionString: databaseUrl,
        ssl: { rejectUnauthorized: false },
        max: Math.max(2, parseInt(process.env.DB_POOL_MAX || '3')),
        min: 1, // Maintain at least one connection
        idleTimeoutMillis: 30000, // Allow longer idle time  
        connectionTimeoutMillis: 10000, // More tolerance for network issues
        acquireTimeoutMillis: 10000,
        maxUses: 7500, // Prevent connection staleness
      });

      pool.on('connect', () => {
        console.log('✅ [DATABASE] Connected to Supabase PostgreSQL');
      });

      pool.on('error', (err) => {
        console.error('❌ [DATABASE] Supabase PostgreSQL pool error:', err);
      });
      
    } catch (error) {
      console.error('❌ [DATABASE] Failed to create pool:', error);
      pool = null;
    }
  }
  return pool;
}

const database = {
  async query(text: string, params: unknown[] = []) {
    try {
      const pgPool = createPool();
      
      if (!pgPool) {
        throw new Error('Database pool not available');
      }
      
      console.log('🔍 [DATABASE] Executing query:', { 
        query: text.substring(0, 50) + '...', 
        paramCount: params.length 
      });
      
      const client = await pgPool.connect();
      try {
        const result = await client.query(text, params);
        console.log('✅ [DATABASE] Query successful, rows:', result.rows.length);
        return result;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('❌ [DATABASE] Query failed:', error);
      console.log('🔄 [DATABASE] Falling back to mock data');
      const mockResult = getMockData(text, params);
      console.log('🔍 [DATABASE] Mock result:', mockResult);
      return mockResult;
    }
  },
  
  async healthCheck() {
    try {
      const pgPool = createPool();
      if (!pgPool) {
        return { ok: false, error: 'Database pool not available' };
      }
      
      const client = await pgPool.connect();
      try {
        await client.query('SELECT 1');
        return { ok: true, database: 'supabase-postgresql' };
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('❌ [DATABASE] Health check failed:', error);
      return { ok: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
};

function getMockData(query: string, params: unknown[]) {
  console.log('⚠️  [MOCK] Using mock data - database connection failed');
  console.log('💡 [INFO] Please check Supabase connection and run setup script');
  console.log('🔍 [MOCK] Query:', query.substring(0, 100));
  console.log('🔍 [MOCK] Params:', params);
  
  const queryLower = query.toLowerCase();
  
  // Handle user login queries
  if (queryLower.includes('select') && queryLower.includes('users') && queryLower.includes('email')) {
    const email = params[0] as string;
    console.log('🔍 [MOCK] Looking for user with email:', email);
    
    if (email === 'admin@instaflow.com') {
      console.log('✅ [MOCK] Found admin user');
      return {
        rows: [{
          id: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
          email: 'admin@instaflow.com',
          password: '$2b$10$5XCrvfKVEfjQ0QRe1X6xuOUsQSLeAgy34hzylgUPkz3vam5KQOCzK', // admin123
          name: 'システム管理者',
          role: 'admin',
          created_at: new Date()
        }]
      };
    } else if (email === 'user@instaflow.com') {
      console.log('✅ [MOCK] Found regular user');
      return {
        rows: [{
          id: 'c3d4e5f6-a7b8-9012-3456-789012cdefgh',
          email: 'user@instaflow.com',
          password: '$2b$10$CO9UsATpYlAr7AG6Qo/HTO1.ok3LF132dEsPJS.mri.8B1P3V/D1S', // test123
          name: '一般ユーザー',
          role: 'user',
          created_at: new Date()
        }]
      };
    } else if (email === 'ktg.shota@gmail.com') {
      console.log('✅ [MOCK] Found KTG admin user');
      return {
        rows: [{
          id: 'b2c3d4e5-f6a7-8901-2345-678901bcdefg',
          email: 'ktg.shota@gmail.com',
          password: '$2b$10$sG.yBSDO33VP5Ncy4xxEP.H0GMXqgRbvMSc9O6wCe8o0TImAR/dA2', // ktg19850215
          name: 'KTG管理者',
          role: 'admin',
          created_at: new Date()
        }]
      };
    }
    
    console.log('❌ [MOCK] No user found for email:', email);
    return { rows: [] };
  }
  
  console.log('❌ [MOCK] Unhandled query type');
  return { rows: [] };
}

export default database;
export { database };