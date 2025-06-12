import { type NextRequest, NextResponse } from "next/server"

// プロフィールデータの型定義
interface UserProfileData {
  personality_type: string | null
  idea_status: string | null
  desired_role_in_team: string | null
  self_introduction_comment: string | null
  product_genre_ids: number[]
  timeslot_ids: number[]
  team_priority_ids: number[]
}

// バリデーション関数
function validateProfileData(data: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  // 有効な選択肢かチェック
  const validIdeaStatuses = ["has_specific_idea", "has_rough_theme", "wants_to_brainstorm", "wants_to_participate"]
  if (data.idea_status && !validIdeaStatuses.includes(data.idea_status)) {
    errors.push("無効なアイデア状況が選択されています")
  }

  const validRoles = [
    "no_preference",
    "tech_lead",
    "developer_main",
    "biz_planning",
    "design_ux",
    "pm_management",
    "support_member",
  ]
  if (data.desired_role_in_team && !validRoles.includes(data.desired_role_in_team)) {
    errors.push("無効な役割が選択されています")
  }

  // 配列の検証
  if (data.product_genre_ids && !Array.isArray(data.product_genre_ids)) {
    errors.push("プロダクトジャンルIDは配列である必要があります")
  }

  if (data.timeslot_ids && !Array.isArray(data.timeslot_ids)) {
    errors.push("活動時間IDは配列である必要があります")
  }

  if (data.team_priority_ids && !Array.isArray(data.team_priority_ids)) {
    errors.push("チーム重視項目IDは配列である必要があります")
  }

  // 文字数制限
  if (data.self_introduction_comment && data.self_introduction_comment.length > 1000) {
    errors.push("自己紹介は1000文字以内で入力してください")
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

// プロフィール保存API
export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    // バリデーション
    const validation = validateProfileData(data)
    if (!validation.isValid) {
      return NextResponse.json({ success: false, errors: validation.errors }, { status: 400 })
    }

    // セキュリティ: HTMLタグの除去
    const sanitizedData: UserProfileData = {
      personality_type: data.personality_type?.trim().replace(/<[^>]*>/g, "") || null,
      idea_status: data.idea_status || null,
      desired_role_in_team: data.desired_role_in_team || null,
      self_introduction_comment: data.self_introduction_comment?.trim().replace(/<[^>]*>/g, "") || null,
      product_genre_ids: Array.isArray(data.product_genre_ids) ? data.product_genre_ids : [],
      timeslot_ids: Array.isArray(data.timeslot_ids) ? data.timeslot_ids : [],
      team_priority_ids: Array.isArray(data.team_priority_ids) ? data.team_priority_ids : [],
    }

    // TODO: データベースに保存
    // const userId = getCurrentUserId() // セッションから取得
    // await saveUserProfile(userId, sanitizedData)
    // await updateUserProductGenres(userId, sanitizedData.product_genre_ids)
    // await updateUserAvailabilities(userId, sanitizedData.timeslot_ids)
    // await updateUserTeamPriorities(userId, sanitizedData.team_priority_ids)

    console.log("プロフィール保存:", sanitizedData)

    return NextResponse.json({
      success: true,
      message: "プロフィールが正常に保存されました",
    })
  } catch (error) {
    console.error("プロフィール保存エラー:", error)
    return NextResponse.json({ success: false, error: "サーバーエラーが発生しました" }, { status: 500 })
  }
}

// プロフィール取得API
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ success: false, error: "ユーザーIDが必要です" }, { status: 400 })
    }

    // TODO: データベースからプロフィールを取得
    // const profile = await getUserProfileWithRelations(userId)

    // モックデータ
    const mockProfile = {
      personality_type: "INFP",
      idea_status: "wants_to_brainstorm",
      desired_role_in_team: "developer_main",
      self_introduction_comment: "Tech0でWeb開発を学んでいます。チームで楽しく開発したいです。",
      product_genre_ids: [2, 7], // 教育・学習支援, AI・機械学習
      timeslot_ids: [3, 4], // 平日18-20時, 平日20-22時
      team_priority_ids: [3, 7], // 和気あいあい, 新技術挑戦
    }

    return NextResponse.json({
      success: true,
      profile: mockProfile,
    })
  } catch (error) {
    console.error("プロフィール取得エラー:", error)
    return NextResponse.json({ success: false, error: "サーバーエラーが発生しました" }, { status: 500 })
  }
}
