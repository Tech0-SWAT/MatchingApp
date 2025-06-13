import { type NextRequest, NextResponse } from "next/server";
// ★ 修正: lib/prisma.ts へのインポートパスをプロジェクト構造に合わせて修正
// tsconfig.json の設定でエイリアスが使えるようになったため、短いエイリアスパスを使用
import prisma from "@/lib/prisma"; // @/lib/prisma は student-matching-app/lib/prisma を指す

// チーム関連の型定義
// Prismaが生成する型を使うため、これらのインターフェースは厳密には不要ですが、
// コードの可読性や既存の型定義との整合性のため残しておいても問題ありません。
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

// チーム作成API
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { course_step_id, name, project_name, member_ids, creator_role } = data;

    // バリデーション
    if (!course_step_id || !name || !Array.isArray(member_ids) || member_ids.length === 0) {
      return NextResponse.json({ success: false, error: "必須項目が不足しています" }, { status: 400 });
    }

    // ★ 修正: モックデータを削除し、Prismaを使ってデータベースにチーム作成
    // トランザクションを使ってチームとメンバーシップを同時に作成
    const newTeam = await prisma.$transaction(async (tx) => {
      const team = await tx.teams.create({
        data: {
          course_step_id,
          name: name.trim(),
          project_name: project_name?.trim() || null,
          // created_at, updated_at は Prisma の @default(now()) と @updatedAt で自動設定される
        },
      });

      // メンバーシップの作成
      const membershipData = member_ids.map((userId: number) => ({
        team_id: team.id,
        user_id: userId,
        // チーム作成者は creator_role を設定、それ以外はnullまたはデフォルト値
        role_in_team: userId === member_ids[0] && creator_role ? creator_role : null, // 最初のメンバーをクリエイターと仮定
      }));

      await tx.team_memberships.createMany({
        data: membershipData,
      });

      return team;
    });

    console.log("チーム作成:", {
      team_id: newTeam.id,
      course_step_id,
      name,
      project_name,
      member_ids,
      creator_role,
    });

    return NextResponse.json({
      success: true,
      team_id: newTeam.id,
      message: "チームが正常に作成されました",
    });
  } catch (error) {
    console.error("チーム作成エラー:", error);
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
      const parsedUserId = parseInt(userIdParam, 10);
      if (isNaN(parsedUserId)) {
        return NextResponse.json({ success: false, error: "無効なユーザーIDです" }, { status: 400 });
      }
      // team_membershipsを介してユーザーが所属しているチームをフィルタリング
      whereClause.team_memberships = {
        some: {
          user_id: parsedUserId,
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

    // ★ 修正: モックデータを削除し、Prismaを使ってデータベースからチーム情報を取得
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

    // データを整形 (モックデータに合わせて)
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
    return NextResponse.json({ success: false, error: "サーバーエラーが発生しました" }, { status: 500 });
  }
}
