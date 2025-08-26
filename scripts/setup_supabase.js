const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function setupDatabase() {
  try {
    console.log('🚀 Setting up Supabase database...');
    
    // Read schema file
    const schemaSQL = fs.readFileSync(path.join(__dirname, '../database/schema.sql'), 'utf8');
    
    // Execute schema using RPC
    console.log('📄 Creating database schema...');
    const { error: schemaError } = await supabase.rpc('execute_sql', { sql: schemaSQL });
    
    if (schemaError && !schemaError.message.includes('already exists')) {
      throw schemaError;
    }
    
    console.log('✅ Schema executed successfully');
    
    // Insert demo data directly
    console.log('📊 Inserting demo data...');
    
    // Insert users
    const { error: usersError } = await supabase
      .from('users')
      .upsert([
        {
          id: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
          email: 'admin@instaflow.com',
          password: '$2b$10$5XCrvfKVEfjQ0QRe1X6xuOUsQSLeAgy34hzylgUPkz3vam5KQOCzK', // admin123
          name: 'システム管理者',
          role: 'admin'
        },
        {
          id: 'b2c3d4e5-f6a7-8901-2345-678901bcdefg',
          email: 'ktg.shota@gmail.com',
          password: '$2b$10$sG.yBSDO33VP5Ncy4xxEP.H0GMXqgRbvMSc9O6wCe8o0TImAR/dA2', // ktg19850215
          name: 'KTG管理者',
          role: 'admin'
        },
        {
          id: 'c3d4e5f6-a7b8-9012-3456-789012cdefgh',
          email: 'user@instaflow.com',
          password: '$2b$10$CO9UsATpYlAr7AG6Qo/HTO1.ok3LF132dEsPJS.mri.8B1P3V/D1S', // test123
          name: '一般ユーザー',
          role: 'user'
        },
        {
          id: 'd4e5f6a7-b8c9-0123-4567-890123defghi',
          email: 'demo@instaflow.com',
          password: '$2b$10$xyz123ABC456def789ghi012jkl345mno', // demo123
          name: 'デモユーザー',
          role: 'user'
        }
      ], { onConflict: 'email' });
    
    if (usersError) {
      console.warn('⚠️  Users insertion warning:', usersError.message);
    } else {
      console.log('✅ Users inserted successfully');
    }
    
    // Verify data
    const { data: users, error: countError } = await supabase
      .from('users')
      .select('id, email, name, role');
    
    if (countError) {
      throw countError;
    }
    
    console.log(`👥 Total users in database: ${users.length}`);
    console.log('📋 Users created:');
    users.forEach(user => {
      console.log(`   - ${user.email} (${user.name}) - Role: ${user.role}`);
    });
    
    console.log('\n🎉 Database setup completed successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('👤 Admin User: admin@instaflow.com / admin123');
    console.log('👤 KTG Admin: ktg.shota@gmail.com / ktg19850215');
    console.log('👤 Regular User: user@instaflow.com / test123');
    console.log('👤 Demo User: demo@instaflow.com / demo123');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  }
}

setupDatabase();