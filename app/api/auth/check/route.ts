// app/api/auth/check/route.ts
import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export async function GET(request: NextRequest) {
  console.log("=== /api/auth/check APIが呼ばれました ===");

  try {
    // Cookieからトークンを取得
    const token = request.cookies.get("token")?.value;
    console.log("Token from cookie:", token ? "存在する" : "存在しない");

    if (!token) {
      console.log("❌ トークンが見つかりません");
      return NextResponse.json({
        success: false,
        error: "認証トークンがありません",
      });
    }

    // JWTトークンを検証
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret") as any;
    console.log("✅ JWT検証成功:", { userId: decoded.userId });

    // ユーザー情報を取得 - 正しいフィールド名に修正
    const { default: prisma } = await import("@/lib/prisma");

    const user = await prisma.users.findUnique({
      where: { id: decoded.userId },
      include: {
        user_profiles: true,
        user_product_genres: true, // product_genres → user_product_genres
        user_availabilities: true, // timeslots → user_availabilities
        user_team_priorities: true, // team_priorities → user_team_priorities
      },
    });

    if (!user) {
      console.log("❌ ユーザーが見つかりません:", decoded.userId);
      return NextResponse.json({
        success: false,
        error: "ユーザーが見つかりません",
      });
    }

    console.log("✅ ユーザー情報取得成功:", {
      id: user.id,
      name: user.name,
      email: user.email,
      hasProfile: !!user.user_profiles,
    });

    // レスポンスデータを構築 - フィールド名に合わせて修正
    const responseData = {
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        profile: user.user_profiles
          ? {
              desired_role_in_team: user.user_profiles.desired_role_in_team,
              personality_type: user.user_profiles.personality_type,
              idea_status: user.user_profiles.idea_status,
              self_introduction_comment: user.user_profiles.self_introduction_comment,
              github_url: user.user_profiles.github_url,
              portfolio_url: user.user_profiles.portfolio_url,
              experience_comment: user.user_profiles.experience_comment,
            }
          : null,
        product_genres: user.user_product_genres || [], // 修正
        timeslots: user.user_availabilities || [], // 修正
        team_priorities: user.user_team_priorities || [], // 修正
      },
    };

    console.log("✅ 認証チェック完了");
    return NextResponse.json(responseData);
  } catch (error) {
    console.error("❌ 認証チェックエラー:", error);

    if (error instanceof jwt.JsonWebTokenError) {
      console.log("JWT エラー詳細:", error.message);
      return NextResponse.json({
        success: false,
        error: "無効な認証トークンです",
      });
    }

    return NextResponse.json({
      success: false,
      error: "認証処理中にエラーが発生しました",
    });
  }
}
