// prisma/seed.ts
require("dotenv").config({ path: "./.env" }); // ★ この行を一番上に追加

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");
  console.log("DATABASE_URL being used by seed script:", process.env.DATABASE_URL); // ★ 追加：デバッグ用

  // 既存のデータを削除（冪等性を保つため、毎回実行できるように）
  await prisma.team_memberships.deleteMany({});
  await prisma.teams.deleteMany({});
  await prisma.course_steps.deleteMany({});
  await prisma.user_product_genres.deleteMany({});
  await prisma.user_availabilities.deleteMany({});
  await prisma.user_team_priorities.deleteMany({});
  await prisma.user_profiles.deleteMany({});
  await prisma.users.deleteMany({});
  await prisma.product_genres.deleteMany({});
  await prisma.availability_timeslots.deleteMany({});
  await prisma.team_priorities.deleteMany({});

  const hashedPassword1 = await bcrypt.hash("Soarainori1", 10);
  const hashedPassword2 = await bcrypt.hash("password_sato", 10);
  const hashedPassword3 = await bcrypt.hash("password_suzuki", 10);
  const hashedPassword4 = await bcrypt.hash("password_yamada", 10);
  const hashedPassword5 = await bcrypt.hash("password_ito", 10);
  const hashedPassword6 = await bcrypt.hash("password_takahashi", 10);

  // ... (users テーブル以下のデータ作成ロジックはそのまま) ...
  const user1 = await prisma.users.create({ data: { id: 1, name: "田中 太郎", email: "tanaka@example.com", password_hash: hashedPassword1 } });
  const user2 = await prisma.users.create({ data: { id: 2, name: "佐藤 花子", email: "sato@example.com", password_hash: hashedPassword2 } });
  const user3 = await prisma.users.create({ data: { id: 3, name: "鈴木 次郎", email: "suzuki@example.com", password_hash: hashedPassword3 } });
  const user4 = await prisma.users.create({ data: { id: 4, name: "山田 美咲", email: "yamada@example.com", password_hash: hashedPassword4 } });
  const user5 = await prisma.users.create({ data: { id: 5, name: "伊藤 健太", email: "ito@example.com", password_hash: hashedPassword5 } });
  const user6 = await prisma.users.create({ data: { id: 6, name: "高橋 優子", email: "takahashi@example.com", password_hash: hashedPassword6 } });

  await prisma.user_profiles.createMany({
    data: [
      { user_id: user1.id, personality_type: "INTJ", idea_status: "has_specific_idea", desired_role_in_team: "tech_lead", self_introduction_comment: "機械学習エンジニアとして3年の経験があります。特にディープラーニングを用いた画像解析が得意です。" },
      { user_id: user2.id, personality_type: "ENFP", idea_status: "wants_to_brainstorm", desired_role_in_team: "design_ux", self_introduction_comment: "フロントエンド開発とUXデザインの両方を手がけています。ユーザーの声を大切にしたプロダクト作りを心がけています。" },
      { user_id: user3.id, personality_type: "ISTJ", idea_status: "wants_to_participate", desired_role_in_team: "developer_main", self_introduction_comment: "バックエンド開発が得意です。堅実な開発を心がけています。" },
      { user_id: user4.id, personality_type: "ENFJ", idea_status: "has_rough_theme", desired_role_in_team: "pm_management", self_introduction_comment: "プロジェクトマネジメント経験豊富です。チームをまとめて成果を出すのが好きです。" },
      { user_id: user5.id, personality_type: "ESTP", idea_status: "has_specific_idea", desired_role_in_team: "biz_planning", self_introduction_comment: "新規事業立ち上げに興味があります。ビジネスサイドからプロダクトを考えたいです。" },
      { user_id: user6.id, personality_type: "INFP", idea_status: "wants_to_brainstorm", desired_role_in_team: "support_member", self_introduction_comment: "チーム開発のサポートやドキュメント作成が得意です。" },
    ],
  });

  const genre1 = await prisma.product_genres.create({ data: { id: 1, name: "業務効率化・SaaS" } });
  const genre2 = await prisma.product_genres.create({ data: { id: 2, name: "教育・学習支援" } });
  const genre3 = await prisma.product_genres.create({ data: { id: 3, name: "ヘルスケア・ウェルネス" } });
  const genre4 = await prisma.product_genres.create({ data: { id: 4, name: "エンターテイメント・ゲーム" } });
  const genre5 = await prisma.product_genres.create({ data: { id: 5, name: "Eコマース・マーケットプレイス" } });
  const genre6 = await prisma.product_genres.create({ data: { id: 6, name: "コミュニケーション・SNS" } });
  const genre7 = await prisma.product_genres.create({ data: { id: 7, name: "AI・機械学習を活用したプロダクト" } });
  const genre8 = await prisma.product_genres.create({ data: { id: 8, name: "ソーシャルグッド・地域活性化" } });
  const genre9 = await prisma.product_genres.create({ data: { id: 9, name: "ジャンルには特にこだわらない" } });

  await prisma.user_product_genres.createMany({
    data: [
      { user_id: user1.id, product_genre_id: genre7.id },
      { user_id: user1.id, product_genre_id: genre8.id },
      { user_id: user1.id, product_genre_id: genre3.id },
      { user_id: user2.id, product_genre_id: genre2.id },
      { user_id: user2.id, product_genre_id: genre6.id },
      { user_id: user2.id, product_genre_id: genre9.id },
      { user_id: user3.id, product_genre_id: genre1.id },
      { user_id: user3.id, product_genre_id: genre5.id },
      { user_id: user4.id, product_genre_id: genre2.id },
      { user_id: user4.id, product_genre_id: genre4.id },
      { user_id: user5.id, product_genre_id: genre1.id },
      { user_id: user5.id, product_genre_id: genre9.id },
    ],
  });

  const ts1 = await prisma.availability_timeslots.create({ data: { id: 1, description: "平日 朝5時～7時", day_type: "weekday", sort_order: 1 } });
  const ts2 = await prisma.availability_timeslots.create({ data: { id: 2, description: "平日 7時～9時", day_type: "weekday", sort_order: 2 } });
  const ts3 = await prisma.availability_timeslots.create({ data: { id: 3, description: "平日 18時～20時", day_type: "weekday", sort_order: 3 } });
  const ts4 = await prisma.availability_timeslots.create({ data: { id: 4, description: "平日 20時～22時", day_type: "weekday", sort_order: 4 } });
  const ts5 = await prisma.availability_timeslots.create({ data: { id: 5, description: "平日 22時～24時", day_type: "weekday", sort_order: 5 } });
  const ts6 = await prisma.availability_timeslots.create({ data: { id: 6, description: "平日 いつでも良い", day_type: "weekday", sort_order: 6 } });
  const ts7 = await prisma.availability_timeslots.create({ data: { id: 7, description: "平日 特に希望なし", day_type: "weekday", sort_order: 7 } });
  const ts8 = await prisma.availability_timeslots.create({ data: { id: 8, description: "土日祝 0時～2時", day_type: "weekend_holiday", sort_order: 1 } });
  const ts9 = await prisma.availability_timeslots.create({ data: { id: 9, description: "土日祝 2時～4時", day_type: "weekend_holiday", sort_order: 2 } });
  const ts10 = await prisma.availability_timeslots.create({ data: { id: 10, description: "土日祝 4時～6時", day_type: "weekend_holiday", sort_order: 3 } });
  const ts11 = await prisma.availability_timeslots.create({ data: { id: 11, description: "土日祝 6時～8時", day_type: "weekend_holiday", sort_order: 4 } });
  const ts12 = await prisma.availability_timeslots.create({ data: { id: 12, description: "土日祝 8時～10時", day_type: "weekend_holiday", sort_order: 5 } });
  const ts13 = await prisma.availability_timeslots.create({ data: { id: 13, description: "土日祝 10時～12時", day_type: "weekend_holiday", sort_order: 6 } });
  const ts14 = await prisma.availability_timeslots.create({ data: { id: 14, description: "土日祝 12時～14時", day_type: "weekend_holiday", sort_order: 7 } });
  const ts15 = await prisma.availability_timeslots.create({ data: { id: 15, description: "土日祝 14時～16時", day_type: "weekend_holiday", sort_order: 8 } });
  const ts16 = await prisma.availability_timeslots.create({ data: { id: 16, description: "土日祝 16時～18時", day_type: "weekend_holiday", sort_order: 9 } });
  const ts17 = await prisma.availability_timeslots.create({ data: { id: 17, description: "土日祝 18時～20時", day_type: "weekend_holiday", sort_order: 10 } });
  const ts18 = await prisma.availability_timeslots.create({ data: { id: 18, description: "土日祝 20時～22時", day_type: "weekend_holiday", sort_order: 11 } });
  const ts19 = await prisma.availability_timeslots.create({ data: { id: 19, description: "土日祝 22時～24時", day_type: "weekend_holiday", sort_order: 12 } });
  const ts20 = await prisma.availability_timeslots.create({ data: { id: 20, description: "土日祝 いつでも良い", day_type: "weekend_holiday", sort_order: 13 } });
  const ts21 = await prisma.availability_timeslots.create({ data: { id: 21, description: "土日祝 特に希望なし", day_type: "weekend_holiday", sort_order: 14 } });

  // -----------------------------------------------------
  // 6. user_availabilities Table
  // -----------------------------------------------------
  await prisma.user_availabilities.createMany({
    data: [
      { user_id: user1.id, timeslot_id: ts4.id },
      { user_id: user1.id, timeslot_id: ts5.id },
      { user_id: user1.id, timeslot_id: ts12.id },
      { user_id: user1.id, timeslot_id: ts13.id },
      { user_id: user2.id, timeslot_id: ts3.id },
      { user_id: user2.id, timeslot_id: ts15.id },
      { user_id: user2.id, timeslot_id: ts16.id },
      { user_id: user2.id, timeslot_id: ts17.id },
      { user_id: user3.id, timeslot_id: ts1.id },
      { user_id: user3.id, timeslot_id: ts2.id },
      { user_id: user3.id, timeslot_id: ts8.id },
      { user_id: user4.id, timeslot_id: ts6.id },
      { user_id: user4.id, timeslot_id: ts20.id },
      { user_id: user5.id, timeslot_id: ts4.id },
      { user_id: user5.id, timeslot_id: ts14.id },
    ],
  });

  // -----------------------------------------------------
  // 7. team_priorities Table
  // -----------------------------------------------------
  const tp1 = await prisma.team_priorities.create({ data: { id: 1, name: "スピード感を持ってどんどん進めたい" } });
  const tp2 = await prisma.team_priorities.create({ data: { id: 2, name: "じっくり議論し、品質を重視したい" } });
  const tp3 = await prisma.team_priorities.create({ data: { id: 3, name: "和気あいあいとした雰囲気で楽しく" } });
  const tp4 = await prisma.team_priorities.create({ data: { id: 4, name: "目標達成に向けてストイックに" } });
  const tp5 = await prisma.team_priorities.create({ data: { id: 5, name: "オンラインミーティングを頻繁に行いたい" } });
  const tp6 = await prisma.team_priorities.create({ data: { id: 6, name: "非同期コミュニケーション（チャット等）中心で柔軟に" } });
  const tp7 = await prisma.team_priorities.create({ data: { id: 7, name: "新しい技術やツールに積極的に挑戦したい" } });
  const tp8 = await prisma.team_priorities.create({ data: { id: 8, name: "まずは手堅く、実績のある技術で" } });

  // -----------------------------------------------------
  // 8. user_team_priorities Table
  // -----------------------------------------------------
  await prisma.user_team_priorities.createMany({
    data: [
      { user_id: user1.id, team_priority_id: tp1.id },
      { user_id: user1.id, team_priority_id: tp7.id },
      { user_id: user2.id, team_priority_id: tp3.id },
      { user_id: user2.id, team_priority_id: tp2.id },
      { user_id: user3.id, team_priority_id: tp4.id },
      { user_id: user3.id, team_priority_id: tp8.id },
      { user_id: user4.id, team_priority_id: tp3.id },
      { user_id: user4.id, team_priority_id: tp5.id },
      { user_id: user5.id, team_priority_id: tp1.id },
      { user_id: user5.id, team_priority_id: tp7.id },
    ],
  });

  // -----------------------------------------------------
  // 9. course_steps Table (Step 1, 2, 3 のみを作成)
  // ★ ここを修正：過去の期の作成を削除する ★
  // const cs101 = await prisma.course_steps.create({ data: { id: 101, name: '2023年冬期 Web開発コース', start_date: new Date('2023-10-01'), end_date: new Date('2023-12-31'), description: '2023年10月開始のWeb開発コース' } });
  // const cs102 = await prisma.course_steps.create({ data: { id: 102, name: '2024年春期 AI講座', start_date: new Date('2024-01-15'), end_date: new Date('2024-04-15'), description: '2024年1月開始のAI講座' } });
  // const cs103 = await prisma.course_steps.create({ data: { id: 103, name: '2024年夏期 モバイルアプリ開発', start_date: new Date('2024-05-01'), end_date: new Date('2024-08-31'), description: '2024年5月開始のモバイルアプリ開発コース' } });

  const cs1 = await prisma.course_steps.create({ data: { id: 1, name: "Step 1", start_date: new Date("2024-04-01"), end_date: new Date("2024-06-30"), description: "基礎学習ステップ" } });
  const cs2 = await prisma.course_steps.create({ data: { id: 2, name: "Step 2", start_date: new Date("2024-07-01"), end_date: new Date("2024-09-30"), description: "応用学習ステップ" } });
  const cs3 = await prisma.course_steps.create({ data: { id: 3, name: "Step 3", start_date: new Date("2024-10-01"), end_date: new Date("2024-12-31"), description: "実践学習ステップ" } });

  // -----------------------------------------------------
  // 10. teams Table (関連する course_step_id を Step 1, 2, 3 のみに修正)
  // ★ ここを修正：過去の期を参照しているチームを削除または修正する ★
  // const team1 = await prisma.teams.create({ data: { id: 1, course_step_id: cs101.id, name: '旧チームA', project_name: '社内ツール開発' } });
  // const team2 = await prisma.teams.create({ data: { id: 2, course_step_id: cs102.id, name: '旧チームB', project_name: '画像認識AIアプリ' } });
  // const team3 = await prisma.teams.create({ data: { id: 3, course_step_id: cs103.id, name: '旧チームC', project_name: 'フィットネスアプリ' } });

  const team4 = await prisma.teams.create({ data: { id: 4, course_step_id: cs1.id, name: "現行チームX", project_name: "学習管理システム" } });
  const team5 = await prisma.teams.create({ data: { id: 5, course_step_id: cs2.id, name: "現行チームY", project_name: "AIチャットボット" } });
  const team6 = await prisma.teams.create({ data: { id: 6, course_step_id: cs3.id, name: "現行チームZ", project_name: "モバイルアプリ" } });

  // -----------------------------------------------------
  // 11. team_memberships Table (関連する team_id を現行チームのみに修正)
  // ★ ここを修正：過去のチームを参照しているメンバーシップを削除する ★
  await prisma.team_memberships.createMany({
    data: [
      // 旧チームのメンバーシップを削除する
      // { id: 1, team_id: team1.id, user_id: user1.id, role_in_team: 'Leader', joined_at: new Date('2023-11-01T10:00:00Z'), left_at: new Date('2023-12-31T23:59:59Z') },
      // { id: 2, team_id: team1.id, user_id: user2.id, role_in_team: 'Developer', joined_at: new Date('2023-11-01T10:00:00Z'), left_at: new Date('2023-12-31T23:59:59Z') },
      // { id: 3, team_id: team2.id, user_id: user1.id, role_in_team: 'Developer', joined_at: new Date('2024-02-01T11:00:00Z'), left_at: new Date('2024-04-15T23:59:59Z') },
      // { id: 4, team_id: team2.id, user_id: user4.id, role_in_team: 'PM', joined_at: new Date('2024-02-01T11:00:00Z'), left_at: new Date('2024-04-15T23:59:59Z') },
      // { id: 5, team_id: team3.id, user_id: user1.id, role_in_team: 'Tech Lead', joined_at: new Date('2024-06-01T12:00:00Z'), left_at: new Date('2024-08-31T23:59:59Z') },
      // { id: 6, team_id: team3.id, user_id: user5.id, role_in_team: 'Biz', joined_at: new Date('2024-06-01T12:00:00Z'), left_at: new Date('2024-08-31T23:59:59Z') },

      // 現行チームX (course_step_id = 1)
      { id: 7, team_id: team4.id, user_id: user1.id, role_in_team: "Tech Lead", joined_at: new Date() },
      { id: 8, team_id: team4.id, user_id: user2.id, role_in_team: "Designer", joined_at: new Date() },
      { id: 9, team_id: team4.id, user_id: user3.id, role_in_team: "Developer", joined_at: new Date() },

      // 現行チームY (course_step_id = 2)
      { id: 10, team_id: team5.id, user_id: user1.id, role_in_team: "Developer", joined_at: new Date() },
      { id: 11, team_id: team5.id, user_id: user4.id, role_in_team: "PM", joined_at: new Date() },

      // 現行チームZ (course_step_id = 3)
      { id: 12, team_id: team6.id, user_id: user1.id, role_in_team: "Tech Lead", joined_at: new Date() },
      { id: 13, team_id: team6.id, user_id: user5.id, role_in_team: "Biz", joined_at: new Date() },
    ],
  });

  console.log("Seeding finished.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
