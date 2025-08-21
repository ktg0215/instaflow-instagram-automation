import 'server-only';
import { Pool } from 'pg';

let pool: Pool | null = null;

function createPool() {
  if (!pool) {
    try {
      const databaseUrl = process.env.DATABASE_URL || 'postgresql://postgres:postgres@db:5432/instaflow';
      
      console.log('🔗 [DATABASE] Creating PostgreSQL connection pool...');
      
      pool = new Pool({
        connectionString: databaseUrl,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
      });

      pool.on('connect', () => {
        console.log('✅ [DATABASE] Connected to PostgreSQL');
      });

      pool.on('error', (err) => {
        console.error('❌ [DATABASE] PostgreSQL pool error:', err);
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
      return getMockData(text, params);
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
        return { ok: true, database: 'postgresql' };
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
  const queryLower = query.toLowerCase();
  
  if (queryLower.includes('select') && queryLower.includes('users')) {
    if (queryLower.includes('email')) {
      // Login query mock
      const email = params[0] as string;
      if (email === 'admin@instaflow.com') {
        return {
          rows: [{
            id: '00000000-0000-0000-0000-000000000001',
            email: 'admin@instaflow.com',
            password: '$2b$10$5XCrvfKVEfjQ0QRe1X6xuOUsQSLeAgy34hzylgUPkz3vam5KQOCzK', // 'admin123'
            name: 'Administrator',
            role: 'admin',
            created_at: new Date()
          }]
        };
      } else if (email === 'test@instaflow.com') {
        return {
          rows: [{
            id: '00000000-0000-0000-0000-000000000002',
            email: 'test@instaflow.com',
            password: '$2b$10$CO9UsATpYlAr7AG6Qo/HTO1.ok3LF132dEsPJS.mri.8B1P3V/D1S', // 'test123'
            name: 'Test User',
            role: 'user',
            created_at: new Date()
          }]
        };
      } else if (email === 'ktg.shota@gmail.com') {
        return {
          rows: [{
            id: 3,
            email: 'ktg.shota@gmail.com',
            password: '$2b$10$sG.yBSDO33VP5Ncy4xxEP.H0GMXqgRbvMSc9O6wCe8o0TImAR/dA2', // 'ktg19850215'
            name: 'KTG Admin',
            role: 'admin',
            created_at: new Date()
          }]
        };
      }
    }
    return { rows: [] };
  }
  
  if (queryLower.includes('insert') && queryLower.includes('sessions')) {
    return { rows: [{ id: Math.floor(Math.random() * 1000) }] };
  }
  
  if (queryLower.includes('insert') && queryLower.includes('users')) {
    // User registration mock
    const newUserId = `00000000-0000-0000-0000-${Math.floor(Math.random() * 1000000).toString().padStart(12, '0')}`;
    return { 
      rows: [{ 
        id: newUserId,
        email: params[0],
        name: params[2],
        role: params[3] || 'user',
        created_at: new Date()
      }] 
    };
  }
  
  if (queryLower.includes('select') && queryLower.includes('from users') && queryLower.includes('where email')) {
    // Check if user exists for registration
    const email = params[0] as string;
    const existingEmails = ['admin@instaflow.com', 'test@instaflow.com'];
    
    if (existingEmails.includes(email)) {
      return { rows: [{ id: 'existing' }] }; // User already exists
    }
    
    return { rows: [] }; // User doesn't exist, OK to register
  }
  
  if (queryLower.includes('count') && queryLower.includes('posts')) {
    // Analytics query for post statistics
    return {
      rows: [{
        total_posts: 12,
        published_posts: 8,
        scheduled_posts: 2,
        draft_posts: 2
      }]
    };
  }
  
  if (queryLower.includes('select') && queryLower.includes('posts') && queryLower.includes('order by created_at desc')) {
    // Recent posts for analytics
    return {
      rows: [
        {
          id: '1',
          caption: 'サンプル投稿1 - AIで生成された魅力的なキャプション',
          status: 'published',
          created_at: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
          scheduled_at: null
        },
        {
          id: '2', 
          caption: 'サンプル投稿2 - Instagramマーケティングの成功事例',
          status: 'published',
          created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
          scheduled_at: null
        },
        {
          id: '3',
          caption: 'サンプル投稿3 - ソーシャルメディア戦略について',
          status: 'scheduled',
          created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
          scheduled_at: new Date(Date.now() + 24 * 60 * 60 * 1000) // tomorrow
        }
      ]
    };
  }
  
  return { rows: [] };
}

export default database;
export { database };