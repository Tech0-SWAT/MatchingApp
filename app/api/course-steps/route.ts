// app/api/course-steps/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET: コースステップ一覧取得（チーム作成時の選択肢用）
export async function GET(request: NextRequest) {
  try {
    console.log("コースステップ一覧を取得中...");

    const courseSteps = await prisma.course_steps.findMany({
      orderBy: { id: "asc" },
      select: {
        id: true,
        name: true,
        description: true,
      },
    });

    console.log("コースステップ取得成功:", courseSteps);

    return NextResponse.json({
      success: true,
      course_steps: courseSteps,
    });
  } catch (error) {
    console.error("コースステップ取得エラー:", error);

    return NextResponse.json(
      {
        success: false,
        error: "コースステップの取得に失敗しました",
      },
      { status: 500 }
    );
  }
}
