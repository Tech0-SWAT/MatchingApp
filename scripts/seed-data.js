const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedData() {
  try {
    console.log('SQLiteデータベースへの初期データ投入を開始します...');

    // Product Genres
    const productGenres = [
      '業務効率化・SaaS',
      '教育・学習支援',
      'ヘルスケア・ウェルネス',
      'エンターテイメント・ゲーム',
      'Eコマース・マーケットプレイス',
      'コミュニケーション・SNS',
      'AI・機械学習を活用したプロダクト',
      'ソーシャルグッド・地域活性化',
      'ジャンルには特にこだわらない'
    ];

    for (const genre of productGenres) {
      await prisma.product_genres.create({
        data: { name: genre }
      });
    }
    console.log('✓ Product Genres投入完了');

    // Availability Timeslots
    const timeslots = [
      { description: '平日 朝5時～7時', day_type: 'weekday', sort_order: 1 },
      { description: '平日 7時～9時', day_type: 'weekday', sort_order: 2 },
      { description: '平日 18時～20時', day_type: 'weekday', sort_order: 3 },
      { description: '平日 20時～22時', day_type: 'weekday', sort_order: 4 },
      { description: '平日 22時～24時', day_type: 'weekday', sort_order: 5 },
      { description: '土日祝 8時～10時', day_type: 'weekend_holiday', sort_order: 5 },
      { description: '土日祝 10時～12時', day_type: 'weekend_holiday', sort_order: 6 },
      { description: '土日祝 12時～14時', day_type: 'weekend_holiday', sort_order: 7 },
      { description: '土日祝 14時～16時', day_type: 'weekend_holiday', sort_order: 8 },
      { description: '土日祝 16時～18時', day_type: 'weekend_holiday', sort_order: 9 },
      { description: '土日祝 18時～20時', day_type: 'weekend_holiday', sort_order: 10 },
      { description: '土日祝 20時～22時', day_type: 'weekend_holiday', sort_order: 11 }
    ];

    for (const slot of timeslots) {
      await prisma.availability_timeslots.create({
        data: slot
      });
    }
    console.log('✓ Availability Timeslots投入完了');

    // Team Priorities
    const teamPriorities = [
      'スピード感を持ってどんどん進めたい',
      'じっくり議論し、品質を重視したい',
      '和気あいあいとした雰囲気で楽しく',
      '目標達成に向けてストイックに',
      'オンラインミーティングを頻繁に行いたい',
      '非同期コミュニケーション（チャット等）中心で柔軟に',
      '新しい技術やツールに積極的に挑戦したい',
      'まずは手堅く、実績のある技術で'
    ];

    for (const priority of teamPriorities) {
      await prisma.team_priorities.create({
        data: { name: priority }
      });
    }
    console.log('✓ Team Priorities投入完了');

    // Course Steps
    const courseSteps = [
      { name: 'Step 1', description: '基礎学習ステップ' },
      { name: 'Step 2', description: '応用学習ステップ' },
      { name: 'Step 3', description: '実践学習ステップ' }
    ];

    for (const step of courseSteps) {
      await prisma.course_steps.create({
        data: step
      });
    }
    console.log('✓ Course Steps投入完了');

    // Test Users
    const testUsers = [
      {
        name: '田中 太郎',
        email: 'tanaka@example.com',
        password_hash: '$2a$10$N9qo8uLOickgx2ZMRZoMyu1jqzh0N7mGxhH7zYF9E2.7S0tgvGQN6'
      },
      {
        name: '佐藤 花子',
        email: 'sato@example.com',
        password_hash: '$2a$10$N9qo8uLOickgx2ZMRZoMyu1jqzh0N7mGxhH7zYF9E2.7S0tgvGQN6'
      },
      {
        name: '鈴木 次郎',
        email: 'suzuki@example.com',
        password_hash: '$2a$10$N9qo8uLOickgx2ZMRZoMyu1jqzh0N7mGxhH7zYF9E2.7S0tgvGQN6'
      }
    ];

    for (const user of testUsers) {
      await prisma.users.create({
        data: user
      });
    }
    console.log('✓ Test Users投入完了');

    console.log('\n🎉 SQLiteデータベースへの初期データ投入が完了しました！');
    console.log('\nテストユーザー:');
    console.log('- tanaka@example.com / password123');
    console.log('- sato@example.com / password123');
    console.log('- suzuki@example.com / password123');

  } catch (error) {
    console.error('❌ データ投入エラー:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedData();
