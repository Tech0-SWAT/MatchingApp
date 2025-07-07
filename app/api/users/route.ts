// app/api/users/route.ts
import { type NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

interface User {
  id: number;
  name: string;
  email: string;
  profile?: {
    personality_type: string | null;
    desired_role_in_team: string | null;
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query") || "";
    const excludeIds = searchParams.get("excludeIds") || "";

    const excludeIdArray = excludeIds ? excludeIds.split(",").map((id) => Number.parseInt(id, 10)) : [];

    const users = await prisma.users.findMany({
      where: {
        AND: [
          query
            ? {
                OR: [{ name: { contains: query, mode: "insensitive" } }, { email: { contains: query, mode: "insensitive" } }],
              }
            : {},
          excludeIdArray.length > 0
            ? {
                id: { notIn: excludeIdArray },
              }
            : {},
        ],
      },
      include: {
        user_profiles: {
          select: {
            personality_type: true,
            desired_role_in_team: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    const formattedUsers: User[] = users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      profile: user.user_profiles
        ? {
            personality_type: user.user_profiles.personality_type,
            desired_role_in_team: user.user_profiles.desired_role_in_team,
          }
        : null,
    }));

    return NextResponse.json({
      success: true,
      users: formattedUsers,
    });
  } catch (error) {
    console.error("ユーザー取得エラー:", error);
    return NextResponse.json({ success: false, error: "サーバーエラーが発生しました" }, { status: 500 });
  }
}
