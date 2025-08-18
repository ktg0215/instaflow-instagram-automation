const bcrypt = require('bcryptjs');

async function createAdminAccount() {
  console.log('👤 === 管理者アカウント作成スクリプト ===');
  console.log('📅 実行時間:', new Date().toISOString());
  
  // 管理者アカウント情報
  const email = 'ktg.shota@gmail.com';
  const password = 'ktg19850215';
  const name = 'KTG Admin';
  const role = 'admin';
  
  try {
    // パスワードをハッシュ化
    console.log('🔐 パスワードハッシュ化中...');
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('✅ パスワードハッシュ化完了');
    
    // データベース接続
    console.log('🗄️ データベース接続中...');
    const { default: database } = await import('./lib/database.ts');
    
    // ユーザー作成SQL実行
    console.log('👤 管理者アカウント作成中...');
    const result = await database.query(`
      INSERT INTO users (email, password, name, role, created_at, updated_at) 
      VALUES ($1, $2, $3, $4, NOW(), NOW()) 
      ON CONFLICT (email) DO UPDATE SET 
      password = EXCLUDED.password, 
      name = EXCLUDED.name, 
      role = EXCLUDED.role, 
      updated_at = NOW()
      RETURNING id, email, name, role, created_at;
    `, [email, hashedPassword, name, role]);
    
    if (result.rows.length > 0) {
      const user = result.rows[0];
      console.log('✅ === 管理者アカウント作成成功 ===');
      console.log('   👤 ID:', user.id);
      console.log('   📧 Email:', user.email);
      console.log('   🏷️ Name:', user.name);
      console.log('   👑 Role:', user.role);
      console.log('   📅 Created:', user.created_at);
      console.log('');
      console.log('🔑 ログイン情報:');
      console.log('   📧 Email: ' + email);
      console.log('   🔑 Password: ' + password);
      console.log('');
      console.log('🌐 ログインURL: http://localhost:3000/login');
    } else {
      console.log('❌ アカウント作成に失敗しました');
    }
    
  } catch (error) {
    console.error('❌ エラー:', error.message);
    console.error('🔍 詳細:', error);
  }
  
  console.log('🏁 管理者アカウント作成スクリプト完了');
}

createAdminAccount();