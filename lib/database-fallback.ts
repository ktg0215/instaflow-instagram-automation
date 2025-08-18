import 'server-only';
import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';

let db: Database | null = null;

async function getDatabase() {
  if (db) return db;
  
  const dbPath = path.join(process.cwd(), 'local-database.sqlite');
  
  db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });
  
  // Create tables if they don't exist
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT,
      role TEXT DEFAULT 'user',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      session_token TEXT UNIQUE NOT NULL,
      expires DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    );
    
    -- Insert default admin user if not exists
    INSERT OR IGNORE INTO users (id, email, password, name, role) 
    VALUES (1, 'admin@instaflow.com', '$2a$10$rXqJv5eqQJKdQ7bQ7QFbAeJ8P8tJ7d6t7Q5bQ7QFbAeJ8P8tJ7d6t', 'Admin User', 'admin');
    
    INSERT OR IGNORE INTO users (id, email, password, name, role) 
    VALUES (2, 'test@instaflow.com', '$2a$10$rXqJv5eqQJKdQ7bQ7QFbAeJ8P8tJ7d6t7Q5bQ7QFbAeJ8P8tJ7d6t', 'Test User', 'user');
  `);
  
  console.log('✅ SQLite database initialized');
  return db;
}

export const databaseFallback = {
  async query(text: string, params: any[] = []) {
    const db = await getDatabase();
    
    // Convert PostgreSQL syntax to SQLite
    let sqliteQuery = text;
    
    // Handle RETURNING clause (not supported in SQLite)
    if (sqliteQuery.includes('RETURNING')) {
      const baseQuery = sqliteQuery.split('RETURNING')[0].trim();
      const result = await db.run(baseQuery, params);
      
      if (sqliteQuery.toLowerCase().includes('insert')) {
        // For INSERT queries, return the inserted row
        const insertedRow = await db.get('SELECT * FROM users WHERE id = ?', [result.lastID]);
        return { rows: [insertedRow] };
      }
      
      return { rows: [{ id: result.lastID }] };
    }
    
    // Handle different query types
    if (sqliteQuery.toLowerCase().startsWith('select')) {
      const rows = await db.all(sqliteQuery, params);
      return { rows };
    } else {
      const result = await db.run(sqliteQuery, params);
      return { rows: [{ affected: result.changes }] };
    }
  }
};