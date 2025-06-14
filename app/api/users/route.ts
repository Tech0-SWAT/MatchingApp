import { type NextRequest, NextResponse } from "next/server";
// ★ 修正済み: tsconfig.json の設定でエイリアスが使えるため、短いエイリアスパスを使用
import prisma from "@/lib/prisma"; // @/lib/prisma は student-matching-app/lib/prisma を指す

// ユーザー情報の型定義
interface User {
  id: number;
  name: string;
  email: string;
  profile?: {
    personality_type: string | null;
    desired_role_in_team: string | null;
  };
}

// ユーザー一覧取得API
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query") || "";
    const excludeIds = searchParams.get("excludeIds") || "";

    // 除外するIDの配列を作成
    const excludeIdArray = excludeIds ? excludeIds.split(",").map((id) => Number.parseInt(id, 10)) : [];

    const users = await prisma.users.findMany({
      where: {
        AND: [
          // 検索クエリがある場合
          query
            ? {
                OR: [
                  { name: { contains: query, mode: "insensitive" } }, // 名前で部分一致検索（大文字小文字区別なし）
                  { email: { contains: query, mode: "insensitive" } }, // メールアドレスで部分一致検索
                ],
              }
            : {}, // クエリがない場合は条件なし
          // 除外IDがある場合
          excludeIdArray.length > 0
            ? {
                id: { notIn: excludeIdArray }, // 指定されたIDを除外
              }
            : {}, // 除外IDがない場合は条件なし
        ],
      },
      include: {
        user_profiles: {
          // ユーザープロフィールも一緒に取得
          select: {
            personality_type: true,
            desired_role_in_team: true,
          },
        },
      },
      orderBy: { name: "asc" }, // 名前順でソート
    });

    // 取得したデータを、フロントエンドで使いやすいように整形
    const formattedUsers: User[] = users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      profile: user.user_profiles
        ? {
            // user_profilesが存在すれば整形
            personality_type: user.user_profiles.personality_type,
            desired_role_in_team: user.user_profiles.desired_role_in_team,
          }
        : null, // プロフィールがない場合はnull
    }));

    return NextResponse.json({
      success: true,
      users: formattedUsers, // ★ 整形後のデータを返す
    });
  } catch (error) {
    console.error("ユーザー取得エラー:", error);
    return NextResponse.json({ success: false, error: "サーバーエラーが発生しました" }, { status: 500 });
  }
}
