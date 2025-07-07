import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ success: false, error: "メールアドレスとパスワードが必要です" }, { status: 400 });
    }

    const { default: prisma } = await import("@/lib/prisma");
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
      return NextResponse.json({ success: false, error: "メールアドレスまたはパスワードが正しくありません" }, { status: 401 });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return NextResponse.json({ success: false, error: "メールアドレスまたはパスワードが正しくありません" }, { status: 401 });
    }

    // JWTトークンを生成
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || "fallback-secret", { expiresIn: "7d" });

    // レスポンスを作成し、クッキーにトークンを設定
    const response = NextResponse.json({
      success: true,
      message: "ログインに成功しました",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });

    // HTTPOnly, Secure, SameSite属性を設定してクッキーにトークンを保存
    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7日間
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("ログインエラー:", error);
    return NextResponse.json({ success: false, error: "ログイン処理中にエラーが発生しました" }, { status: 500 });
  }
}
