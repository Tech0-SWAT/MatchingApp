// app/api/profile/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  console.log("=== Database Profile API Called ===");

  try {
    // Prismaを動的にインポート
    const { default: prisma } = await import("@/lib/prisma");

    // クエリパラメータからユーザーIDを取得
    const { searchParams } = new URL(request.url);
    const userIdParam = searchParams.get("userId") || "current";

    let userId: number;

    if (userIdParam === "current") {
      const token = request.cookies.get("token")?.value;
      if (!token) {
        return NextResponse.json({ success: false, error: "認証が必要です" }, { status: 401 });
      }

      try {
        const jwt = await import("jsonwebtoken");
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret") as { userId: number };
        userId = decoded.userId;
        console.log("Using current user ID (authenticated):", userId);
      } catch (jwtError) {
        return NextResponse.json({ success: false, error: "無効な認証トークンです" }, { status: 401 });
      }
    } else {
      userId = parseInt(userIdParam, 10);
      if (isNaN(userId)) {
        return NextResponse.json({ success: false, error: "無効なユーザーIDです" }, { status: 400 });
      }
    }

    console.log("Fetching profile for user ID:", userId);

    // データベースからユーザー情報を取得
    const userWithProfile = await prisma.users.findUnique({
      where: { id: userId },
      include: {
        user_profiles: true,
        user_product_genres: {
          include: {
            product_genre: true,
          },
        },
        user_availabilities: {
          include: {
            timeslot: true,
          },
        },
        user_team_priorities: {
          include: {
            team_priority: true,
          },
        },
      },
    });

    if (!userWithProfile) {
      console.log("User not found in database:", userId);
      return NextResponse.json(
        {
          success: false,
          error: "ユーザーが見つかりません",
          redirect: "/api/auth/login",
        },
        { status: 404 }
      );
    }

    console.log("User found:", {
      id: userWithProfile.id,
      name: userWithProfile.name,
      email: userWithProfile.email,
      hasProfile: !!userWithProfile.user_profiles,
    });

    // レスポンス用にデータを整形
    const userProfile = {
      id: userWithProfile.id,
      name: userWithProfile.name,
      email: userWithProfile.email,
      profile: userWithProfile.user_profiles
        ? {
            desired_role_in_team: userWithProfile.user_profiles.desired_role_in_team,
            personality_type: userWithProfile.user_profiles.personality_type,
            idea_status: userWithProfile.user_profiles.idea_status,
            self_introduction_comment: userWithProfile.user_profiles.self_introduction_comment,
            experience_comment: userWithProfile.user_profiles.experience_comment,
            github_url: userWithProfile.user_profiles.github_url,
            portfolio_url: userWithProfile.user_profiles.portfolio_url,
          }
        : null,
      product_genres:
        userWithProfile.user_product_genres?.map((upg) => ({
          id: upg.product_genre.id,
          name: upg.product_genre.name,
        })) || [],
      timeslots:
        userWithProfile.user_availabilities?.map((ua) => ({
          id: ua.timeslot.id,
          description: ua.timeslot.description,
          day_type: ua.timeslot.day_type,
          sort_order: ua.timeslot.sort_order,
        })) || [],
      team_priorities:
        userWithProfile.user_team_priorities?.map((utp) => ({
          id: utp.team_priority.id,
          name: utp.team_priority.name,
        })) || [],
    };

    console.log("Profile data prepared successfully");

    return NextResponse.json({
      success: true,
      user: userProfile,
      timestamp: new Date().toISOString(),
      dataSource: "database",
    });
  } catch (error) {
    console.error("=== Profile API Error ===");
    console.error("Error details:", error);
    console.error("Stack trace:", error instanceof Error ? error.stack : "No stack trace");

    return NextResponse.json(
      {
        success: false,
        error: "プロフィール情報の取得に失敗しました",
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  console.log("=== Profile API POST Called ===");

  try {
    // Prismaを動的にインポート
    const { default: prisma } = await import("@/lib/prisma");

    // リクエストボディの解析
    const body = await request.json();
    console.log("Profile update request:", JSON.stringify(body, null, 2));

    const { userId, desired_role_in_team, personality_type, idea_status, self_introduction_comment, experience_comment, github_url, portfolio_url, product_genre_ids = [], timeslot_ids = [], team_priority_ids = [] } = body;

    if (!userId) {
      return NextResponse.json({ success: false, error: "User ID is required" }, { status: 400 });
    }

    console.log("Updating profile for user ID:", userId);

    // データベーストランザクションでプロフィールを更新
    await prisma.$transaction(async (tx) => {
      // ユーザープロフィールを更新または作成
      await tx.user_profiles.upsert({
        where: { user_id: userId },
        update: {
          desired_role_in_team,
          personality_type,
          idea_status,
          self_introduction_comment,
          experience_comment,
          github_url,
          portfolio_url,
          updated_at: new Date(),
        },
        create: {
          user_id: userId,
          desired_role_in_team,
          personality_type,
          idea_status,
          self_introduction_comment,
          experience_comment,
          github_url,
          portfolio_url,
        },
      });

      // プロダクトジャンルの関連付けを更新
      await tx.user_product_genres.deleteMany({ where: { user_id: userId } });
      if (product_genre_ids.length > 0) {
        await tx.user_product_genres.createMany({
          data: product_genre_ids.map((genreId: number) => ({
            user_id: userId,
            product_genre_id: genreId,
          })),
        });
      }

      // 活動時間の関連付けを更新
      await tx.user_availabilities.deleteMany({ where: { user_id: userId } });
      if (timeslot_ids.length > 0) {
        await tx.user_availabilities.createMany({
          data: timeslot_ids.map((timeslotId: number) => ({
            user_id: userId,
            timeslot_id: timeslotId,
          })),
        });
      }

      // チーム優先事項の関連付けを更新
      await tx.user_team_priorities.deleteMany({ where: { user_id: userId } });
      if (team_priority_ids.length > 0) {
        await tx.user_team_priorities.createMany({
          data: team_priority_ids.map((priorityId: number) => ({
            user_id: userId,
            team_priority_id: priorityId,
          })),
        });
      }
    });

    console.log("Profile updated successfully for user:", userId);

    return NextResponse.json({
      success: true,
      message: "プロフィールが正常に保存されました",
      updatedFields: Object.keys(body).filter((key) => key !== "userId"),
      timestamp: new Date().toISOString(),
      dataSource: "database",
    });
  } catch (error) {
    console.error("=== Profile API POST Error ===");
    console.error("Error details:", error);

    return NextResponse.json(
      {
        success: false,
        error: "プロフィールの保存に失敗しました",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
