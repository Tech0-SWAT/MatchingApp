import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { OpenAI } from "openai";

// 🎯 フレキシブルマッチング用の型定義
// 🎯 修正: MBTIはマッチング計算に使用しないが、レスポンス用に保持
interface UserProfile {
  id: number;
  name: string;
  desired_role_in_team: string;
  personality_type: string; // マッチング計算には使用しないが、レスポンス用に保持
  idea_status: string;
  self_introduction_comment: string;
  product_genre_ids: number[];
  weekday_timeslot_ids: number[];
  weekend_timeslot_ids: number[];
  team_priority_ids: number[];
}

// コサイン類似度計算ヘルパー（元コードのまま）
function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

// プロファイル全フィールドをテキスト結合（活動時間を追加）
// 🎯 修正: MBTIは計算から除外
function profileToText(
  profile: {
    personality_type: string | null;
    idea_status: string | null;
    desired_role_in_team: string | null;
    self_introduction_comment: string | null;
  },
  timeslots: string[] = []
): string {
  // 🎯 MBTIを除外: personality_typeを含めない
  const profileFields = [profile.idea_status, profile.desired_role_in_team, profile.self_introduction_comment].filter(Boolean);

  // 活動時間も追加
  if (timeslots.length > 0) {
    profileFields.push(`活動時間: ${timeslots.join(", ")}`);
  }

  return profileFields.join(" ");
}

// 時間重複度計算（新規追加）
function calculateTimeOverlap(user1Slots: string[], user2Slots: string[]): number {
  if (user1Slots.length === 0 || user2Slots.length === 0) return 0;

  const overlap = user1Slots.filter((slot) => user2Slots.includes(slot));
  const total = new Set([...user1Slots, ...user2Slots]).size;
  return total === 0 ? 0 : overlap.length / total;
}

// 🎯 新規追加: 過去のチームメイトを取得する関数
async function getPastTeammates(userId: number): Promise<number[]> {
  console.log(`📋 ユーザー${userId}の過去のチームメイトを取得中...`);

  try {
    // このユーザーが参加したことがある全てのチームを取得
    const userTeams = await prisma.team_memberships.findMany({
      where: {
        user_id: userId,
      },
      include: {
        team: {
          include: {
            team_memberships: {
              where: {
                user_id: { not: userId }, // 自分以外のメンバー
              },
              select: {
                user_id: true,
              },
            },
          },
        },
      },
    });

    // 過去のチームメイトのIDを収集
    const pastTeammateIds = new Set<number>();

    userTeams.forEach((membership) => {
      membership.team.team_memberships.forEach((teammate) => {
        pastTeammateIds.add(teammate.user_id);
      });
    });

    const result = Array.from(pastTeammateIds);
    console.log(`✅ 過去のチームメイト ${result.length}人を発見:`, result);

    return result;
  } catch (error) {
    console.error("❌ 過去のチームメイト取得エラー:", error);
    return [];
  }
}

export async function POST(req: NextRequest) {
  try {
    console.log("🔍 /api/matching/start called (Enhanced版)");
    const body = await req.json();
    console.log("Request body:", body);

    const userId: number = body.userId;
    const desiredRole: string | null = body.desired_role_in_team || null;
    const mode: string = body.mode || "matching"; // mode パラメータ追加
    const useVectorMatching: boolean = body.useVectorMatching !== false; // デフォルトtrue
    const excludePastTeammates: boolean = body.excludePastTeammates === true; // 🎯 修正: デフォルトfalse

    console.log("Parsed userId:", userId, "desiredRole:", desiredRole, "mode:", mode, "useVectorMatching:", useVectorMatching, "excludePastTeammates:", excludePastTeammates);

    if (!userId) {
      console.warn("Missing userId");
      return NextResponse.json({ success: false, error: "userId is required" }, { status: 400 });
    }

    // データベース接続確認
    try {
      await prisma.$connect();
      console.log("✅ データベース接続確認完了");
    } catch (dbError) {
      console.error("❌ データベース接続失敗:", dbError);
      throw new Error("データベース接続に失敗しました");
    }

    // テストモード
    if (mode === "test") {
      return NextResponse.json({
        success: true,
        message: "Enhanced Matching API is working",
        openaiEnabled: !!process.env.OPENAI_API_KEY,
        vectorMatchingEnabled: useVectorMatching,
        timestamp: new Date().toISOString(),
      });
    }

    // 既存結果の取得モード
    if (mode === "fetchResults") {
      console.log("Fetching existing results from database...");

      try {
        const existingMatches = await prisma.match_results.findMany({
          where: { user_id: userId },
          include: {
            matched_user: {
              include: {
                user_profiles: true,
                user_product_genres: {
                  include: { product_genre: true },
                },
                user_availabilities: {
                  include: { timeslot: true },
                },
              },
            },
          },
          orderBy: { score: "desc" },
        });

        // 🎯 修正: 役割フィルタリングの改善
        let filteredMatches = existingMatches;
        if (desiredRole) {
          filteredMatches = existingMatches.filter((match) => {
            const candidateRole = match.matched_user?.user_profiles?.desired_role_in_team;
            // 指定した役割と一致 OR 候補者が"flexible"
            return candidateRole === desiredRole || candidateRole === "flexible";
          });
        }

        // レスポンス用データ整形
        const resultsForClient = filteredMatches.map((match) => ({
          id: match.matched_user.id,
          name: match.matched_user.name,
          email: match.matched_user.email,
          profile: {
            desired_role_in_team: match.matched_user.user_profiles?.desired_role_in_team,
            personality_type: match.matched_user.user_profiles?.personality_type,
            idea_status: match.matched_user.user_profiles?.idea_status,
            self_introduction_comment: match.matched_user.user_profiles?.self_introduction_comment,
          },
          product_genres:
            match.matched_user.user_product_genres?.map((upg) => ({
              id: upg.product_genre.id,
              name: upg.product_genre.name,
            })) || [],
          timeslots:
            match.matched_user.user_availabilities?.map((ua) => ({
              id: ua.timeslot.id,
              description: ua.timeslot.description,
              day_type: ua.timeslot.day_type,
            })) || [],
          match_score: Math.round(match.score * 100), // 0-100スケールに変換
          match_reason: match.match_reason || `類似度${Math.round(match.score * 100)}%でマッチしました`,
        }));

        console.log(`Returning ${resultsForClient.length} existing results`);
        return NextResponse.json({
          success: true,
          results: resultsForClient,
          count: resultsForClient.length,
          dataSource: "database",
        });
      } catch (fetchError) {
        console.error("❌ 既存結果取得エラー:", fetchError);
        return NextResponse.json({ success: false, error: "既存結果の取得に失敗しました" }, { status: 500 });
      }
    }

    // 新しいマッチング計算モード
    if (mode === "matching") {
      console.log("Starting new matching calculation...");

      // 🎯 修正: 過去のチームメイト取得（除外オプションがONの場合のみ）
      let pastTeammateIds: number[] = [];
      if (excludePastTeammates) {
        pastTeammateIds = await getPastTeammates(userId);
        console.log(`🚫 除外対象の過去チームメイト: ${pastTeammateIds.length}人`);
      }

      // ベクトルマッチングを使用するかの判定
      const shouldUseVectorMatching = useVectorMatching && process.env.OPENAI_API_KEY;
      console.log("Should use vector matching:", shouldUseVectorMatching);

      if (!shouldUseVectorMatching) {
        console.log("⚙️ Using flexible matching (vector matching disabled or no API key)");
        return await handleFlexibleMatching(userId, desiredRole, excludePastTeammates, pastTeammateIds);
      }

      console.log("🧠 Using vector matching");

      // 発火元ユーザーのプロフィール取得（活動時間含む）
      console.log("Fetching sourceProfile for userId:", userId);

      try {
        const sourceUser = await prisma.users.findUnique({
          where: { id: userId },
          include: {
            user_profiles: true,
            user_availabilities: {
              include: { timeslot: true },
            },
          },
        });

        if (!sourceUser?.user_profiles) {
          console.error("Source user profile not found for userId:", userId);
          return NextResponse.json({ success: false, error: "Source user profile not found" }, { status: 404 });
        }

        // 🎯 修正: 候補ユーザーの取得（過去チームメイト除外機能改善）
        console.log("Fetching candidateUsers, excluding userId:", userId);

        // 🎯 修正: より確実な除外条件の構築
        const whereCondition: any = {
          id: {
            not: userId,
            ...(excludePastTeammates && pastTeammateIds.length > 0 ? { notIn: pastTeammateIds } : {}),
          },
        };

        // 役割フィルタリング
        if (desiredRole) {
          whereCondition.user_profiles = {
            OR: [
              { desired_role_in_team: desiredRole }, // 指定した役割と一致
              { desired_role_in_team: "flexible" }, // または"flexible"
            ],
          };
        }

        const candidateUsers = await prisma.users.findMany({
          where: whereCondition,
          include: {
            user_profiles: true,
            user_product_genres: {
              include: { product_genre: true },
            },
            user_availabilities: {
              include: { timeslot: true },
            },
          },
        });

        console.log(`Found ${candidateUsers.length} candidateUsers (excludePastTeammates: ${excludePastTeammates})`);
        console.log(`除外された過去チームメイト: ${pastTeammateIds.length}人`);

        if (candidateUsers.length === 0) {
          console.log("No candidates found");
          return NextResponse.json({
            success: true,
            results: [],
            count: 0,
            message: "No matching candidates found",
          });
        }

        // OpenAI クライアント初期化
        console.log("Initializing OpenAI client");
        const openai = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY || "",
        });

        // 発火元ユーザーの活動時間を取得
        const sourceTimeslots = sourceUser.user_availabilities.map((ua) => ua.timeslot.description);

        // 発火元ユーザーの埋め込み取得
        const sourceText = profileToText(sourceUser.user_profiles, sourceTimeslots);
        console.log("Source text for embedding:", sourceText);

        let sourceVec: number[];
        try {
          const srcEmbedRes = await openai.embeddings.create({
            model: "text-embedding-3-small", // より新しいモデルを使用
            input: sourceText,
          });
          sourceVec = srcEmbedRes.data[0].embedding;
          console.log("Source embedding generated successfully");
        } catch (embedError) {
          console.error("Failed to generate source embedding:", embedError);
          console.log("⚠️ Falling back to flexible matching");
          return await handleFlexibleMatching(userId, desiredRole, excludePastTeammates, pastTeammateIds);
        }

        const matchResults = [];
        let successCount = 0;
        let errorCount = 0;

        // 🎯 改善: バッチ処理でAPI制限対策
        const batchSize = 5;
        for (let i = 0; i < candidateUsers.length; i += batchSize) {
          const batch = candidateUsers.slice(i, i + batchSize);

          for (const user of batch) {
            try {
              console.log(`--- Processing candidate user ${user.id} (${successCount + errorCount + 1}/${candidateUsers.length}) ---`);
              if (!user.user_profiles) {
                console.warn("Skipping user without profile:", user.id);
                errorCount++;
                continue;
              }

              // 候補者の活動時間を取得
              const candidateTimeslots = user.user_availabilities.map((ua) => ua.timeslot.description);

              // 候補者のテキスト生成と埋め込み取得
              const candidateText = profileToText(user.user_profiles, candidateTimeslots);
              console.log("Text for candidate embedding:", candidateText);

              const embRes = await openai.embeddings.create({
                model: "text-embedding-3-small",
                input: candidateText,
              });
              const candidateVec = embRes.data[0].embedding;

              // 類似度計算
              const similarity = cosineSimilarity(sourceVec, candidateVec);

              // 時間重複度計算
              const timeOverlap = calculateTimeOverlap(sourceTimeslots, candidateTimeslots);

              // 総合スコア = 類似度70% + 時間重複30%
              const finalScore = similarity * 0.7 + timeOverlap * 0.3;

              console.log(`User ${user.id} - Similarity: ${similarity.toFixed(3)}, TimeOverlap: ${timeOverlap.toFixed(3)}, FinalScore: ${finalScore.toFixed(3)}`);

              // スコアが閾値未満ならスキップ（調整: 0.3未満はマッチしないとみなす）
              if (finalScore < 0.3) {
                console.log(`Skipping user ${user.id} due to low score: ${finalScore}`);
                continue;
              }

              // マッチング理由生成
              const reason = `AIベクトル分析による類似度${Math.round(similarity * 100)}%、活動時間重複度${Math.round(timeOverlap * 100)}%で、総合マッチングスコア${Math.round(finalScore * 100)}%です。`;

              // match_results テーブルに upsert
              console.log("Upserting match_results for user pair:", userId, user.id);

              const record = await prisma.match_results.upsert({
                where: {
                  user_id_matched_user_id: {
                    user_id: userId,
                    matched_user_id: user.id,
                  },
                },
                update: {
                  score: finalScore,
                  match_reason: reason,
                },
                create: {
                  user_id: userId,
                  matched_user_id: user.id,
                  score: finalScore,
                  match_reason: reason,
                },
              });

              matchResults.push({
                id: user.id,
                name: user.name,
                email: user.email,
                profile: {
                  desired_role_in_team: user.user_profiles.desired_role_in_team,
                  personality_type: user.user_profiles.personality_type,
                  idea_status: user.user_profiles.idea_status,
                  self_introduction_comment: user.user_profiles.self_introduction_comment,
                },
                product_genres:
                  user.user_product_genres?.map((upg) => ({
                    id: upg.product_genre.id,
                    name: upg.product_genre.name,
                  })) || [],
                timeslots:
                  user.user_availabilities?.map((ua) => ({
                    id: ua.timeslot.id,
                    description: ua.timeslot.description,
                    day_type: ua.timeslot.day_type,
                  })) || [],
                match_score: Math.round(finalScore * 100),
                match_reason: reason,
                similarity: Math.round(similarity * 100),
                timeOverlap: Math.round(timeOverlap * 100),
              });

              successCount++;

              // API制限対策で少し待機
              await new Promise((resolve) => setTimeout(resolve, 100));
            } catch (innerError) {
              console.error("Error processing candidate user", user.id, innerError);
              errorCount++;
              continue;
            }
          }

          // バッチ間で少し待機
          if (i + batchSize < candidateUsers.length) {
            await new Promise((resolve) => setTimeout(resolve, 200));
          }
        }

        // スコア順でソート
        matchResults.sort((a, b) => b.match_score - a.match_score);

        console.log("Finished processing all candidates. Returning results.");
        console.log(`成功: ${successCount}件, エラー: ${errorCount}件`);

        return NextResponse.json({
          success: true,
          results: matchResults,
          count: matchResults.length,
          algorithm: "vector-matching",
          model: "text-embedding-3-small",
          message: `Vector matching completed with ${matchResults.length} results`,
          metadata: {
            totalCandidates: candidateUsers.length,
            matchedCandidates: matchResults.length,
            successCount: successCount,
            errorCount: errorCount,
            excludePastTeammates: excludePastTeammates,
            excludedPastTeammatesCount: pastTeammateIds.length,
            excludedPastTeammates: pastTeammateIds,
            weightings: {
              similarity: "70%",
              timeOverlap: "30%",
            },
          },
        });
      } catch (vectorMatchingError) {
        console.error("❌ ベクトルマッチングエラー:", vectorMatchingError);
        console.log("⚠️ フレキシブルマッチングにフォールバック");
        return await handleFlexibleMatching(userId, desiredRole, excludePastTeammates, pastTeammateIds);
      }
    }

    return NextResponse.json({ success: false, error: `Unsupported mode: ${mode}` }, { status: 400 });
  } catch (error: any) {
    console.error("Error in /api/matching/start route:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Unknown server error",
      },
      { status: 500 }
    );
  }
}

// 🎯 フレキシブルマッチングアルゴリズム（メイン処理）
async function handleFlexibleMatching(userId: number, desiredRole: string | null, excludePastTeammates: boolean = false, pastTeammateIds: number[] = []) {
  console.log("🔄 Executing flexible matching algorithm");

  try {
    // 🎯 ユーザー情報を取得（フレキシブルマッチング用のデータ含む）
    const sourceUser = await prisma.users.findUnique({
      where: { id: userId },
      include: {
        user_profiles: true,
        user_product_genres: { include: { product_genre: true } },
        user_availabilities: { include: { timeslot: true } },
        user_team_priorities: { include: { team_priority: true } },
      },
    });

    if (!sourceUser?.user_profiles) {
      throw new Error("Source user profile not found");
    }

    // 🎯 修正: 候補者取得で過去チームメイト除外とフレキシブル検索対応
    const whereCondition: any = {
      id: {
        not: userId,
        ...(excludePastTeammates && pastTeammateIds.length > 0 ? { notIn: pastTeammateIds } : {}),
      },
    };

    if (desiredRole) {
      whereCondition.user_profiles = {
        OR: [
          { desired_role_in_team: desiredRole }, // 指定した役割と一致
          { desired_role_in_team: "flexible" }, // または"flexible"
        ],
      };
    }

    const allCandidates = await prisma.users.findMany({
      where: whereCondition,
      include: {
        user_profiles: true,
        user_product_genres: { include: { product_genre: true } },
        user_availabilities: { include: { timeslot: true } },
        user_team_priorities: { include: { team_priority: true } },
      },
    });

    console.log(`Found ${allCandidates.length} candidates (excludePastTeammates: ${excludePastTeammates})`);
    console.log(`除外された過去チームメイト: ${pastTeammateIds.length}人`);

    // 🎯 UserProfile 形式に変換
    const currentUserProfile = convertToUserProfile(sourceUser);
    const candidateProfiles = allCandidates.filter((user) => user.user_profiles).map((user) => convertToUserProfile(user));

    console.log(`検索ユーザー: ${currentUserProfile.name} (role: "${currentUserProfile.desired_role_in_team}", idea: "${currentUserProfile.idea_status}")`);
    console.log(`候補者数: ${candidateProfiles.length}人`);

    // 🎯 フレキシブルマッチングサービス初期化
    const flexibleMatcher = new FlexibleMatchingService();

    // 🎯 フレキシブルフィルタリング実行
    const filteredCandidates = flexibleMatcher.filterCandidatesBySearchCriteria(currentUserProfile, candidateProfiles);

    console.log(`フィルタリング後の候補者数: ${filteredCandidates.length}人`);

    // 🎯 マッチングスコア計算
    const matchResults = [];

    for (const candidate of filteredCandidates) {
      try {
        let score = Math.floor(Math.random() * 30) + 60; // ベーススコア 60-90
        let reason = `${candidate.name}さんは、`;

        // フレキシブル性による加点
        const isFlexible = flexibleMatcher.isFlexibleUser(candidate);
        if (isFlexible) {
          reason += `柔軟な対応を希望されており、`;
          score += 10;
        }

        // 役割マッチング
        if (candidate.desired_role_in_team && candidate.desired_role_in_team !== "flexible") {
          if (candidate.desired_role_in_team === currentUserProfile.desired_role_in_team) {
            reason += `同じ役割(${candidate.desired_role_in_team})を希望し、`;
            score += 15;
          } else {
            reason += `異なる役割(${candidate.desired_role_in_team})で相補的な関係を築け、`;
            score += 12;
          }
        } else if (candidate.desired_role_in_team === "flexible") {
          reason += `柔軟な役割対応を希望されており、`;
          score += 10;
        }

        // アイデア状況マッチング
        if (candidate.idea_status && candidate.idea_status !== "flexible") {
          if (candidate.idea_status === currentUserProfile.idea_status) {
            reason += `アイデア状況が共通しており、`;
            score += 10;
          } else {
            reason += `異なるアイデア状況で協力できる可能性があり、`;
            score += 8;
          }
        } else if (candidate.idea_status === "flexible") {
          reason += `アイデア状況に柔軟性があり、`;
          score += 8;
        }

        // ジャンルマッチング
        const commonGenres = candidate.product_genre_ids.filter((g) => currentUserProfile.product_genre_ids.includes(g) && g !== 9);
        if (commonGenres.length > 0) {
          reason += `共通の興味分野があり、`;
          score += commonGenres.length * 5;
        } else if (candidate.product_genre_ids.includes(9) || currentUserProfile.product_genre_ids.includes(9)) {
          reason += `ジャンルに柔軟性があり、`;
          score += 8;
        }

        // 活動時間の重複
        const commonTimes = candidate.weekday_timeslot_ids.concat(candidate.weekend_timeslot_ids).filter((t) => currentUserProfile.weekday_timeslot_ids.concat(currentUserProfile.weekend_timeslot_ids).includes(t));
        if (commonTimes.length > 0) {
          reason += `活動時間が合致し、`;
          score += Math.min(commonTimes.length * 3, 15);
        }

        reason += `チーム開発での良いパートナーになる可能性があります。`;

        const result = {
          id: candidate.id,
          name: candidate.name,
          email: `user${candidate.id}@example.com`, // 仮のメール
          profile: {
            desired_role_in_team: candidate.desired_role_in_team,
            personality_type: candidate.personality_type,
            idea_status: candidate.idea_status,
            self_introduction_comment: candidate.self_introduction_comment,
          },
          product_genres: candidate.product_genre_ids.map((id) => ({
            id: id,
            name: `ジャンル${id}`,
          })),
          timeslots: candidate.weekday_timeslot_ids.concat(candidate.weekend_timeslot_ids).map((id) => ({
            id: id,
            description: `時間帯${id}`,
            day_type: id <= 6 ? "weekday" : "weekend_holiday",
          })),
          match_score: Math.min(95, score),
          match_reason: reason,
          isFlexible: isFlexible,
          algorithm: "flexible-matching",
        };

        matchResults.push(result);

        // データベースに保存
        await prisma.match_results.upsert({
          where: {
            user_id_matched_user_id: {
              user_id: userId,
              matched_user_id: result.id,
            },
          },
          update: {
            score: result.match_score / 100, // 0-1スケールに変換
            match_reason: result.match_reason,
          },
          create: {
            user_id: userId,
            matched_user_id: result.id,
            score: result.match_score / 100,
            match_reason: result.match_reason,
          },
        });
      } catch (resultError) {
        console.error(`Error processing candidate ${candidate.id}:`, resultError);
        continue;
      }
    }

    // スコア順でソート
    matchResults.sort((a, b) => b.match_score - a.match_score);

    console.log(`✅ フレキシブルマッチング完了: ${matchResults.length}件の結果`);

    return NextResponse.json({
      success: true,
      results: matchResults,
      count: matchResults.length,
      algorithm: "flexible-matching",
      message: `Flexible matching completed with ${matchResults.length} results`,
      metadata: {
        sourceUserFlexible: flexibleMatcher.isFlexibleUser(currentUserProfile),
        flexibleCandidates: matchResults.filter((r) => r.isFlexible).length,
        specificCandidates: matchResults.filter((r) => !r.isFlexible).length,
        excludePastTeammates: excludePastTeammates,
        excludedPastTeammatesCount: pastTeammateIds.length,
        excludedPastTeammates: pastTeammateIds,
      },
    });
  } catch (error: any) {
    console.error("Flexible matching error:", error);
    throw error;
  }
}

// 🎯 データ変換ヘルパー関数
function convertToUserProfile(user: any): UserProfile {
  return {
    id: user.id,
    name: user.name,
    desired_role_in_team: user.user_profiles?.desired_role_in_team || "flexible",
    personality_type: user.user_profiles?.personality_type || "",
    idea_status: user.user_profiles?.idea_status || "flexible",
    self_introduction_comment: user.user_profiles?.self_introduction_comment || "",
    product_genre_ids: user.user_product_genres?.map((upg: any) => upg.product_genre.id) || [],
    weekday_timeslot_ids: user.user_availabilities?.filter((ua: any) => ua.timeslot.day_type === "weekday").map((ua: any) => ua.timeslot.id) || [],
    weekend_timeslot_ids: user.user_availabilities?.filter((ua: any) => ua.timeslot.day_type === "weekend_holiday").map((ua: any) => ua.timeslot.id) || [],
    team_priority_ids: user.user_team_priorities?.map((utp: any) => utp.team_priority.id) || [],
  };
}

// 🎯 修正: フレキシブルマッチングサービス
class FlexibleMatchingService {
  /**
   * 🎯 修正: 検索条件に応じた候補者フィルタリング
   */
  filterCandidatesBySearchCriteria(currentUser: UserProfile, candidates: UserProfile[]): UserProfile[] {
    console.log("=== フレキシブルフィルタリング開始 ===");
    console.log(`検索者: ${currentUser.name}`);
    console.log(`検索者の希望役割: "${currentUser.desired_role_in_team}"`);
    console.log(`検索者の希望アイデア状況: "${currentUser.idea_status}"`);
    console.log(`検索者の希望ジャンル: [${currentUser.product_genre_ids.join(", ")}]`);

    const currentUserIsFlexible = this.isFlexibleUser(currentUser);

    // ケース1: 検索者が「こだわりなし」の場合
    // → 「こだわりなし」の人のみとマッチング
    if (currentUserIsFlexible) {
      console.log("🔍 ケース1: 検索者がフレキシブル → フレキシブルな人のみを対象");

      const flexibleCandidates = candidates.filter((candidate) => this.isFlexibleUser(candidate));

      console.log(`結果: ${flexibleCandidates.length}人のフレキシブルな候補者`);
      return flexibleCandidates;
    }

    // ケース2: 検索者が具体的な希望を持つ場合
    // → 同じ希望の人 + 「こだわりなし」の人の両方とマッチング
    console.log("🔍 ケース2: 検索者が具体的希望 → 同じ希望 + フレキシブルな人を対象");

    const matchingCandidates = candidates.filter((candidate) => {
      const candidateIsFlexible = this.isFlexibleUser(candidate);

      // フレキシブルな候補者は常に含める
      if (candidateIsFlexible) {
        return true;
      }

      // 具体的な希望が一致するかチェック
      const roleMatch = this.checkSpecificMatch(currentUser.desired_role_in_team, candidate.desired_role_in_team);

      const ideaMatch = this.checkSpecificMatch(currentUser.idea_status, candidate.idea_status);

      const genreMatch = this.checkGenreMatch(currentUser.product_genre_ids, candidate.product_genre_ids);

      // いずれかの条件で一致すれば候補に含める
      return roleMatch || ideaMatch || genreMatch;
    });

    console.log(`結果: ${matchingCandidates.length}人の候補者`);
    console.log(`- フレキシブル: ${matchingCandidates.filter((c) => this.isFlexibleUser(c)).length}人`);
    console.log(`- 具体的希望一致: ${matchingCandidates.filter((c) => !this.isFlexibleUser(c)).length}人`);

    return matchingCandidates;
  }

  /**
   * 🎯 修正: ユーザーがflexibleかどうかを判定
   */
  isFlexibleUser(user: UserProfile): boolean {
    const isRoleFlexible = user.desired_role_in_team === "flexible";
    const isIdeaFlexible = user.idea_status === "flexible";

    // 役割とアイデア状況の両方がflexibleな場合のみ、そのユーザーはflexibleとみなす
    return isRoleFlexible && isIdeaFlexible;
  }

  /**
   * 🎯 修正: 具体的な条件の一致チェック
   */
  private checkSpecificMatch(searchValue: string, candidateValue: string): boolean {
    // 両方とも具体的な値が設定されており、かつ一致する場合
    return searchValue !== "flexible" && candidateValue !== "flexible" && searchValue === candidateValue;
  }

  /**
   * 🎯 修正: ジャンルの一致チェック
   */
  private checkGenreMatch(searchGenres: number[], candidateGenres: number[]): boolean {
    const searcherIsGenreFlexible = searchGenres.includes(9);
    const candidateIsGenreFlexible = candidateGenres.includes(9);

    // 検索者が「ジャンルこだわらない」→ 候補者も「ジャンルこだわらない」の人のみ
    if (searcherIsGenreFlexible) {
      return candidateIsGenreFlexible;
    }

    // 検索者が具体的ジャンル → 同じジャンル or 「こだわらない」候補者
    if (candidateIsGenreFlexible) {
      return true; // 候補者が「こだわらない」なら一致
    }

    // 両方とも具体的ジャンル → 共通部分をチェック
    const commonGenres = searchGenres.filter((g) => candidateGenres.includes(g) && g !== 9);
    return commonGenres.length > 0;
  }
}
