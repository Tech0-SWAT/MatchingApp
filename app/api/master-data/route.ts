import { type NextRequest, NextResponse } from "next/server"

// マスターデータの型定義
interface ProductGenre {
  id: number
  name: string
}

interface AvailabilityTimeslot {
  id: number
  description: string
  day_type: "weekday" | "weekend_holiday"
  sort_order: number | null
}

interface TeamPriority {
  id: number
  name: string
}

interface CourseStep {
  id: number
  name: string
  start_date: string | null
  end_date: string | null
  description: string | null
}

// マスターデータ取得API
export async function GET(request: NextRequest) {
  try {
    // TODO: データベースからマスターデータを取得
    // const productGenres = await getProductGenresFromDB()
    // const timeslots = await getTimeslotsFromDB()
    // const teamPriorities = await getTeamPrioritiesFromDB()
    // const courseSteps = await getCourseStepsFromDB()

    // モックデータ
    const productGenres: ProductGenre[] = [
      { id: 1, name: "業務効率化・SaaS" },
      { id: 2, name: "教育・学習支援" },
      { id: 3, name: "ヘルスケア・ウェルネス" },
      { id: 4, name: "エンターテイメント・ゲーム" },
      { id: 5, name: "Eコマース・マーケットプレイス" },
      { id: 6, name: "コミュニケーション・SNS" },
      { id: 7, name: "AI・機械学習を活用したプロダクト" },
      { id: 8, name: "ソーシャルグッド・地域活性化" },
      { id: 9, name: "ジャンルには特にこだわらない" },
    ]

    const timeslots: AvailabilityTimeslot[] = [
      { id: 1, description: "平日 朝5時～7時", day_type: "weekday", sort_order: 1 },
      { id: 2, description: "平日 7時～9時", day_type: "weekday", sort_order: 2 },
      { id: 3, description: "平日 18時～20時", day_type: "weekday", sort_order: 3 },
      { id: 4, description: "平日 20時～22時", day_type: "weekday", sort_order: 4 },
      { id: 5, description: "平日 22時～24時", day_type: "weekday", sort_order: 5 },
      { id: 6, description: "平日 いつでも良い", day_type: "weekday", sort_order: 6 },
      { id: 7, description: "平日 特に希望なし", day_type: "weekday", sort_order: 7 },
      { id: 8, description: "土日祝 0時～2時", day_type: "weekend_holiday", sort_order: 1 },
      { id: 9, description: "土日祝 2時～4時", day_type: "weekend_holiday", sort_order: 2 },
      { id: 10, description: "土日祝 4時～6時", day_type: "weekend_holiday", sort_order: 3 },
      { id: 11, description: "土日祝 6時～8時", day_type: "weekend_holiday", sort_order: 4 },
      { id: 12, description: "土日祝 8時～10時", day_type: "weekend_holiday", sort_order: 5 },
      { id: 13, description: "土日祝 10時～12時", day_type: "weekend_holiday", sort_order: 6 },
      { id: 14, description: "土日祝 12時～14時", day_type: "weekend_holiday", sort_order: 7 },
      { id: 15, description: "土日祝 14時～16時", day_type: "weekend_holiday", sort_order: 8 },
      { id: 16, description: "土日祝 16時～18時", day_type: "weekend_holiday", sort_order: 9 },
      { id: 17, description: "土日祝 18時～20時", day_type: "weekend_holiday", sort_order: 10 },
      { id: 18, description: "土日祝 20時～22時", day_type: "weekend_holiday", sort_order: 11 },
      { id: 19, description: "土日祝 22時～24時", day_type: "weekend_holiday", sort_order: 12 },
      { id: 20, description: "土日祝 いつでも良い", day_type: "weekend_holiday", sort_order: 13 },
      { id: 21, description: "土日祝 特に希望なし", day_type: "weekend_holiday", sort_order: 14 },
    ]

    const teamPriorities: TeamPriority[] = [
      { id: 1, name: "スピード感を持ってどんどん進めたい" },
      { id: 2, name: "じっくり議論し、品質を重視したい" },
      { id: 3, name: "和気あいあいとした雰囲気で楽しく" },
      { id: 4, name: "目標達成に向けてストイックに" },
      { id: 5, name: "オンラインミーティングを頻繁に行いたい" },
      { id: 6, name: "非同期コミュニケーション（チャット等）中心で柔軟に" },
      { id: 7, name: "新しい技術やツールに積極的に挑戦したい" },
      { id: 8, name: "まずは手堅く、実績のある技術で" },
    ]

    const courseSteps: CourseStep[] = [
      {
        id: 1,
        name: "Step 1",
        start_date: "2024-04-01",
        end_date: "2024-06-30",
        description: "基礎学習ステップ",
      },
      {
        id: 2,
        name: "Step 2",
        start_date: "2024-07-01",
        end_date: "2024-09-30",
        description: "応用学習ステップ",
      },
      {
        id: 3,
        name: "Step 3",
        start_date: "2024-10-01",
        end_date: "2024-12-31",
        description: "実践学習ステップ",
      },
    ]

    return NextResponse.json({
      success: true,
      data: {
        productGenres,
        timeslots,
        teamPriorities,
        courseSteps,
      },
    })
  } catch (error) {
    console.error("マスターデータ取得エラー:", error)
    return NextResponse.json({ success: false, error: "サーバーエラーが発生しました" }, { status: 500 })
  }
}
