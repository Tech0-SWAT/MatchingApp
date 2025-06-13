import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const users = await prisma.users.findMany({
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    return NextResponse.json({
      success: true,
      users,
    });
  } catch (error) {
    console.error("エラー:", error);
    return NextResponse.json({ success: false, error: "エラーが発生しました" }, { status: 500 });
  }
}
