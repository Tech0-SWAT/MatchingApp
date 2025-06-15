import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");
  console.log("DATABASE_URL being used by seed script:", process.env.DATABASE_URL);

  try {
    // 削除部分をコメントアウト（既存データを保持）
    /*
    // Delete in reverse dependency order to avoid foreign key constraint violations
    await prisma.match_results.deleteMany({});
    await prisma.team_memberships.deleteMany({});
    await prisma.user_availabilities.deleteMany({});
    await prisma.user_team_priorities.deleteMany({});
    await prisma.user_product_genres.deleteMany({});
    await prisma.user_profiles.deleteMany({});
    await prisma.teams.deleteMany({});
    await prisma.users.deleteMany({});

    // Delete reference tables
    await prisma.availability_timeslots.deleteMany({});
    await prisma.team_priorities.deleteMany({});
    await prisma.product_genres.deleteMany({});
    await prisma.course_steps.deleteMany({});

    console.log('Database cleared successfully');
    */

    // 1. Create reference data first

    // Create product genres
    const productGenres = await Promise.all([
      prisma.product_genres.create({
        data: {
          name: "Webアプリケーション",
          created_at: new Date(),
          updated_at: new Date(),
        },
      }),
      prisma.product_genres.create({
        data: {
          name: "モバイルアプリ",
          created_at: new Date(),
          updated_at: new Date(),
        },
      }),
      prisma.product_genres.create({
        data: {
          name: "AI・機械学習",
          created_at: new Date(),
          updated_at: new Date(),
        },
      }),
    ]);

    console.log("Product genres created:", productGenres.length);

    // Create availability timeslots
    const timeslots = await Promise.all([
      prisma.availability_timeslots.create({
        data: {
          description: "平日午前",
          day_type: "weekday",
          sort_order: 1,
          created_at: new Date(),
          updated_at: new Date(),
        },
      }),
      prisma.availability_timeslots.create({
        data: {
          description: "平日午後",
          day_type: "weekday",
          sort_order: 2,
          created_at: new Date(),
          updated_at: new Date(),
        },
      }),
      prisma.availability_timeslots.create({
        data: {
          description: "週末",
          day_type: "weekend_holiday",
          sort_order: 3,
          created_at: new Date(),
          updated_at: new Date(),
        },
      }),
    ]);

    console.log("Timeslots created:", timeslots.length);

    // Create team priorities
    const teamPriorities = await Promise.all([
      prisma.team_priorities.create({
        data: {
          name: "学習重視",
          created_at: new Date(),
          updated_at: new Date(),
        },
      }),
      prisma.team_priorities.create({
        data: {
          name: "成果重視",
          created_at: new Date(),
          updated_at: new Date(),
        },
      }),
      prisma.team_priorities.create({
        data: {
          name: "バランス型",
          created_at: new Date(),
          updated_at: new Date(),
        },
      }),
    ]);

    console.log("Team priorities created:", teamPriorities.length);

    // Create course steps
    const courseSteps = await Promise.all([
      prisma.course_steps.create({
        data: {
          name: "Step 1: 基礎学習",
          start_date: new Date("2024-04-01"),
          end_date: new Date("2024-05-31"),
          description: "プログラミング基礎とチーム開発の基礎を学ぶ",
          created_at: new Date(),
          updated_at: new Date(),
        },
      }),
      prisma.course_steps.create({
        data: {
          name: "Step 2: 実践開発",
          start_date: new Date("2024-06-01"),
          end_date: new Date("2024-07-31"),
          description: "チームでの実践的な開発プロジェクト",
          created_at: new Date(),
          updated_at: new Date(),
        },
      }),
    ]);

    console.log("Course steps created:", courseSteps.length);

    // 2. Create users
    const users = await Promise.all([
      prisma.users.create({
        data: {
          email: "alice@example.com",
          name: "Alice Johnson",
          password_hash: "dummy_hash_1",
          created_at: new Date(),
          updated_at: new Date(),
        },
      }),
      prisma.users.create({
        data: {
          email: "bob@example.com",
          name: "Bob Smith",
          password_hash: "dummy_hash_2",
          created_at: new Date(),
          updated_at: new Date(),
        },
      }),
      prisma.users.create({
        data: {
          email: "charlie@example.com",
          name: "Charlie Brown",
          password_hash: "dummy_hash_3",
          created_at: new Date(),
          updated_at: new Date(),
        },
      }),
    ]);

    console.log("Users created:", users.length);

    // 3. Create user profiles
    const profiles = await Promise.all([
      prisma.user_profiles.create({
        data: {
          user_id: users[0].id,
          personality_type: "ENFP",
          idea_status: "アイデアあり",
          desired_role_in_team: "フロントエンド",
          self_introduction_comment: "React と TypeScript が得意です。UI/UX にも興味があります。",
          created_at: new Date(),
          updated_at: new Date(),
        },
      }),
      prisma.user_profiles.create({
        data: {
          user_id: users[1].id,
          personality_type: "INTJ",
          idea_status: "アイデア募集中",
          desired_role_in_team: "バックエンド",
          self_introduction_comment: "Python と Django でのAPI開発が得意です。",
          created_at: new Date(),
          updated_at: new Date(),
        },
      }),
      prisma.user_profiles.create({
        data: {
          user_id: users[2].id,
          personality_type: "ISFJ",
          idea_status: "アイデアあり",
          desired_role_in_team: "デザイナー",
          self_introduction_comment: "Figma を使ったUI設計とプロトタイピングが得意です。",
          created_at: new Date(),
          updated_at: new Date(),
        },
      }),
    ]);

    console.log("User profiles created:", profiles.length);

    // 4. Create teams
    const teams = await Promise.all([
      prisma.teams.create({
        data: {
          course_step_id: courseSteps[1].id, // Step 2: 実践開発
          name: "Team Alpha",
          project_name: "AIチャットボット",
          created_at: new Date(),
          updated_at: new Date(),
        },
      }),
      prisma.teams.create({
        data: {
          course_step_id: courseSteps[1].id,
          name: "Team Beta",
          project_name: "ECサイト",
          created_at: new Date(),
          updated_at: new Date(),
        },
      }),
    ]);

    console.log("Teams created:", teams.length);

    // 5. Create team memberships
    const memberships = await Promise.all([
      prisma.team_memberships.create({
        data: {
          team_id: teams[0].id,
          user_id: users[0].id,
          role_in_team: "リーダー",
          joined_at: new Date(),
          created_at: new Date(),
          updated_at: new Date(),
        },
      }),
      prisma.team_memberships.create({
        data: {
          team_id: teams[1].id,
          user_id: users[1].id,
          role_in_team: "リーダー",
          joined_at: new Date(),
          created_at: new Date(),
          updated_at: new Date(),
        },
      }),
      prisma.team_memberships.create({
        data: {
          team_id: teams[1].id,
          user_id: users[2].id,
          role_in_team: "デザイナー",
          joined_at: new Date(),
          created_at: new Date(),
          updated_at: new Date(),
        },
      }),
    ]);

    console.log("Team memberships created:", memberships.length);

    // 6. Create user availabilities
    const availabilities = await Promise.all([
      prisma.user_availabilities.create({
        data: {
          user_id: users[0].id,
          timeslot_id: timeslots[0].id, // 平日午前
          created_at: new Date(),
        },
      }),
      prisma.user_availabilities.create({
        data: {
          user_id: users[1].id,
          timeslot_id: timeslots[1].id, // 平日午後
          created_at: new Date(),
        },
      }),
      prisma.user_availabilities.create({
        data: {
          user_id: users[2].id,
          timeslot_id: timeslots[2].id, // 週末
          created_at: new Date(),
        },
      }),
    ]);

    console.log("User availabilities created:", availabilities.length);

    // 7. Create user product genres
    const userProductGenres = await Promise.all([
      prisma.user_product_genres.create({
        data: {
          user_id: users[0].id,
          product_genre_id: productGenres[0].id, // Webアプリケーション
          created_at: new Date(),
        },
      }),
      prisma.user_product_genres.create({
        data: {
          user_id: users[1].id,
          product_genre_id: productGenres[2].id, // AI・機械学習
          created_at: new Date(),
        },
      }),
    ]);

    console.log("User product genres created:", userProductGenres.length);

    // 8. Create user team priorities
    const userTeamPriorities = await Promise.all([
      prisma.user_team_priorities.create({
        data: {
          user_id: users[0].id,
          team_priority_id: teamPriorities[2].id, // バランス型
          created_at: new Date(),
        },
      }),
      prisma.user_team_priorities.create({
        data: {
          user_id: users[1].id,
          team_priority_id: teamPriorities[1].id, // 成果重視
          created_at: new Date(),
        },
      }),
    ]);

    console.log("User team priorities created:", userTeamPriorities.length);

    console.log("Database seeded successfully!");
  } catch (error) {
    console.error("Error during seeding:", error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
