// app/api/auth/me/route.ts
import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import prisma from "@/lib/prisma";

// JWTペイロードの型定義 (PrismaのUser IDの型に合わせる - あなたのprisma/schema.prismaを確認)
// 例: @id @default(autoincrement()) Int なら number
// 例: @id @default(uuid()) String なら string
interface JwtPayload {
  userId: number; // ★★ ここをあなたのPrismaスキーマのUser.idの型に合わせる (string または number) ★★
  email: string;
  iat: number;
  exp: number;
}

export async function GET(request: NextRequest) {
  console.log("=== /api/auth/me APIが呼ばれました ===");

  try {
    const token = request.cookies.get("token")?.value;

    if (!token) {
      console.log("認証トークンが見つかりません。");
      return NextResponse.json({ success: false, error: "未認証です。" }, { status: 401 });
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error("JWT_SECRETが設定されていません！");
      return NextResponse.json({ success: false, error: "サーバー設定エラー" }, { status: 500 });
    }

    let decoded: JwtPayload;
    try {
      decoded = jwt.verify(token, jwtSecret) as JwtPayload;
    } catch (jwtError) {
      console.error("JWT検証エラー（トークン無効/期限切れ）:", jwtError);
      // 無効なトークンの場合はクッキーをクリアして未認証とする
      const response = NextResponse.json({ success: false, error: "認証セッションが無効です。" }, { status: 401 });
      response.cookies.set("token", "", { maxAge: 0, httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/" });
      return response;
    }

    const user = await prisma.users.findUnique({
      where: { id: decoded.userId }, // decoded.userId の型が上記 JwtPayload と一致していることを確認
      select: {
        id: true,
        name: true,
        email: true,
        // user_profiles を include して取得することで、プロフィールの有無を判断
        user_profiles: {
          select: {
            id: true, // user_profiles の ID
            personality_type: true,
            idea_status: true,
            desired_role_in_team: true,
            self_introduction_comment: true,
            // 他のuser_profilesのフィールドも必要に応じて追加 (例: github_url, portfolio_url, experience_comment)
            // 例: github_url: true,
            // 例: portfolio_url: true,
            // 例: experience_comment: true,
          },
        },
      },
    });

    if (!user) {
      console.log("ユーザーが見つかりません (DBに存在しない)。");
      // ユーザーが存在しない場合もクッキーをクリア
      const response = NextResponse.json({ success: false, error: "ユーザーが見つかりません。" }, { status: 401 });
      response.cookies.set("token", "", { maxAge: 0, httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/" });
      return response;
    }

    // user_profiles が存在するかどうかでプロフィール設定が完了しているか判断
    const isProfileSetupCompleted = !!user.user_profiles;

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        profile: user.user_profiles, // profileオブジェクトとして直接渡す
        isProfileSetupCompleted: isProfileSetupCompleted,
      },
    });
  } catch (error: any) {
    console.error("ユーザー認証チェックAPIエラー:", error);
    return NextResponse.json(
      {
        success: false,
        error: "サーバーエラーが発生しました。",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
