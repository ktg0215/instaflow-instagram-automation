const bcrypt = require('bcryptjs');

async function generateCorrectHash() {
    console.log('🔐 正確なパスワードハッシュの生成...');
    
    // admin123 の正確なハッシュを生成
    const adminPassword = 'admin123';
    const adminHash = await bcrypt.hash(adminPassword, 10);
    
    console.log('\\n📊 結果:');
    console.log('='.repeat(50));
    console.log(`パスワード: ${adminPassword}`);
    console.log(`ハッシュ: ${adminHash}`);
    console.log('='.repeat(50));
    
    // 検証テスト
    const isMatch = await bcrypt.compare(adminPassword, adminHash);
    console.log(`\\n🔍 検証結果: ${isMatch ? '✅ 正常' : '❌ 失敗'}`);
    
    // SecureAdmin2024! のハッシュも再生成
    const securePassword = 'SecureAdmin2024!';
    const secureHash = await bcrypt.hash(securePassword, 10);
    const secureMatch = await bcrypt.compare(securePassword, secureHash);
    
    console.log('\\n🔒 安全なパスワード:');
    console.log(`パスワード: ${securePassword}`);
    console.log(`ハッシュ: ${secureHash}`);
    console.log(`検証結果: ${secureMatch ? '✅ 正常' : '❌ 失敗'}`);
}

generateCorrectHash().catch(console.error);