import { type NextRequest, NextResponse } from "next/server";
// ★ 修正: lib/prisma.ts へのインポートパスをプロジェクト構造に合わせて修正
// app/api/profile/route.ts から見た lib/prisma.ts への相対パス
// tsconfig.json の設定でエイリアスが使えるようになったため、短いエイリアスパスを使用
import prisma from "@/lib/prisma"; // @/lib/prisma は student-matching-app/lib/prisma を指す

// プロフィールデータの型定義 (Prismaが自動生成する型と連携させるため、内容は維持しつつ使用)
interface UserProfileData {
  personality_type: string | null;
  idea_status: string | null;
  desired_role_in_team: string | null;
  self_introduction_comment: string | null;
  product_genre_ids: number[];
  timeslot_ids: number[];
  team_priority_ids: number[];
}

// バリデーション関数 (変更なし)
function validateProfileData(data: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  const validIdeaStatuses = ["has_specific_idea", "has_rough_theme", "wants_to_brainstorm", "wants_to_participate"];
  if (data.idea_status && !validIdeaStatuses.includes(data.idea_status)) {
    errors.push("無効なアイデア状況が選択されています");
  }

  const validRoles = ["no_preference", "tech_lead", "developer_main", "biz_planning", "design_ux", "pm_management", "support_member"];
  if (data.desired_role_in_team && !validRoles.includes(data.desired_role_in_team)) {
    errors.push("無効な役割が選択されています");
  }

  if (data.product_genre_ids && !Array.isArray(data.product_genre_ids)) {
    errors.push("プロダクトジャンルIDは配列である必要があります");
  }

  if (data.timeslot_ids && !Array.isArray(data.timeslot_ids)) {
    errors.push("活動時間IDは配列である必要があります");
  }

  if (data.team_priority_ids && !Array.isArray(data.team_priority_ids)) {
    errors.push("チーム重視項目IDは配列である必要があります");
  }

  if (data.self_introduction_comment && data.self_introduction_comment.length > 1000) {
    errors.push("自己紹介は1000文字以内で入力してください");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// プロフィール保存API
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    // バリデーション
    const validation = validateProfileData(data);
    if (!validation.isValid) {
      return NextResponse.json({ success: false, errors: validation.errors }, { status: 400 });
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
    };

    // TODO: 実際のユーザーIDを取得するロジックに置き換える！
    // 例: const userId = await getSessionUserId(request);
    const userId = 1; // **仮のユーザーID。実際の認証後にログインユーザーのIDに置き換えること！**

    // ユーザープロフィールの更新または作成 (upsert)
    // $transaction を使用して、プロフィールと関連データを一括で処理し、整合性を保つ
    await prisma.$transaction(async (tx) => {
      await tx.user_profiles.upsert({
        where: { user_id: userId },
        update: {
          personality_type: sanitizedData.personality_type,
          idea_status: sanitizedData.idea_status,
          desired_role_in_team: sanitizedData.desired_role_in_team,
          self_introduction_comment: sanitizedData.self_introduction_comment,
          updated_at: new Date(),
        },
        create: {
          user_id: userId,
          personality_type: sanitizedData.personality_type,
          idea_status: sanitizedData.idea_status,
          desired_role_in_team: sanitizedData.desired_role_in_team,
          self_introduction_comment: sanitizedData.self_introduction_comment,
        },
      });

      // 関連テーブルの更新 (user_product_genres)
      // 既存の関連を全て削除し、新しい関連を再作成
      await tx.user_product_genres.deleteMany({ where: { user_id: userId } });
      if (sanitizedData.product_genre_ids.length > 0) {
        await tx.user_product_genres.createMany({
          data: sanitizedData.product_genre_ids.map((genreId) => ({
            user_id: userId,
            product_genre_id: genreId,
          })),
        });
      }

      // 関連テーブルの更新 (user_availabilities)
      await tx.user_availabilities.deleteMany({ where: { user_id: userId } });
      if (sanitizedData.timeslot_ids.length > 0) {
        await tx.user_availabilities.createMany({
          data: sanitizedData.timeslot_ids.map((timeslotId) => ({
            user_id: userId,
            timeslot_id: timeslotId,
          })),
        });
      }

      // 関連テーブルの更新 (user_team_priorities)
      await tx.user_team_priorities.deleteMany({ where: { user_id: userId } });
      if (sanitizedData.team_priority_ids.length > 0) {
        await tx.user_team_priorities.createMany({
          data: sanitizedData.team_priority_ids.map((priorityId) => ({
            user_id: userId,
            team_priority_id: priorityId,
          })),
        });
      }
    }); // $transaction 終了

    console.log("プロフィール保存:", sanitizedData);

    return NextResponse.json({
      success: true,
      message: "プロフィールが正常に保存されました",
    });
  } catch (error) {
    console.error("プロフィール保存エラー:", error);
    return NextResponse.json({ success: false, error: "サーバーエラーが発生しました" }, { status: 500 });
  }
}

// プロフィール取得API
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userIdParam = searchParams.get("userId");

    if (!userIdParam) {
      return NextResponse.json({ success: false, error: "ユーザーIDが必要です" }, { status: 400 });
    }

    // ★ 修正: "current" の処理を追加
    let userId: number;

    if (userIdParam === "current") {
      // 現在ログインしているユーザー（田中太郎）のID
      userId = 1;
    } else {
      userId = parseInt(userIdParam, 10);
      if (isNaN(userId)) {
        return NextResponse.json({ success: false, error: "無効なユーザーIDです" }, { status: 400 });
      }
    }

    // ユーザー情報と関連するプロフィール、ジャンル、時間帯、優先度をまとめて取得
    const userWithProfile = await prisma.users.findUnique({
      where: { id: userId },
      include: {
        user_profiles: true, // user_profilesテーブルとの1対1リレーション
        user_product_genres: {
          include: { product_genre: true }, // 中間テーブルとジャンル情報を結合
        },
        user_availabilities: {
          include: { timeslot: true }, // 中間テーブルと時間帯情報を結合
        },
        user_team_priorities: {
          include: { team_priority: true }, // 中間テーブルと優先度情報を結合
        },
      },
    });

    if (!userWithProfile || !userWithProfile.user_profiles) {
      // プロフィールが存在しない場合、空のプロフィールを返すか、エラーとするか検討
      return NextResponse.json({ success: false, error: "プロフィールが見つかりません" }, { status: 404 });
    }

    const profile = userWithProfile.user_profiles;

    // 関連IDの配列を整形
    const product_genre_ids = userWithProfile.user_product_genres.map((upg) => upg.product_genre.id);
    const timeslot_ids = userWithProfile.user_availabilities.map((ua) => ua.timeslot.id);
    const team_priority_ids = userWithProfile.user_team_priorities.map((utp) => utp.team_priority.id);

    const responseProfile: UserProfileData = {
      // UserProfileData型に合わせる
      personality_type: profile.personality_type,
      idea_status: profile.idea_status,
      desired_role_in_team: profile.desired_role_in_team,
      self_introduction_comment: profile.self_introduction_comment,
      product_genre_ids,
      timeslot_ids,
      team_priority_ids,
    };

    return NextResponse.json({
      success: true,
      profile: responseProfile,
    });
  } catch (error) {
    console.error("プロフィール取得エラー:", error);
    return NextResponse.json({ success: false, error: "サーバーエラーが発生しました" }, { status: 500 });
  }
}
