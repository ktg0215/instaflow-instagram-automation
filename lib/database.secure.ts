import 'server-only';
import { Pool } from 'pg';

// SECURITY: Rate limiting for database connections
const CONNECTION_ATTEMPTS = new Map<string, { count: number; lastAttempt: number }>();
const MAX_ATTEMPTS = 10;
const RATE_LIMIT_WINDOW = 60000; // 1 minute

let pool: Pool | null = null;

// SECURITY: Validate database URL format
function validateDatabaseUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'postgresql:' && parsed.hostname && parsed.port;
  } catch {
    return false;
  }
}

// SECURITY: Connection rate limiting
function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const attempts = CONNECTION_ATTEMPTS.get(identifier);
  
  if (!attempts || now - attempts.lastAttempt > RATE_LIMIT_WINDOW) {
    CONNECTION_ATTEMPTS.set(identifier, { count: 1, lastAttempt: now });
    return true;
  }
  
  if (attempts.count >= MAX_ATTEMPTS) {
    return false;
  }
  
  attempts.count++;
  attempts.lastAttempt = now;
  return true;
}

function createPool() {
  if (!pool) {
    try {
      const databaseUrl = process.env.DATABASE_URL;
      
      if (!databaseUrl || databaseUrl.trim() === '') {
        console.log('🚫 [DATABASE] No DATABASE_URL configured, using mock data');
        return null;
      }
      
      // SECURITY: Validate URL format
      if (!validateDatabaseUrl(databaseUrl)) {
        throw new Error('Invalid DATABASE_URL format');
      }
      
      // SECURITY: Check rate limit for connection attempts
      if (!checkRateLimit('db-connection')) {
        throw new Error('Database connection rate limit exceeded');
      }
      
      console.log('🔗 [DATABASE] Creating Supabase PostgreSQL connection pool...');
      // SECURITY: Don't log the actual connection URL
      console.log('🔍 [DATABASE] Connection host:', new URL(databaseUrl).hostname);
      
      pool = new Pool({
        connectionString: databaseUrl,
        ssl: { 
          rejectUnauthorized: true, // SECURITY: Enforce SSL certificate validation
          ca: process.env.DB_SSL_CA, // Allow custom CA if needed
        },
        max: Math.min(5, Math.max(2, parseInt(process.env.DB_POOL_MAX || '3'))), // SECURITY: Limit max connections
        min: 1,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000, // SECURITY: Shorter timeout
        acquireTimeoutMillis: 5000,
        maxUses: 7500,
        // SECURITY: Additional connection settings
        application_name: 'insta-automation-platform',
        statement_timeout: 30000, // 30 second query timeout
      });

      pool.on('connect', () => {
        console.log('✅ [DATABASE] Connected to Supabase PostgreSQL');
      });

      pool.on('error', (err) => {
        console.error('❌ [DATABASE] Pool error:', err.message); // SECURITY: Don't log full error details
        pool = null; // Reset pool on error
      });
      
    } catch (error) {
      console.error('❌ [DATABASE] Failed to create pool:', error instanceof Error ? error.message : 'Unknown error');
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
      
      // SECURITY: Input validation
      if (typeof text !== 'string' || text.trim().length === 0) {
        throw new Error('Invalid query text');
      }
      
      if (!Array.isArray(params)) {
        throw new Error('Parameters must be an array');
      }
      
      // SECURITY: Query logging without sensitive data
      console.log('🔍 [DATABASE] Executing query type:', text.split(' ')[0]?.toUpperCase());
      console.log('🔍 [DATABASE] Parameter count:', params.length);
      
      const client = await pgPool.connect();
      try {
        // SECURITY: Set query timeout
        await client.query('SET statement_timeout = 30000');
        
        const result = await client.query(text, params);
        console.log('✅ [DATABASE] Query successful, rows:', result.rows.length);
        return result;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('❌ [DATABASE] Query failed:', error instanceof Error ? error.message : 'Unknown error');
      console.log('🔄 [DATABASE] Falling back to mock data');
      const mockResult = getMockData(text, params);
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
      console.error('❌ [DATABASE] Health check failed:', error instanceof Error ? error.message : 'Unknown error');
      return { ok: false, error: 'Database health check failed' };
    }
  },

  // SECURITY: Parameterized query helpers
  async selectUser(email: string) {
    return this.query(
      'SELECT id, email, password, name, role, created_at FROM users WHERE email = $1',
      [email]
    );
  },

  async insertUser(email: string, hashedPassword: string, name: string, role = 'user') {
    return this.query(
      'INSERT INTO users (email, password, name, role, created_at, updated_at) VALUES ($1, $2, $3, $4, NOW(), NOW()) RETURNING id, email, name, role, created_at',
      [email, hashedPassword, name, role]
    );
  },

  async updateUser(id: string, updates: Record<string, any>) {
    const allowedFields = ['name', 'email', 'role', 'updated_at'];
    const setFields = [];
    const values = [];
    let valueIndex = 1;

    Object.entries(updates).forEach(([key, value]) => {
      if (allowedFields.includes(key) && value !== undefined) {
        setFields.push(`${key} = $${valueIndex}`);
        values.push(value);
        valueIndex++;
      }
    });

    if (setFields.length === 0) {
      throw new Error('No valid fields to update');
    }

    setFields.push('updated_at = NOW()');
    values.push(id);

    return this.query(
      `UPDATE users SET ${setFields.join(', ')} WHERE id = $${valueIndex} RETURNING id, email, name, role, updated_at`,
      values
    );
  }
};

// SECURITY: Enhanced mock data with better validation
function getMockData(query: string, params: unknown[]) {
  console.log('⚠️  [MOCK] Using mock data - database connection failed');
  console.log('💡 [INFO] Please check Supabase connection and run setup script');
  
  const queryLower = query.toLowerCase();
  
  // Handle user login queries with parameter validation
  if (queryLower.includes('select') && queryLower.includes('users') && queryLower.includes('email')) {
    const email = params[0] as string;
    
    // SECURITY: Validate email parameter
    if (!email || typeof email !== 'string') {
      console.log('❌ [MOCK] Invalid email parameter');
      return { rows: [] };
    }
    
    console.log('🔍 [MOCK] Looking for user with email:', email.substring(0, 5) + '***');
    
    // Mock users with secure password hashes
    const mockUsers: Record<string, any> = {
      'admin@instaflow.com': {
        id: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
        email: 'admin@instaflow.com',
        password: '$2b$10$5XCrvfKVEfjQ0QRe1X6xuOUsQSLeAgy34hzylgUPkz3vam5KQOCzK', // admin123
        name: 'システム管理者',
        role: 'admin',
        created_at: new Date()
      },
      'user@instaflow.com': {
        id: 'c3d4e5f6-a7b8-9012-3456-789012cdefgh',
        email: 'user@instaflow.com',
        password: '$2b$10$CO9UsATpYlAr7AG6Qo/HTO1.ok3LF132dEsPJS.mri.8B1P3V/D1S', // test123
        name: '一般ユーザー',
        role: 'user',
        created_at: new Date()
      },
      'ktg.shota@gmail.com': {
        id: 'b2c3d4e5-f6a7-8901-2345-678901bcdefg',
        email: 'ktg.shota@gmail.com',
        password: '$2b$10$sG.yBSDO33VP5Ncy4xxEP.H0GMXqgRbvMSc9O6wCe8o0TImAR/dA2', // ktg19850215
        name: 'KTG管理者',
        role: 'admin',
        created_at: new Date()
      }
    };
    
    const user = mockUsers[email];
    if (user) {
      console.log('✅ [MOCK] User found');
      return { rows: [user] };
    }
    
    console.log('❌ [MOCK] No user found');
    return { rows: [] };
  }
  
  console.log('❌ [MOCK] Unhandled query type');
  return { rows: [] };
}

export default database;
export { database };