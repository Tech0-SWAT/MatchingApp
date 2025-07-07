import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json();
    console.log("新規登録リクエスト:", { name, email, passwordLength: password?.length });

    // バリデーション
    if (!name || !email || !password) {
      return NextResponse.json({ success: false, error: "すべての項目が必要です" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ success: false, error: "パスワードは6文字以上で入力してください" }, { status: 400 });
    }

    const { default: prisma } = await import("@/lib/prisma");
    console.log("データベース接続成功");

    // 既存ユーザーのチェック
    const existingUser = await prisma.users.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ success: false, error: "このメールアドレスは既に登録されています" }, { status: 409 });
    }

    // パスワードのハッシュ化
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // ユーザー作成
    const newUser = await prisma.users.create({
      data: {
        name,
        email,
        password_hash: hashedPassword, // 正しいフィールド名に修正
        // created_at と updated_at は自動設定される
      },
    });

    console.log("新規ユーザー作成成功:", { id: newUser.id, name: newUser.name, email: newUser.email });

    // JWTトークンを生成（登録後に自動ログイン）
    const token = jwt.sign({ userId: newUser.id }, process.env.JWT_SECRET || "fallback-secret", { expiresIn: "7d" });

    // レスポンスを作成し、クッキーにトークンを設定
    const response = NextResponse.json({
      success: true,
      message: "アカウントが正常に作成されました",
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
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
    console.error("新規登録エラー:", error);

    // データベースの制約エラーなどをチェック
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return NextResponse.json({ success: false, error: "このメールアドレスは既に登録されています" }, { status: 409 });
    }

    return NextResponse.json({ success: false, error: "アカウント作成中にエラーが発生しました" }, { status: 500 });
  }
}
