// app/api/teams/route.ts

import { type NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library"; // Prismaのエラー型をインポート

// チーム関連の型定義（Prismaで自動生成される型があるため、これらはコードの理解を助ける目的）
interface Team {
  id: number;
  course_step_id: number;
  name: string;
  project_name: string | null;
  created_at: string;
  updated_at: string;
}

interface TeamMembership {
  id: number;
  team_id: number;
  user_id: number;
  role_in_team: string | null;
  joined_at: string;
}

interface TeamWithMembers extends Team {
  members: Array<{
    user_id: number;
    user_name: string;
    user_email: string;
    role_in_team: string | null;
    joined_at: string;
  }>;
  course_step_name: string;
}

interface MemberData {
  user_id: number;
  role_in_team: string | null;
}

// ログインユーザーIDを取得するヘルパー関数
async function getCurrentUserId(request: NextRequest): Promise<number | null> {
  try {
    // TODO: 実際の認証システムからログインユーザーIDを取得する処理をここに実装
    // 暫定的に固定値を返すが、実際の認証システムに合わせて修正が必要
    return 1; // 現在ログインしているユーザーID（田中太郎）
  } catch (error) {
    console.error("ログインユーザーID取得エラー:", error);
    return null;
  }
}

// チーム作成API
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { course_step_id, name, project_name, member_data, creator_role } = data;

    console.log("=== API: チーム作成リクエスト受信 ===");
    console.log("Received data:", JSON.stringify(data, null, 2));

    // 作成者のユーザーIDを取得
    const creatorUserId = await getCurrentUserId(request);
    if (!creatorUserId) {
      return NextResponse.json(
        {
          success: false,
          error: "ログインユーザーの情報を取得できませんでした",
        },
        { status: 401 }
      );
    }

    console.log("Creator user ID:", creatorUserId);

    // バリデーション
    if (!course_step_id || !name || !Array.isArray(member_data) || member_data.length === 0) {
      console.log("❌ 基本項目のバリデーションエラー");
      return NextResponse.json(
        {
          success: false,
          error: "必須項目が不足しています。チーム名、ステップ、メンバーは必須です。",
        },
        { status: 400 }
      );
    }

    if (typeof creator_role !== "string" || creator_role.trim() === "") {
      console.log("❌ 作成者役割のバリデーションエラー");
      return NextResponse.json(
        {
          success: false,
          error: "あなたの役割を選択してください。",
        },
        { status: 400 }
      );
    }

    // member_dataの形式チェック
    const isValidMemberData = member_data.every((member: any) => typeof member.user_id === "number" && (typeof member.role_in_team === "string" || member.role_in_team === null));

    if (!isValidMemberData) {
      console.log("❌ メンバーデータの形式エラー");
      return NextResponse.json(
        {
          success: false,
          error: "メンバーデータの形式が正しくありません。",
        },
        { status: 400 }
      );
    }

    // メンバーのユーザーIDを抽出
    const memberUserIds = member_data.map((member: MemberData) => member.user_id);
    const allMemberIds = [...new Set([creatorUserId, ...memberUserIds])]; // 重複除去

    console.log("Member user IDs:", memberUserIds);
    console.log("All member IDs (including creator):", allMemberIds);

    // course_stepの存在確認
    const courseStep = await prisma.course_steps.findUnique({
      where: { id: course_step_id },
    });

    if (!courseStep) {
      return NextResponse.json(
        {
          success: false,
          error: "指定されたコースステップが存在しません",
        },
        { status: 400 }
      );
    }

    // ユーザーIDの存在確認（作成者も含む全メンバー）
    const users = await prisma.users.findMany({
      where: { id: { in: allMemberIds } },
    });

    if (users.length !== allMemberIds.length) {
      const foundUserIds = new Set(users.map((u) => u.id));
      const invalidUserIds = allMemberIds.filter((id) => !foundUserIds.has(id));
      return NextResponse.json(
        {
          success: false,
          error: `存在しないユーザーIDが含まれています: ${invalidUserIds.join(", ")}`,
        },
        { status: 400 }
      );
    }

    console.log("✅ バリデーション通過、チーム作成開始");

    const newTeam = await prisma.$transaction(async (tx) => {
      // チーム作成
      const team = await tx.teams.create({
        data: {
          course_step_id,
          name: name.trim(),
          project_name: project_name?.trim() || null,
        },
      });

      console.log("チーム作成完了:", team.id);

      // メンバーシップデータを準備
      const membershipData = [
        // 作成者のメンバーシップ
        {
          team_id: team.id,
          user_id: creatorUserId,
          role_in_team: creator_role.trim(),
          joined_at: new Date(),
          left_at: null,
        },
        // その他のメンバーのメンバーシップ（作成者が重複しないようフィルタリング）
        ...member_data
          .filter((member: MemberData) => member.user_id !== creatorUserId)
          .map((member: MemberData) => ({
            team_id: team.id,
            user_id: member.user_id,
            role_in_team: member.role_in_team,
            joined_at: new Date(),
            left_at: null,
          })),
      ];

      console.log("メンバーシップデータ:", membershipData);

      // メンバーシップを一括作成
      await tx.team_memberships.createMany({
        data: membershipData,
      });

      console.log("メンバーシップ作成完了");

      return team;
    });

    console.log("チーム作成成功:", {
      team_id: newTeam.id,
      course_step_id,
      name,
      project_name,
      creator_user_id: creatorUserId,
      all_member_ids: allMemberIds,
      creator_role,
    });

    return NextResponse.json({
      success: true,
      team_id: newTeam.id,
      message: "チームが正常に作成されました",
    });
  } catch (error) {
    console.error("❌ チーム作成エラー:", error);

    if (error instanceof PrismaClientKnownRequestError) {
      console.error("チーム作成Prismaエラー (P" + error.code + "):", error.message, "メタデータ:", error.meta);
      // P2002 はユニーク制約違反
      if (error.code === "P2002") {
        return NextResponse.json(
          {
            success: false,
            error: `データベースエラー: この${(error.meta?.target as string[])?.join(", ") || "項目"}は既に存在します。`,
          },
          { status: 409 }
        ); // Conflict
      }
      return NextResponse.json(
        {
          success: false,
          error: `データベースエラー: ${error.message}`,
        },
        { status: 500 }
      );
    } else if (error instanceof Error) {
      console.error("チーム作成一般エラー:", error.message, error.stack);
      return NextResponse.json(
        {
          success: false,
          error: `サーバーエラーが発生しました: ${error.message}`,
        },
        { status: 500 }
      );
    }
    console.error("チーム作成不明なエラー:", error);
    return NextResponse.json(
      {
        success: false,
        error: "サーバーエラーが発生しました",
      },
      { status: 500 }
    );
  }
}

// チーム削除API
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const teamIdParam = searchParams.get("teamId");

    // バリデーション
    if (!teamIdParam) {
      return NextResponse.json({ success: false, error: "チームIDが指定されていません" }, { status: 400 });
    }

    const teamId = parseInt(teamIdParam, 10);
    if (isNaN(teamId)) {
      return NextResponse.json({ success: false, error: "無効なチームIDです" }, { status: 400 });
    }

    // 削除権限チェック用に現在のユーザーIDを取得
    const currentUserId = await getCurrentUserId(request);
    if (!currentUserId) {
      return NextResponse.json(
        {
          success: false,
          error: "ログインユーザーの情報を取得できませんでした",
        },
        { status: 401 }
      );
    }

    // チームの存在確認と作成者チェック
    const team = await prisma.teams.findUnique({
      where: { id: teamId },
      include: {
        team_memberships: {
          where: { left_at: null },
          include: { user: true },
        },
      },
    });

    if (!team) {
      return NextResponse.json({ success: false, error: "指定されたチームが見つかりません" }, { status: 404 });
    }

    // 削除権限チェック（チームメンバーかつ作成者またはリーダー権限があるユーザー）
    const currentUserMembership = team.team_memberships.find((m) => m.user_id === currentUserId);
    if (!currentUserMembership) {
      return NextResponse.json(
        {
          success: false,
          error: "このチームを削除する権限がありません",
        },
        { status: 403 }
      );
    }

    // チーム削除処理（論理削除）
    await prisma.$transaction(async (tx) => {
      // 全メンバーを離脱状態にする（論理削除）
      await tx.team_memberships.updateMany({
        where: {
          team_id: teamId,
          left_at: null,
        },
        data: {
          left_at: new Date(),
          updated_at: new Date(),
        },
      });

      // チームテーブル自体は残す（履歴として）が、検索対象外にするため
      // project_nameに削除マークを付ける（または将来deleted_atカラムを追加）
      await tx.teams.update({
        where: { id: teamId },
        data: {
          project_name: team.project_name ? `[削除済み] ${team.project_name}` : "[削除済み]",
          updated_at: new Date(),
        },
      });
    });

    console.log("チーム削除:", {
      team_id: teamId,
      team_name: team.name,
      deleted_by_user_id: currentUserId,
      member_count: team.team_memberships.length,
    });

    return NextResponse.json({
      success: true,
      message: "チームが正常に削除されました",
    });
  } catch (error) {
    console.error("チーム削除エラー:", error);
    if (error instanceof Error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: false, error: "サーバーエラーが発生しました" }, { status: 500 });
  }
}

// チーム一覧取得API
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userIdParam = searchParams.get("userId");
    const courseStepIdParam = searchParams.get("courseStepId");

    let whereClause: any = {};

    // userIdによるフィルタリング (現在参加しているチームのみ)
    if (userIdParam) {
      let userId: number;

      if (userIdParam === "current") {
        const currentUserId = await getCurrentUserId(request);
        if (!currentUserId) {
          return NextResponse.json(
            {
              success: false,
              error: "ログインユーザーの情報を取得できませんでした",
            },
            { status: 401 }
          );
        }
        userId = currentUserId;
        console.log("現在のログインユーザーID:", userId);
      } else {
        userId = parseInt(userIdParam, 10);
        if (isNaN(userId)) {
          return NextResponse.json({ success: false, error: "無効なユーザーIDです" }, { status: 400 });
        }
      }

      // team_membershipsを介してユーザーが所属しているチームをフィルタリング
      whereClause.team_memberships = {
        some: {
          user_id: userId,
          left_at: null, // まだ離脱していないメンバー
        },
      };
    }

    // courseStepIdによるフィルタリング
    if (courseStepIdParam) {
      const parsedCourseStepId = parseInt(courseStepIdParam, 10);
      if (isNaN(parsedCourseStepId)) {
        return NextResponse.json({ success: false, error: "無効なコースステップIDです" }, { status: 400 });
      }
      whereClause.course_step_id = parsedCourseStepId;
    }

    // 削除されたチームを除外
    whereClause.AND = [
      {
        OR: [
          { project_name: null },
          {
            project_name: {
              not: {
                contains: "[削除済み]",
              },
            },
          },
        ],
      },
    ];

    console.log("チーム検索条件:", whereClause);

    const teams = await prisma.teams.findMany({
      where: whereClause,
      include: {
        course_step: {
          select: {
            name: true,
          },
        },
        team_memberships: {
          where: {
            left_at: null, // 現在のメンバーのみ
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        created_at: "desc", // 新しいチームが上に表示されるように
      },
    });

    console.log("取得されたチーム数:", teams.length);

    // データを整形
    const formattedTeams: TeamWithMembers[] = teams.map((team) => ({
      id: team.id,
      course_step_id: team.course_step_id,
      name: team.name,
      project_name: team.project_name,
      created_at: team.created_at.toISOString(),
      updated_at: team.updated_at.toISOString(),
      course_step_name: team.course_step.name,
      members: team.team_memberships.map((membership) => ({
        user_id: membership.user.id,
        user_name: membership.user.name,
        user_email: membership.user.email,
        role_in_team: membership.role_in_team,
        joined_at: membership.joined_at.toISOString(),
      })),
    }));

    return NextResponse.json({
      success: true,
      teams: formattedTeams,
    });
  } catch (error) {
    console.error("チーム取得エラー:", error);
    if (error instanceof Error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: false, error: "サーバーエラーが発生しました" }, { status: 500 });
  }
}
