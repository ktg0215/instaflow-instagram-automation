const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres.toxslmnnomfdkwtamvhk:xb87Jv_PB4LzFt%3F@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
});

async function setupDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Setting up Supabase database...');
    
    // Read and execute schema
    const schemaSQL = fs.readFileSync(path.join(__dirname, '../database/schema.sql'), 'utf8');
    console.log('📄 Executing schema...');
    await client.query(schemaSQL);
    console.log('✅ Schema created successfully');
    
    // Read and execute demo data
    const demoDataSQL = fs.readFileSync(path.join(__dirname, '../database/demo_data.sql'), 'utf8');
    console.log('📊 Inserting demo data...');
    await client.query(demoDataSQL);
    console.log('✅ Demo data inserted successfully');
    
    // Verify data
    const result = await client.query('SELECT COUNT(*) as user_count FROM users');
    console.log(`👥 Total users in database: ${result.rows[0].user_count}`);
    
    const posts = await client.query('SELECT COUNT(*) as post_count FROM posts');
    console.log(`📝 Total posts in database: ${posts.rows[0].post_count}`);
    
    console.log('🎉 Database setup completed successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('👤 Admin User: admin@instaflow.com / admin123');
    console.log('👤 KTG Admin: ktg.shota@gmail.com / ktg19850215');
    console.log('👤 Regular User: user@instaflow.com / test123');
    console.log('👤 Demo User: demo@instaflow.com / demo123');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

setupDatabase();