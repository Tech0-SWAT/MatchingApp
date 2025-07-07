// app/api/matching/results/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    console.log("===== マッチング結果取得API開始 =====");

    const url = new URL(request.url);
    const userId = url.searchParams.get("userId");

    if (!userId) {
      console.log("エラー: ユーザーIDが提供されていません");
      return NextResponse.json({ success: false, error: "ユーザーIDが必要です" }, { status: 400 });
    }

    const userIdNum = parseInt(userId, 10);
    if (isNaN(userIdNum)) {
      console.log("エラー: 無効なユーザーID");
      return NextResponse.json({ success: false, error: "無効なユーザーIDです" }, { status: 400 });
    }

    console.log(`ユーザーID ${userIdNum} のマッチング結果を取得中...`);

    // マッチング結果を取得
    const matchResults = await prisma.match_results.findMany({
      where: { user_id: userIdNum },
      include: {
        matched_user: {
          include: {
            user_profiles: true,
          },
        },
      },
      orderBy: { score: "desc" },
    });

    console.log(`マッチング結果取得完了: ${matchResults.length}件`);

    return NextResponse.json({
      success: true,
      results: matchResults,
      count: matchResults.length,
    });
  } catch (error: any) {
    console.error("===== マッチング結果取得APIエラー =====");
    console.error("エラー詳細:", {
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
    });

    return NextResponse.json(
      {
        success: false,
        error: "サーバーエラーが発生しました。再度お試しください。",
        details:
          process.env.NODE_ENV === "development"
            ? {
                message: error?.message,
                name: error?.name,
                stack: error?.stack?.split("\n").slice(0, 5),
              }
            : undefined,
      },
      { status: 500 }
    );
  }
}
