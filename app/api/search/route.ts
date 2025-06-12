import { type NextRequest, NextResponse } from "next/server"

// 検索条件の型定義
interface SearchCriteria {
  keyword?: string
  desired_role_in_team?: string
  personality_type?: string
  timeslot_ids?: number[]
  idea_status?: string
  product_genre_ids?: number[]
  team_priority_ids?: number[]
}

// 検索結果の型定義
interface SearchResult {
  id: number
  name: string
  email: string
  profile: {
    personality_type: string | null
    idea_status: string | null
    desired_role_in_team: string | null
    self_introduction_comment: string | null
  }
  product_genres: Array<{ id: number; name: string }>
  timeslots: Array<{ id: number; description: string; day_type: string }>
  team_priorities: Array<{ id: number; name: string }>
  match_keywords: string[]
}

// 検索API
export async function POST(request: NextRequest) {
  try {
    const searchCriteria: SearchCriteria = await request.json()

    // セキュリティ: 入力値のサニタイズ
    const sanitizedCriteria = {
      keyword: searchCriteria.keyword?.trim().replace(/<[^>]*>/g, "") || "",
      desired_role_in_team: searchCriteria.desired_role_in_team || "",
      personality_type: searchCriteria.personality_type?.trim().replace(/<[^>]*>/g, "") || "",
      timeslot_ids: Array.isArray(searchCriteria.timeslot_ids) ? searchCriteria.timeslot_ids : [],
      idea_status: searchCriteria.idea_status || "",
      product_genre_ids: Array.isArray(searchCriteria.product_genre_ids) ? searchCriteria.product_genre_ids : [],
      team_priority_ids: Array.isArray(searchCriteria.team_priority_ids) ? searchCriteria.team_priority_ids : [],
    }

    // TODO: データベースで検索実行
    // const results = await searchUsersWithJoins(sanitizedCriteria)

    // モックデータ
    const mockResults: SearchResult[] = [
      {
        id: 1,
        name: "田中 太郎",
        email: "tanaka@example.com",
        profile: {
          personality_type: "INTJ",
          idea_status: "has_specific_idea",
          desired_role_in_team: "tech_lead",
          self_introduction_comment:
            "機械学習エンジニアとして3年の経験があります。特にディープラーニングを用いた画像解析が得意です。",
        },
        product_genres: [
          { id: 7, name: "AI・機械学習を活用したプロダクト" },
          { id: 8, name: "ソーシャルグッド・地域活性化" },
          { id: 3, name: "ヘルスケア・ウェルネス" },
        ],
        timeslots: [
          { id: 4, description: "平日 20時～22時", day_type: "weekday" },
          { id: 5, description: "平日 22時～24時", day_type: "weekday" },
          { id: 12, description: "土日祝 8時～10時", day_type: "weekend_holiday" },
          { id: 13, description: "土日祝 10時～12時", day_type: "weekend_holiday" },
        ],
        team_priorities: [
          { id: 1, name: "スピード感を持ってどんどん進めたい" },
          { id: 7, name: "新しい技術やツールに積極的に挑戦したい" },
        ],
        match_keywords: ["Python", "AI", "機械学習", "社会課題"],
      },
      {
        id: 2,
        name: "佐藤 花子",
        email: "sato@example.com",
        profile: {
          personality_type: "ENFP",
          idea_status: "wants_to_brainstorm",
          desired_role_in_team: "design_ux",
          self_introduction_comment:
            "フロントエンド開発とUXデザインの両方を手がけています。ユーザーの声を大切にしたプロダクト作りを心がけています。",
        },
        product_genres: [
          { id: 2, name: "教育・学習支援" },
          { id: 6, name: "コミュニケーション・SNS" },
          { id: 9, name: "ジャンルには特にこだわらない" },
        ],
        timeslots: [
          { id: 3, description: "平日 18時～20時", day_type: "weekday" },
          { id: 15, description: "土日祝 14時～16時", day_type: "weekend_holiday" },
          { id: 16, description: "土日祝 16時～18時", day_type: "weekend_holiday" },
          { id: 17, description: "土日祝 18時～20時", day_type: "weekend_holiday" },
        ],
        team_priorities: [
          { id: 3, name: "和気あいあいとした雰囲気で楽しく" },
          { id: 2, name: "じっくり議論し、品質を重視したい" },
        ],
        match_keywords: ["JavaScript", "UI/UX", "Web開発", "教育"],
      },
    ]

    // 検索条件に基づくフィルタリング
    let filteredResults = mockResults

    if (sanitizedCriteria.keyword) {
      filteredResults = filteredResults.filter(
        (user) =>
          user.name.toLowerCase().includes(sanitizedCriteria.keyword.toLowerCase()) ||
          user.profile.self_introduction_comment?.toLowerCase().includes(sanitizedCriteria.keyword.toLowerCase()) ||
          user.product_genres.some((genre) =>
            genre.name.toLowerCase().includes(sanitizedCriteria.keyword.toLowerCase()),
          ) ||
          user.team_priorities.some((priority) =>
            priority.name.toLowerCase().includes(sanitizedCriteria.keyword.toLowerCase()),
          ),
      )
    }

    if (sanitizedCriteria.desired_role_in_team) {
      filteredResults = filteredResults.filter(
        (user) => user.profile.desired_role_in_team === sanitizedCriteria.desired_role_in_team,
      )
    }

    if (sanitizedCriteria.personality_type) {
      filteredResults = filteredResults.filter((user) =>
        user.profile.personality_type?.toLowerCase().includes(sanitizedCriteria.personality_type.toLowerCase()),
      )
    }

    if (sanitizedCriteria.idea_status) {
      filteredResults = filteredResults.filter((user) => user.profile.idea_status === sanitizedCriteria.idea_status)
    }

    if (sanitizedCriteria.product_genre_ids.length > 0) {
      filteredResults = filteredResults.filter((user) =>
        sanitizedCriteria.product_genre_ids.some((genreId) =>
          user.product_genres.some((genre) => genre.id === genreId),
        ),
      )
    }

    if (sanitizedCriteria.timeslot_ids.length > 0) {
      filteredResults = filteredResults.filter((user) =>
        sanitizedCriteria.timeslot_ids.some((timeslotId) =>
          user.timeslots.some((timeslot) => timeslot.id === timeslotId),
        ),
      )
    }

    if (sanitizedCriteria.team_priority_ids.length > 0) {
      filteredResults = filteredResults.filter((user) =>
        sanitizedCriteria.team_priority_ids.some((priorityId) =>
          user.team_priorities.some((priority) => priority.id === priorityId),
        ),
      )
    }

    console.log("検索実行:", sanitizedCriteria)
    console.log("検索結果:", filteredResults.length, "件")

    return NextResponse.json({
      success: true,
      results: filteredResults,
      total: filteredResults.length,
    })
  } catch (error) {
    console.error("検索エラー:", error)
    return NextResponse.json({ success: false, error: "サーバーエラーが発生しました" }, { status: 500 })
  }
}
