import { NextResponse } from "next/server";

export async function POST() {
  try {
    const response = NextResponse.json({
      success: true,
      message: "ログアウトしました",
    });

    response.cookies.set("token", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 0,
    });

    return response;
  } catch (error) {
    console.error("ログアウトエラー:", error);
    return NextResponse.json({ success: false, error: "ログアウトに失敗しました" }, { status: 500 });
  }
}
