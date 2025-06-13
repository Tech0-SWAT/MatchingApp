import { type NextRequest, NextResponse } from "next/server";
// ★ 修正: lib/prisma.ts へのインポートパスをプロジェクト構造に合わせて修正
// app/api/teams/[teamId]/route.ts から見た lib/prisma.ts への相対パス
// (ルートまで上がる ../../../../ と、そこから lib に降りる lib/prisma)
import prisma from "../../../../../lib/prisma";

// チームメンバー管理API
export async function POST(request: NextRequest, { params }: { params: { teamId: string } }) {
  try {
    const teamId = Number.parseInt(params.teamId);
    // teamIdのバリデーション
    if (isNaN(teamId)) {
      return NextResponse.json({ success: false, error: "無効なチームIDです" }, { status: 400 });
    }

    const data = await request.json();
    const { user_id, role_in_team, action } = data;

    if (!user_id || !action) {
      return NextResponse.json({ success: false, error: "必須項目が不足しています" }, { status: 400 });
    }

    const parsedUserId = Number.parseInt(user_id);
    // user_idのバリデーション
    if (isNaN(parsedUserId)) {
      return NextResponse.json({ success: false, error: "無効なユーザーIDです" }, { status: 400 });
    }

    // ★ 修正: TODO部分をPrismaを使ったデータベース操作に置き換える
    if (action === "add") {
      // メンバー追加 (team_memberships に新しいレコードを作成)
      // 同じチーム、同じユーザーで、left_atがnullのレコードが存在しないことを確認することも検討
      await prisma.team_memberships.create({
        data: {
          team_id: teamId,
          user_id: parsedUserId,
          role_in_team: role_in_team || null, // 役割が指定されていなければnull
          joined_at: new Date(), // 現在日時
          left_at: null, // まだ離脱していない
        },
      });
      console.log("メンバー追加:", { teamId, user_id, role_in_team });
    } else if (action === "remove") {
      // メンバー削除（論理削除: left_atを設定）
      await prisma.team_memberships.updateMany({
        where: {
          team_id: teamId,
          user_id: parsedUserId,
          left_at: null, // 現在まだ所属しているメンバーのみを対象
        },
        data: {
          left_at: new Date(), // 離脱日時を現在に設定
          updated_at: new Date(),
        },
      });
      console.log("メンバー削除:", { teamId, user_id });
    } else if (action === "update_role") {
      // 役割更新
      await prisma.team_memberships.updateMany({
        where: {
          team_id: teamId,
          user_id: parsedUserId,
          left_at: null, // 現在所属しているメンバーの役割を更新
        },
        data: {
          role_in_team: role_in_team || null, // 新しい役割を設定
          updated_at: new Date(),
        },
      });
      console.log("役割更新:", { teamId, user_id, role_in_team });
    } else {
      // 無効なアクションが指定された場合
      return NextResponse.json({ success: false, error: "無効なアクションです" }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: "メンバー情報が更新されました",
    });
  } catch (error) {
    console.error("メンバー管理エラー:", error);
    return NextResponse.json({ success: false, error: "サーバーエラーが発生しました" }, { status: 500 });
  }
}
