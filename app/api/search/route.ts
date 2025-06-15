import { type NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// 検索条件の型定義
interface SearchCriteria {
  keyword?: string;
  desired_role_in_team?: string;
  personality_type?: string;
  timeslot_ids?: number[];
  idea_status?: string;
  product_genre_ids?: number[];
  team_priority_ids?: number[];
  fetchMatchesOnly?: boolean; // ★ 新しく追加
  currentUserId?: number; // ★ 新しく追加：マッチング結果取得時に必要
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
  match_keywords: string[];
  match_score?: number; // ★ マッチングスコアを追加
  match_reason?: string; // ★ マッチング理由を追加
}

// 検索API
export async function POST(request: NextRequest) {
  try {
    const searchCriteria: SearchCriteria = await request.json();

    const sanitizedCriteria = {
      keyword: searchCriteria.keyword?.trim().replace(/<[^>]*>/g, "") || "",
      desired_role_in_team: searchCriteria.desired_role_in_team && searchCriteria.desired_role_in_team !== "" ? searchCriteria.desired_role_in_team : undefined,
      personality_type: searchCriteria.personality_type?.trim().replace(/<[^>]*>/g, "") || "",
      timeslot_ids: Array.isArray(searchCriteria.timeslot_ids) ? searchCriteria.timeslot_ids : [],
      idea_status: searchCriteria.idea_status || "",
      product_genre_ids: Array.isArray(searchCriteria.product_genre_ids) ? searchCriteria.product_genre_ids : [],
      team_priority_ids: Array.isArray(searchCriteria.team_priority_ids) ? searchCriteria.team_priority_ids : [],
      fetchMatchesOnly: searchCriteria.fetchMatchesOnly || false, // ★ 新しく追加
      currentUserId: searchCriteria.currentUserId || 0, // ★ 新しく追加
    };

    let results: any[] = [];
    let total: number = 0;

    // ★ 修正: fetchMatchesOnly が true の場合、match_results からデータを取得する
      if (sanitizedCriteria.fetchMatchesOnly && sanitizedCriteria.currentUserId) {
      const matchedResults = await prisma.match_results.findMany({
        where: {
          user_id: sanitizedCriteria.currentUserId,
          matched_user: sanitizedCriteria.desired_role_in_team && sanitizedCriteria.desired_role_in_team !== "" ? {
            user_profiles: {
              desired_role_in_team: sanitizedCriteria.desired_role_in_team
            }
          } : undefined
        },
        include: {
          matched_user: {
            // マッチしたユーザーの詳細情報を結合
            include: {
              user_profiles: true,
              user_product_genres: { include: { product_genre: true } },
              user_availabilities: { include: { timeslot: true } },
              user_team_priorities: { include: { team_priority: true } },
            },
          },
        },
        orderBy: { score: "desc" }, // スコアでソート
      });

      results = matchedResults
        .map((match) => {
          const user = match.matched_user;
          if (!user) return null; // データが欠けている場合を考慮

          return {
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
              : { personality_type: null, idea_status: null, desired_role_in_team: null, self_introduction_comment: null },
            product_genres: user.user_product_genres.map((upg) => ({ id: upg.product_genre.id, name: upg.product_genre.name })),
            timeslots: user.user_availabilities.map((ua) => ({ id: ua.timeslot.id, description: ua.timeslot.description, day_type: ua.timeslot.day_type })),
            team_priorities: user.user_team_priorities.map((utp) => ({ id: utp.team_priority.id, name: utp.team_priority.name })),
            match_keywords: [], // ここでは生成しない
            match_score: match.score, // ★ スコアを追加
            match_reason: match.match_reason, // ★ 理由を追加
          };
        })
        .filter(Boolean); // null を除外

      total = results.length;
    } else {
      // 既存の検索ロジック (fetchMatchesOnly が false または currentUserId がない場合)
      let whereClause: any = {};

      if (sanitizedCriteria.keyword) {
        whereClause.OR = [
          { name: { contains: sanitizedCriteria.keyword, mode: "insensitive" } },
          { user_profiles: { self_introduction_comment: { contains: sanitizedCriteria.keyword, mode: "insensitive" } } },
          { user_product_genres: { some: { product_genre: { name: { contains: sanitizedCriteria.keyword, mode: "insensitive" } } } } },
          { user_team_priorities: { some: { team_priority: { name: { contains: sanitizedCriteria.keyword, mode: "insensitive" } } } } },
        ];
      }
      if (sanitizedCriteria.desired_role_in_team && sanitizedCriteria.desired_role_in_team !== "") {
        whereClause.user_profiles = { ...whereClause.user_profiles, desired_role_in_team: { contains: sanitizedCriteria.desired_role_in_team, mode: "insensitive" } };
      }
      if (sanitizedCriteria.personality_type) {
        whereClause.user_profiles = { ...whereClause.user_profiles, personality_type: { contains: sanitizedCriteria.personality_type, mode: "insensitive" } };
      }
      if (sanitizedCriteria.idea_status) {
        whereClause.user_profiles = { ...whereClause.user_profiles, idea_status: sanitizedCriteria.idea_status };
      }
      if (sanitizedCriteria.product_genre_ids.length > 0) {
        whereClause.user_product_genres = { some: { product_genre_id: { in: sanitizedCriteria.product_genre_ids } } };
      }
      if (sanitizedCriteria.timeslot_ids.length > 0) {
        whereClause.user_availabilities = { some: { timeslot_id: { in: sanitizedCriteria.timeslot_ids } } };
      }
      if (sanitizedCriteria.team_priority_ids.length > 0) {
        whereClause.user_team_priorities = { some: { team_priority_id: { in: sanitizedCriteria.team_priority_ids } } };
      }

      results = await prisma.users.findMany({
        where: whereClause,
        include: {
          user_profiles: true,
          user_product_genres: { include: { product_genre: true } },
          user_availabilities: { include: { timeslot: true } },
          user_team_priorities: { include: { team_priority: true } },
        },
        orderBy: { name: "asc" },
      });

      total = results.length;

      // 既存の検索結果を整形 (マッチングスコア等は含まない)
      results = results.map((user) => ({
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
          : { personality_type: null, idea_status: null, desired_role_in_team: null, self_introduction_comment: null },
        product_genres: user.user_product_genres.map((upg: { product_genre: { id: number; name: string } }) => ({ id: upg.product_genre.id, name: upg.product_genre.name })),
        timeslots: user.user_availabilities.map((ua: { timeslot: { id: number; description: string; day_type: string } }) => ({ id: ua.timeslot.id, description: ua.timeslot.description, day_type: ua.timeslot.day_type })),
        team_priorities: user.user_team_priorities.map((utp: { team_priority: { id: number; name: string } }) => ({ id: utp.team_priority.id, name: utp.team_priority.name })),
        match_keywords: [],
      }));
    }

    console.log("検索実行:", sanitizedCriteria);
    console.log("検索結果:", total, "件");

    return NextResponse.json({
      success: true,
      results: results,
      total: total,
    });
  } catch (error) {
    console.error("検索エラー:", error);
    return NextResponse.json({ success: false, error: "サーバーエラーが発生しました" }, { status: 500 });
  }
}
