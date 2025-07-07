// app/api/auth/logout/route.ts
import { NextResponse } from "next/server";

export async function POST() {
  console.log("=== /api/auth/logout APIが呼ばれました ===");
  try {
    const response = NextResponse.json({
      success: true,
      message: "ログアウトしました",
    });

    // トークンクッキーを削除（maxAgeを0に設定）
    response.cookies.set("token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 0,
      path: "/", // ログイン時に設定したパスと一致させる必要があります
    });

    return response;
  } catch (error) {
    console.error("ログアウトエラー:", error);
    return NextResponse.json({ success: false, error: "ログアウトに失敗しました" }, { status: 500 });
  }
}
