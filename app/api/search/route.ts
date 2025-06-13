import { type NextRequest, NextResponse } from "next/server";
// ★ 修正: lib/prisma.ts へのインポートパスをプロジェクト構造に合わせて修正
// tsconfig.json の設定でエイリアスが使えるようになったため、短いエイリアスパスを使用
import prisma from "@/lib/prisma"; // @/lib/prisma は student-matching-app/lib/prisma を指す

// 検索条件の型定義
interface SearchCriteria {
  keyword?: string;
  desired_role_in_team?: string;
  personality_type?: string;
  timeslot_ids?: number[];
  idea_status?: string;
  product_genre_ids?: number[];
  team_priority_ids?: number[];
}

// 検索結果の型定義 (Prismaの型と連携させるため、内容は維持しつつ使用)
interface SearchResult {
  id: number;
  name: string;
  email: string;
  profile: {
    personality_type: string | null;
    idea_status: string | null;
    desired_role_in_team: string | null;
    self_introduction_comment: string | null;
  };
  product_genres: Array<{ id: number; name: string }>;
  timeslots: Array<{ id: number; description: string; day_type: string }>;
  team_priorities: Array<{ id: number; name: string }>;
  match_keywords: string[]; // これはバックエンドで生成するか、フロントエンドで利用しないなら削除可
}

// 検索API
export async function POST(request: NextRequest) {
  try {
    const searchCriteria: SearchCriteria = await request.json();

    // セキュリティ: 入力値のサニタイズ (変更なし)
    const sanitizedCriteria = {
      keyword: searchCriteria.keyword?.trim().replace(/<[^>]*>/g, "") || "",
      desired_role_in_team: searchCriteria.desired_role_in_team || "",
      personality_type: searchCriteria.personality_type?.trim().replace(/<[^>]*>/g, "") || "",
      timeslot_ids: Array.isArray(searchCriteria.timeslot_ids) ? searchCriteria.timeslot_ids : [],
      idea_status: searchCriteria.idea_status || "",
      product_genre_ids: Array.isArray(searchCriteria.product_genre_ids) ? searchCriteria.product_genre_ids : [],
      team_priority_ids: Array.isArray(searchCriteria.team_priority_ids) ? searchCriteria.team_priority_ids : [],
    };

    // ★ 修正: モックデータを削除し、Prismaを使ってデータベースで検索実行
    let whereClause: any = {}; // Prismaの検索条件を構築するためのオブジェクト

    // キーワード検索（name, self_introduction_comment, product_genres.name, team_priorities.name）
    // 大文字小文字を区別しない検索 (`mode: 'insensitive'`)
    if (sanitizedCriteria.keyword) {
      whereClause.OR = [
        { name: { contains: sanitizedCriteria.keyword, mode: "insensitive" } },
        {
          user_profiles: {
            self_introduction_comment: { contains: sanitizedCriteria.keyword, mode: "insensitive" },
          },
        },
        {
          user_product_genres: {
            some: {
              // user_product_genres のいずれかの関連が条件を満たす
              product_genre: {
                name: { contains: sanitizedCriteria.keyword, mode: "insensitive" },
              },
            },
          },
        },
        {
          user_team_priorities: {
            some: {
              // user_team_priorities のいずれかの関連が条件を満たす
              team_priority: {
                name: { contains: sanitizedCriteria.keyword, mode: "insensitive" },
              },
            },
          },
        },
      ];
    }

    // 希望する役割
    if (sanitizedCriteria.desired_role_in_team) {
      whereClause.user_profiles = {
        ...whereClause.user_profiles, // 既存のuser_profiles条件があれば結合
        desired_role_in_team: sanitizedCriteria.desired_role_in_team,
      };
    }

    // 性格タイプ
    if (sanitizedCriteria.personality_type) {
      whereClause.user_profiles = {
        ...whereClause.user_profiles,
        personality_type: { contains: sanitizedCriteria.personality_type, mode: "insensitive" },
      };
    }

    // 開発アイデアの状況
    if (sanitizedCriteria.idea_status) {
      whereClause.user_profiles = {
        ...whereClause.user_profiles,
        idea_status: sanitizedCriteria.idea_status,
      };
    }

    // プロダクトジャンル（複数選択）
    if (sanitizedCriteria.product_genre_ids.length > 0) {
      whereClause.user_product_genres = {
        some: {
          product_genre_id: { in: sanitizedCriteria.product_genre_ids }, // いずれかのIDが一致
        },
      };
    }

    // 活動時間帯（複数選択）
    if (sanitizedCriteria.timeslot_ids.length > 0) {
      whereClause.user_availabilities = {
        some: {
          timeslot_id: { in: sanitizedCriteria.timeslot_ids }, // いずれかのIDが一致
        },
      };
    }

    // チーム重視項目（複数選択）
    if (sanitizedCriteria.team_priority_ids.length > 0) {
      whereClause.user_team_priorities = {
        some: {
          team_priority_id: { in: sanitizedCriteria.team_priority_ids }, // いずれかのIDが一致
        },
      };
    }

    const results = await prisma.users.findMany({
      where: whereClause, // 構築した検索条件を適用
      include: {
        user_profiles: true, // プロフィール情報を結合
        user_product_genres: {
          include: { product_genre: true }, // 関連するジャンル情報を結合
        },
        user_availabilities: {
          include: { timeslot: true }, // 関連する時間帯情報を結合
        },
        user_team_priorities: {
          include: { team_priority: true }, // 関連する優先度情報を結合
        },
      },
      orderBy: { name: "asc" }, // 任意
    });

    // 検索結果の整形
    const formattedResults: SearchResult[] = results.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      profile: user.user_profiles
        ? {
            personality_type: user.user_profiles.personality_type,
            idea_status: user.user_profiles.idea_status,
            desired_role_in_team: user.user_profiles.desired_role_in_team,
            self_introduction_comment: user.user_profiles.self_introduction_comment,
          }
        : {
            // プロフィールがない場合でも、空のオブジェクトを返す（SearchResultの型に合わせる）
            personality_type: null,
            idea_status: null,
            desired_role_in_team: null,
            self_introduction_comment: null,
          },
      product_genres: user.user_product_genres.map((upg) => ({ id: upg.product_genre.id, name: upg.product_genre.name })),
      timeslots: user.user_availabilities.map((ua) => ({
        id: ua.timeslot.id,
        description: ua.timeslot.description,
        day_type: ua.timeslot.day_type,
      })),
      team_priorities: user.user_team_priorities.map((utp) => ({ id: utp.team_priority.id, name: utp.team_priority.name })),
      match_keywords: [], // これは現時点ではPrismaで自動的に生成されないため、空の配列としておく
      // 必要であれば、バックエンドでキーワードマッチングロジックを追加して生成
    }));

    console.log("検索実行:", sanitizedCriteria);
    console.log("検索結果:", formattedResults.length, "件");

    return NextResponse.json({
      success: true,
      results: formattedResults,
      total: formattedResults.length,
    });
  } catch (error) {
    console.error("検索エラー:", error);
    return NextResponse.json({ success: false, error: "サーバーエラーが発生しました" }, { status: 500 });
  }
}
