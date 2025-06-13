import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json({ success: false, error: "認証が必要です" }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key") as any;

    const user = await prisma.users.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        name: true,
        email: true,
        created_at: true,
      },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: "ユーザーが見つかりません" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("認証エラー:", error);
    return NextResponse.json({ success: false, error: "認証に失敗しました" }, { status: 401 });
  }
}
