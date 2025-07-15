// app/api/teams/route.ts
import { type NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import jwt from "jsonwebtoken";

// JWTトークンからユーザーIDを取得するヘルパー関数
function getUserIdFromToken(request: NextRequest): number | null {
  try {
    const token = request.cookies.get("token")?.value;
    if (!token) {
      console.log("🔍 JWTトークンが見つかりません");
      return null;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret") as { userId: number };
    console.log("🔍 JWT検証成功, userId:", decoded.userId);
    return decoded.userId;
  } catch (error) {
    console.error("❌ JWT verification failed:", error);
    return null;
  }
}

// ✅ GETメソッド - チーム一覧取得
export async function GET(request: NextRequest) {
  try {
    console.log("📡 GET /api/teams - チーム取得開始");

    // データベース接続確認
    try {
      await prisma.$connect();
      console.log("✅ データベース接続確認完了");
    } catch (dbError) {
      console.error("❌ データベース接続失敗:", dbError);
      throw new Error("データベース接続に失敗しました");
    }

    const url = new URL(request.url);
    const userIdParam = url.searchParams.get("user_id");
    const teamIdParam = url.searchParams.get("teamId");

    console.log("🔍 パラメータ確認:", { userIdParam, teamIdParam });

    // 特定チームの取得
    if (teamIdParam) {
      const teamId = parseInt(teamIdParam);
      if (isNaN(teamId)) {
        console.log("❌ 無効なチームID:", teamIdParam);
        return NextResponse.json({ success: false, error: "無効なチームIDです" }, { status: 400 });
      }

      console.log("🔍 特定チーム取得開始, teamId:", teamId);

      try {
        const team = await prisma.teams.findUnique({
          where: { id: teamId },
          include: {
            course_step: true,
            team_memberships: {
              where: { left_at: null },
              include: {
                user: true,
              },
            },
          },
        });

        if (!team) {
          console.log("❌ チームが見つかりません, teamId:", teamId);
          return NextResponse.json({ success: false, error: "チームが見つかりません" }, { status: 404 });
        }

        const formattedTeam = {
          id: team.id,
          course_step_id: team.course_step_id,
          name: team.name,
          project_name: team.project_name,
          created_at: team.created_at,
          updated_at: team.updated_at,
          course_step_name: team.course_step?.name || "未設定",
          members: team.team_memberships.map((membership) => ({
            user_id: membership.user_id,
            user_name: membership.user.name,
            user_email: membership.user.email,
            role_in_team: membership.role_in_team,
            joined_at: membership.joined_at,
          })),
        };

        console.log("✅ 特定チーム取得成功:", formattedTeam.name);
        return NextResponse.json({ success: true, team: formattedTeam });
      } catch (teamError) {
        console.error("❌ 特定チーム取得エラー:", teamError);
        throw teamError;
      }
    }

    // 全チーム取得または特定ユーザーのチーム取得
    let whereCondition = {};

    if (userIdParam) {
      const userId = parseInt(userIdParam);
      if (isNaN(userId)) {
        console.log("❌ 無効なユーザーID:", userIdParam);
        return NextResponse.json({ success: false, error: "無効なユーザーIDです" }, { status: 400 });
      }

      console.log(`🔍 ユーザー ${userId} のチーム取得`);

      // 特定ユーザーが参加しているチームのみ取得
      whereCondition = {
        team_memberships: {
          some: {
            user_id: userId,
            left_at: null,
          },
        },
      };
    } else {
      console.log("🔍 全チーム取得");
    }

    console.log("🔍 whereCondition:", JSON.stringify(whereCondition, null, 2));

    try {
      const teams = await prisma.teams.findMany({
        where: whereCondition,
        include: {
          course_step: true,
          team_memberships: {
            where: { left_at: null },
            include: {
              user: true,
            },
          },
        },
        orderBy: { created_at: "desc" },
      });

      console.log("🔍 取得したチーム数:", teams.length);

      const formattedTeams = teams.map((team) => {
        try {
          return {
            id: team.id,
            course_step_id: team.course_step_id,
            name: team.name,
            project_name: team.project_name,
            created_at: team.created_at,
            updated_at: team.updated_at,
            course_step_name: team.course_step?.name || "未設定",
            members: team.team_memberships.map((membership) => ({
              user_id: membership.user_id,
              user_name: membership.user.name,
              user_email: membership.user.email,
              role_in_team: membership.role_in_team,
              joined_at: membership.joined_at,
            })),
          };
        } catch (formatError) {
          console.error("❌ チームフォーマットエラー:", formatError, "team:", team);
          throw formatError;
        }
      });

      console.log(`✅ ${formattedTeams.length}件のチームを取得`);
      return NextResponse.json({ success: true, teams: formattedTeams });
    } catch (queryError) {
      console.error("❌ チーム取得クエリエラー:", queryError);
      throw queryError;
    }
  } catch (error) {
    console.error("❌ チーム取得エラー:", error);

    // エラーの詳細情報をログ出力
    if (error instanceof Error) {
      console.error("❌ エラーメッセージ:", error.message);
      console.error("❌ エラースタック:", error.stack);
    }

    return NextResponse.json(
      {
        success: false,
        error: "チーム情報の取得に失敗しました",
        debug: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

// ✅ POSTメソッド - チーム作成
export async function POST(request: NextRequest) {
  try {
    console.log("📡 POST /api/teams - チーム作成開始");

    // データベース接続確認
    try {
      await prisma.$connect();
      console.log("✅ データベース接続確認完了");
    } catch (dbError) {
      console.error("❌ データベース接続失敗:", dbError);
      throw new Error("データベース接続に失敗しました");
    }

    // 認証チェック
    const currentUserId = getUserIdFromToken(request);
    if (!currentUserId) {
      console.log("❌ 認証失敗: ユーザーIDが取得できません");
      return NextResponse.json({ success: false, error: "認証が必要です" }, { status: 401 });
    }

    console.log("🔍 認証成功, currentUserId:", currentUserId);

    const data = await request.json();
    const { course_step_id, name, project_name, member_data, creator_role } = data;

    console.log("🔍 受信データ:", { course_step_id, name, project_name, member_data, creator_role });

    // バリデーション
    if (!course_step_id || !name) {
      console.log("❌ 必須項目不足:", { course_step_id, name });
      return NextResponse.json({ success: false, error: "必須項目が不足しています" }, { status: 400 });
    }

    // コースステップの存在確認
    try {
      const courseStep = await prisma.course_steps.findUnique({
        where: { id: course_step_id },
      });

      if (!courseStep) {
        console.log("❌ コースステップが見つかりません, course_step_id:", course_step_id);
        return NextResponse.json({ success: false, error: "指定されたコースステップが見つかりません" }, { status: 404 });
      }

      console.log("✅ コースステップ確認完了:", courseStep.name);
    } catch (courseStepError) {
      console.error("❌ コースステップ確認エラー:", courseStepError);
      throw courseStepError;
    }

    // トランザクションでチーム作成
    try {
      const result = await prisma.$transaction(async (tx) => {
        console.log("🔍 トランザクション開始");

        // チーム作成
        const team = await tx.teams.create({
          data: {
            course_step_id,
            name,
            project_name: project_name || null,
            created_at: new Date(),
            updated_at: new Date(),
          },
        });

        console.log("✅ チーム作成完了:", team);

        // 作成者をチームメンバーに追加
        await tx.team_memberships.create({
          data: {
            team_id: team.id,
            user_id: currentUserId,
            role_in_team: creator_role || "tech",
            joined_at: new Date(),
            left_at: null,
          },
        });

        console.log("✅ 作成者をメンバーに追加完了");

        // 追加メンバーがいる場合は追加
        if (member_data && Array.isArray(member_data) && member_data.length > 0) {
          console.log("🔍 追加メンバー処理開始, count:", member_data.length);

          for (const member of member_data) {
            console.log("🔍 メンバー追加処理:", member);

            // ユーザーの存在確認
            const userExists = await tx.users.findUnique({
              where: { id: member.user_id },
            });

            if (userExists) {
              await tx.team_memberships.create({
                data: {
                  team_id: team.id,
                  user_id: member.user_id,
                  role_in_team: member.role_in_team || "tech",
                  joined_at: new Date(),
                  left_at: null,
                },
              });
              console.log("✅ メンバー追加完了:", userExists.name);
            } else {
              console.log("⚠️ ユーザーが見つかりません, user_id:", member.user_id);
            }
          }
        }

        console.log("✅ トランザクション完了");
        return team;
      });

      console.log(`📡 チーム "${result.name}" が作成されました (ID: ${result.id})`);
      return NextResponse.json({ success: true, team: result });
    } catch (transactionError) {
      console.error("❌ トランザクションエラー:", transactionError);
      throw transactionError;
    }
  } catch (error) {
    console.error("❌ チーム作成エラー:", error);

    // エラーの詳細情報をログ出力
    if (error instanceof Error) {
      console.error("❌ エラーメッセージ:", error.message);
      console.error("❌ エラースタック:", error.stack);
    }

    return NextResponse.json(
      {
        success: false,
        error: "チーム作成に失敗しました",
        debug: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

// ✅ DELETEメソッド - チーム削除
export async function DELETE(request: NextRequest) {
  try {
    console.log("📡 DELETE /api/teams - チーム削除開始");

    // データベース接続確認
    try {
      await prisma.$connect();
      console.log("✅ データベース接続確認完了");
    } catch (dbError) {
      console.error("❌ データベース接続失敗:", dbError);
      throw new Error("データベース接続に失敗しました");
    }

    // 認証チェック
    const currentUserId = getUserIdFromToken(request);
    if (!currentUserId) {
      console.log("❌ 認証失敗: ユーザーIDが取得できません");
      return NextResponse.json({ success: false, error: "認証が必要です" }, { status: 401 });
    }

    console.log("🔍 認証成功, currentUserId:", currentUserId);

    const url = new URL(request.url);
    const teamIdParam = url.searchParams.get("teamId");

    console.log("🔍 削除対象チームID:", teamIdParam);

    if (!teamIdParam) {
      console.log("❌ チームIDが指定されていません");
      return NextResponse.json({ success: false, error: "チームIDが必要です" }, { status: 400 });
    }

    const teamId = parseInt(teamIdParam);
    if (isNaN(teamId)) {
      console.log("❌ 無効なチームID:", teamIdParam);
      return NextResponse.json({ success: false, error: "無効なチームIDです" }, { status: 400 });
    }

    // チームの存在確認と権限チェック
    try {
      const team = await prisma.teams.findUnique({
        where: { id: teamId },
        include: {
          team_memberships: {
            where: { left_at: null },
          },
        },
      });

      if (!team) {
        console.log("❌ チームが見つかりません, teamId:", teamId);
        return NextResponse.json({ success: false, error: "チームが見つかりません" }, { status: 404 });
      }

      console.log("✅ チーム確認完了:", team.name);

      // チームメンバーかどうかチェック
      const isTeamMember = team.team_memberships.some((m) => m.user_id === currentUserId);
      if (!isTeamMember) {
        console.log("❌ 権限なし: ユーザーはチームメンバーではありません");
        return NextResponse.json({ success: false, error: "このチームを削除する権限がありません" }, { status: 403 });
      }

      console.log("✅ 権限確認完了");

      // チーム削除（物理削除）
      await prisma.teams.delete({
        where: { id: teamId },
      });

      console.log(`📡 チーム "${team.name}" が削除されました (ID: ${teamId})`);
      return NextResponse.json({ success: true, message: "チームが削除されました" });
    } catch (deleteError) {
      console.error("❌ チーム削除処理エラー:", deleteError);
      throw deleteError;
    }
  } catch (error) {
    console.error("❌ チーム削除エラー:", error);

    // エラーの詳細情報をログ出力
    if (error instanceof Error) {
      console.error("❌ エラーメッセージ:", error.message);
      console.error("❌ エラースタック:", error.stack);
    }

    return NextResponse.json(
      {
        success: false,
        error: "チーム削除に失敗しました",
        debug: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
