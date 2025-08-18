const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

async function addAdminToMockDatabase() {
  console.log('👤 === 管理者アカウントをモックデータに追加 ===');
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
    console.log('🔑 ハッシュ化パスワード:', hashedPassword);
    
    // database.tsファイルを読み込み
    const databasePath = path.join(__dirname, 'lib', 'database.ts');
    let databaseContent = fs.readFileSync(databasePath, 'utf8');
    
    // 新しい管理者アカウントのmockデータを作成
    const newAdminMock = `      } else if (email === '${email}') {
        return {
          rows: [{
            id: 3,
            email: '${email}',
            password: '${hashedPassword}',
            name: '${name}',
            role: '${role}'
          }]
        };`;
    
    // test@instaflow.comの後に新しい管理者アカウントを追加
    const testUserPattern = /(\} else if \(email === 'test@instaflow\.com'\) \{[\s\S]*?\}\]\s*\};\s*)(      \})/;
    
    if (testUserPattern.test(databaseContent)) {
      databaseContent = databaseContent.replace(testUserPattern, `$1${newAdminMock}
$2`);
      
      // ファイルに書き戻し
      fs.writeFileSync(databasePath, databaseContent);
      
      console.log('✅ === 管理者アカウント追加成功 ===');
      console.log('   📧 Email:', email);
      console.log('   🏷️ Name:', name);
      console.log('   👑 Role:', role);
      console.log('   🔑 Password:', password);
      console.log('');
      console.log('🌐 ログインURL: http://localhost:3000/login');
      console.log('');
      console.log('📝 モックデータベースに追加されました。');
      console.log('   ログインして動作確認を行ってください。');
      
    } else {
      console.log('❌ database.tsファイルの構造が予期したものと異なります');
    }
    
  } catch (error) {
    console.error('❌ エラー:', error.message);
    console.error('🔍 詳細:', error);
  }
  
  console.log('🏁 管理者アカウント追加完了');
}

addAdminToMockDatabase();