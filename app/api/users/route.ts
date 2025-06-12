import { type NextRequest, NextResponse } from "next/server"

// ユーザー情報の型定義
interface User {
  id: number
  name: string
  email: string
  profile?: {
    personality_type: string | null
    desired_role_in_team: string | null
  }
}

// ユーザー一覧取得API
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("query") || ""
    const excludeIds = searchParams.get("excludeIds") || ""

    // 除外するIDの配列を作成
    const excludeIdArray = excludeIds ? excludeIds.split(",").map((id) => Number.parseInt(id)) : []

    // TODO: データベースからユーザー情報を取得
    // const users = await getUsersFromDB(query, excludeIdArray)

    // モックデータ
    const mockUsers: User[] = [
      {
        id: 1,
        name: "田中 太郎",
        email: "tanaka@example.com",
        profile: {
          personality_type: "INTJ",
          desired_role_in_team: "tech_lead",
        },
      },
      {
        id: 2,
        name: "佐藤 花子",
        email: "sato@example.com",
        profile: {
          personality_type: "ENFP",
          desired_role_in_team: "design_ux",
        },
      },
      {
        id: 3,
        name: "鈴木 次郎",
        email: "suzuki@example.com",
        profile: {
          personality_type: "ISTJ",
          desired_role_in_team: "developer_main",
        },
      },
      {
        id: 4,
        name: "山田 美咲",
        email: "yamada@example.com",
        profile: {
          personality_type: "ENFJ",
          desired_role_in_team: "pm_management",
        },
      },
      {
        id: 5,
        name: "伊藤 健太",
        email: "ito@example.com",
        profile: {
          personality_type: "ESTP",
          desired_role_in_team: "biz_planning",
        },
      },
      {
        id: 6,
        name: "高橋 優子",
        email: "takahashi@example.com",
        profile: {
          personality_type: "INFP",
          desired_role_in_team: "support_member",
        },
      },
    ]

    // 検索クエリでフィルタリング
    let filteredUsers = mockUsers
    if (query) {
      const lowerQuery = query.toLowerCase()
      filteredUsers = filteredUsers.filter(
        (user) => user.name.toLowerCase().includes(lowerQuery) || user.email.toLowerCase().includes(lowerQuery),
      )
    }

    // 除外IDでフィルタリング
    if (excludeIdArray.length > 0) {
      filteredUsers = filteredUsers.filter((user) => !excludeIdArray.includes(user.id))
    }

    return NextResponse.json({
      success: true,
      users: filteredUsers,
    })
  } catch (error) {
    console.error("ユーザー取得エラー:", error)
    return NextResponse.json({ success: false, error: "サーバーエラーが発生しました" }, { status: 500 })
  }
}
