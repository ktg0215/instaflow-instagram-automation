const bcrypt = require('bcryptjs');

async function generateSecurePasswords() {
    console.log('🔐 新しい安全なパスワードのハッシュを生成中...');
    
    // 安全なパスワードを生成
    const adminPassword = 'SecureAdmin2024!';
    const testPassword = 'TestUser2024@';
    
    // ハッシュ生成
    const adminHash = await bcrypt.hash(adminPassword, 10);
    const testHash = await bcrypt.hash(testPassword, 10);
    
    console.log('\n📊 新しいアカウント情報:');
    console.log('='.repeat(50));
    console.log(`👑 管理者アカウント:`);
    console.log(`   メール: admin@instaflow.com`);
    console.log(`   パスワード: ${adminPassword}`);
    console.log(`   ハッシュ: ${adminHash}`);
    console.log();
    console.log(`👤 テストアカウント:`);
    console.log(`   メール: test@instaflow.com`);
    console.log(`   パスワード: ${testPassword}`);
    console.log(`   ハッシュ: ${testHash}`);
    console.log('='.repeat(50));
    
    // 検証テスト
    console.log('\n🔍 ハッシュ検証テスト:');
    const adminMatch = await bcrypt.compare(adminPassword, adminHash);
    const testMatch = await bcrypt.compare(testPassword, testHash);
    
    console.log(`管理者パスワード検証: ${adminMatch ? '✅ 正常' : '❌ 失敗'}`);
    console.log(`テストパスワード検証: ${testMatch ? '✅ 正常' : '❌ 失敗'}`);
    
    console.log('\n📝 これらのハッシュをdatabase.tsファイルに更新してください。');
}

generateSecurePasswords().catch(console.error);