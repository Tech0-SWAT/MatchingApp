import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // 入力値の検証
    if (!email || !password) {
      return NextResponse.json({ success: false, error: "メールアドレスとパスワードを入力してください" }, { status: 400 });
    }

    // ユーザーの検索
    const user = await prisma.users.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        password_hash: true,
      },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: "ユーザーが見つかりません" }, { status: 401 });
    }

    // パスワードの検証
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return NextResponse.json({ success: false, error: "パスワードが正しくありません" }, { status: 401 });
    }

    // JWTトークンの生成
    const token = jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET || "your-secret-key", { expiresIn: "7d" });

    // レスポンス作成
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      message: "ログインに成功しました",
    });

    // HTTPオンリーCookieにトークンを設定
    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 7, // 7日間
    });

    return response;
  } catch (error) {
    console.error("ログインエラー:", error);
    return NextResponse.json({ success: false, error: "サーバーエラーが発生しました" }, { status: 500 });
  }
}
