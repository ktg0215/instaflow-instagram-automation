// Temporary mock database for development when PostgreSQL is not available
interface MockUser {
  id: number;
  email: string;
  password_hash: string;
  name: string;
  role: string;
  google_id?: string;
  profile_picture_url?: string;
  created_at: Date;
}

class MockDatabase {
  private users: MockUser[] = [
    {
      id: 1,
      email: 'admin@example.com',
      password_hash: '$2a$12$SZxRk44tsq0zfuSCEPOZNui9JdnxSAT9/AOLqFqZJfyImu86Q4KKK', // password: admin123
      name: 'Admin User',
      role: 'admin',
      created_at: new Date()
    },
    {
      id: 2,
      email: 'user@example.com',
      password_hash: '$2a$12$SZxRk44tsq0zfuSCEPOZNui9JdnxSAT9/AOLqFqZJfyImu86Q4KKK', // password: admin123
      name: 'Regular User',
      role: 'user',
      created_at: new Date()
    }
  ];
  private nextId = 3;

  async query(text: string, params: any[] = []): Promise<{ rows: any[]; rowCount: number }> {
    // Parse basic SQL queries for user operations
    const sqlLower = text.toLowerCase();
    
    if (sqlLower.includes('select') && sqlLower.includes('from users')) {
      if (sqlLower.includes('where email =')) {
        const email = params[0];
        const user = this.users.find(u => u.email === email);
        return { rows: user ? [user] : [], rowCount: user ? 1 : 0 };
      }
      if (sqlLower.includes('where id =')) {
        const id = params[0];
        const user = this.users.find(u => u.id === id);
        return { rows: user ? [user] : [], rowCount: user ? 1 : 0 };
      }
    }
    
    if (sqlLower.includes('insert into users')) {
      const [email, password_hash, name, role, google_id, profile_picture_url] = params;
      const newUser: MockUser = {
        id: this.nextId++,
        email,
        password_hash,
        name,
        role,
        google_id,
        profile_picture_url,
        created_at: new Date()
      };
      this.users.push(newUser);
      return { rows: [newUser], rowCount: 1 };
    }
    
    // Default empty result
    return { rows: [], rowCount: 0 };
  }
}

export default new MockDatabase();