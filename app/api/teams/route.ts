import { type NextRequest, NextResponse } from "next/server"

// チーム関連の型定義
interface Team {
  id: number
  course_step_id: number
  name: string
  project_name: string | null
  created_at: string
  updated_at: string
}

// TeamMembershipの型定義を修正
interface TeamMembership {
  id: number
  team_id: number
  user_id: number
  role_in_team: string | null
  joined_at: string
}

// TeamWithMembersの型定義を修正
interface TeamWithMembers extends Team {
  members: Array<{
    user_id: number
    user_name: string
    user_email: string
    role_in_team: string | null
    joined_at: string
  }>
  course_step_name: string
}

// チーム作成API
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const { course_step_id, name, project_name, member_ids, creator_role } = data

    // バリデーション
    if (!course_step_id || !name || !Array.isArray(member_ids) || member_ids.length === 0) {
      return NextResponse.json({ success: false, error: "必須項目が不足しています" }, { status: 400 })
    }

    // TODO: データベースにチーム作成
    // const teamId = await createTeam({
    //   course_step_id,
    //   name: name.trim(),
    //   project_name: project_name?.trim() || null
    // })

    // TODO: チームメンバーシップ作成
    // await createTeamMemberships(teamId, member_ids, creator_role)

    const mockTeamId = Date.now()

    console.log("チーム作成:", {
      team_id: mockTeamId,
      course_step_id,
      name,
      project_name,
      member_ids,
      creator_role,
    })

    return NextResponse.json({
      success: true,
      team_id: mockTeamId,
      message: "チームが正常に作成されました",
    })
  } catch (error) {
    console.error("チーム作成エラー:", error)
    return NextResponse.json({ success: false, error: "サーバーエラーが発生しました" }, { status: 500 })
  }
}

// チーム一覧取得API
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const courseStepId = searchParams.get("courseStepId")

    // TODO: データベースからチーム情報を取得
    // const teams = await getTeamsWithMembers({ userId, courseStepId })

    // モックデータを修正 - left_atとis_currentフィールドを削除
    const mockTeams: TeamWithMembers[] = [
      {
        id: 1,
        course_step_id: 1,
        name: "Team Alpha",
        project_name: "学習管理システム",
        created_at: "2024-04-15T10:00:00Z",
        updated_at: "2024-04-15T10:00:00Z",
        course_step_name: "Step 1",
        members: [
          {
            user_id: 1, // 現在のユーザー
            user_name: "田中 太郎",
            user_email: "tanaka@example.com",
            role_in_team: "Tech Lead",
            joined_at: "2024-04-15T10:00:00Z",
          },
          {
            user_id: 2,
            user_name: "佐藤 花子",
            user_email: "sato@example.com",
            role_in_team: "Designer",
            joined_at: "2024-04-15T10:00:00Z",
          },
          {
            user_id: 3,
            user_name: "鈴木 次郎",
            user_email: "suzuki@example.com",
            role_in_team: "Developer",
            joined_at: "2024-04-15T10:00:00Z",
          },
        ],
      },
      {
        id: 2,
        course_step_id: 2,
        name: "Team Beta",
        project_name: "AIチャットボット",
        created_at: "2024-07-10T10:00:00Z",
        updated_at: "2024-07-10T10:00:00Z",
        course_step_name: "Step 2",
        members: [
          {
            user_id: 1, // 現在のユーザー
            user_name: "田中 太郎",
            user_email: "tanaka@example.com",
            role_in_team: "Developer",
            joined_at: "2024-07-10T10:00:00Z",
          },
          {
            user_id: 4,
            user_name: "山田 美咲",
            user_email: "yamada@example.com",
            role_in_team: "PM",
            joined_at: "2024-07-10T10:00:00Z",
          },
        ],
      },
      {
        id: 3,
        course_step_id: 3,
        name: "Team Gamma",
        project_name: "モバイルアプリ",
        created_at: "2024-10-05T10:00:00Z",
        updated_at: "2024-10-05T10:00:00Z",
        course_step_name: "Step 3",
        members: [
          {
            user_id: 1, // 現在のユーザー
            user_name: "田中 太郎",
            user_email: "tanaka@example.com",
            role_in_team: "Tech Lead",
            joined_at: "2024-10-05T10:00:00Z",
          },
          {
            user_id: 5,
            user_name: "伊藤 健太",
            user_email: "ito@example.com",
            role_in_team: "Biz",
            joined_at: "2024-10-05T10:00:00Z",
          },
        ],
      },
    ]

    // フィルタリング部分を修正 - left_atとis_currentに関する条件を削除
    // 現在のユーザーが参加しているチームのみをフィルタリング
    let filteredTeams = mockTeams

    if (userId && userId !== "current") {
      const currentUserId = Number.parseInt(userId)
      filteredTeams = filteredTeams.filter((team) => team.members.some((member) => member.user_id === currentUserId))
    } else if (userId === "current") {
      // 現在のユーザーID（モックではID: 1）が参加しているチームのみ
      const currentUserId = 1
      filteredTeams = filteredTeams.filter((team) => team.members.some((member) => member.user_id === currentUserId))
    }

    // コースステップでのフィルタリング
    if (courseStepId) {
      filteredTeams = filteredTeams.filter((team) => team.course_step_id === Number.parseInt(courseStepId))
    }

    return NextResponse.json({
      success: true,
      teams: filteredTeams,
    })
  } catch (error) {
    console.error("チーム取得エラー:", error)
    return NextResponse.json({ success: false, error: "サーバーエラーが発生しました" }, { status: 500 })
  }
}
