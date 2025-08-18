import 'server-only';

const database = {
  async query(text: string, params: unknown[] = []) {
    // Skip PostgreSQL entirely for development - go straight to mock data
    console.log('🎭 Using mock data for development (PostgreSQL disabled)');
    return getMockData(text, params);
  },
  
  async healthCheck() {
    return { ok: true, database: 'mock-data', warning: 'Using mock data for development' };
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
            id: 1,
            email: 'admin@instaflow.com',
            password: '$2b$10$BZkNGJLJaeJJB7.pzOtGhO8wB7w2U7FIlkxcVzYoBbNPAUSZRu2TC', // 'admin123' - working hash
            name: 'Admin User',
            role: 'admin'
          }]
        };
      } else if (email === 'test@instaflow.com') {
        return {
          rows: [{
            id: 2,
            email: 'test@instaflow.com',
            password: '$2b$10$D4h13a68pGIG7mGKXQoUcuc.CgHhtfjCdAY9eHDUofgx.MkZ9PyMC', // 'TestUser2024@'
            name: 'Test User',
            role: 'user'
          }]
        };
      } else if (email === 'ktg.shota@gmail.com') {
        return {
          rows: [{
            id: 3,
            email: 'ktg.shota@gmail.com',
            password: '$2b$10$sG.yBSDO33VP5Ncy4xxEP.H0GMXqgRbvMSc9O6wCe8o0TImAR/dA2', // 'ktg19850215'
            name: 'KTG Admin',
            role: 'admin'
          }]
        };
      }
    }
    return { rows: [] };
  }
  
  if (queryLower.includes('insert') && queryLower.includes('sessions')) {
    return { rows: [{ id: Math.floor(Math.random() * 1000) }] };
  }
  
  return { rows: [] };
}

export default database;
export { database };