const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function fixPasswords() {
  try {
    console.log('パスワードハッシュを修正中...');
    
    // password123のハッシュを新しく生成
    const passwordHash = await bcrypt.hash('password123', 10);
    console.log('新しいハッシュ:', passwordHash);
    
    // すべてのテストユーザーのパスワードを更新
    const updateResults = await Promise.all([
      prisma.users.update({
        where: { email: 'tanaka@example.com' },
        data: { password_hash: passwordHash }
      }),
      prisma.users.update({
        where: { email: 'sato@example.com' },
        data: { password_hash: passwordHash }
      }),
      prisma.users.update({
        where: { email: 'suzuki@example.com' },
        data: { password_hash: passwordHash }
      })
    ]);
    
    console.log('✓ パスワードハッシュの修正完了');
    console.log('更新されたユーザー:', updateResults.length, '人');
    
    // 検証用にbcrypt.compareをテスト
    const testUser = await prisma.users.findUnique({
      where: { email: 'tanaka@example.com' }
    });
    
    const isValid = await bcrypt.compare('password123', testUser.password_hash);
    console.log('パスワード検証テスト:', isValid ? '✅ 成功' : '❌ 失敗');
    
  } catch (error) {
    console.error('エラー:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixPasswords();
