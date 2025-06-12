import { type NextRequest, NextResponse } from "next/server"

// チームメンバー管理API
export async function POST(request: NextRequest, { params }: { params: { teamId: string } }) {
  try {
    const teamId = Number.parseInt(params.teamId)
    const data = await request.json()
    const { user_id, role_in_team, action } = data

    if (!user_id || !action) {
      return NextResponse.json({ success: false, error: "必須項目が不足しています" }, { status: 400 })
    }

    if (action === "add") {
      // TODO: メンバー追加
      // await addTeamMember(teamId, user_id, role_in_team)
      console.log("メンバー追加:", { teamId, user_id, role_in_team })
    } else if (action === "remove") {
      // TODO: メンバー削除（left_atを設定）
      // await removeTeamMember(teamId, user_id)
      console.log("メンバー削除:", { teamId, user_id })
    } else if (action === "update_role") {
      // TODO: 役割更新
      // await updateMemberRole(teamId, user_id, role_in_team)
      console.log("役割更新:", { teamId, user_id, role_in_team })
    }

    return NextResponse.json({
      success: true,
      message: "メンバー情報が更新されました",
    })
  } catch (error) {
    console.error("メンバー管理エラー:", error)
    return NextResponse.json({ success: false, error: "サーバーエラーが発生しました" }, { status: 500 })
  }
}
