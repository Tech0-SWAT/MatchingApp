import { type NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// マスターデータの型定義
interface ProductGenre {
  id: number;
  name: string;
}

interface AvailabilityTimeslot {
  id: number;
  description: string;
  day_type: "weekday" | "weekend_holiday";
  sort_order: number | null;
}

interface TeamPriority {
  id: number;
  name: string;
}

interface CourseStep {
  id: number;
  name: string;
  start_date: string | null;
  end_date: string | null;
  description: string | null;
}

// マスターデータ取得API
export async function GET(request: NextRequest) {
  try {
    const productGenres: ProductGenre[] = await prisma.product_genres.findMany({
      orderBy: { id: "asc" },
    });

    const timeslots: AvailabilityTimeslot[] = await prisma.availability_timeslots.findMany({
      orderBy: [{ day_type: "asc" }, { sort_order: "asc" }],
    });

    const teamPriorities: TeamPriority[] = await prisma.team_priorities.findMany({
      orderBy: { id: "asc" },
    });

    const courseSteps: CourseStep[] = await prisma.course_steps.findMany({
      orderBy: { id: "asc" },
    });

    return NextResponse.json({
      success: true,
      data: {
        productGenres,
        timeslots,
        teamPriorities,
        courseSteps,
      },
    });
  } catch (error) {
    console.error("マスターデータ取得エラー:", error);
    return NextResponse.json(
      {
        success: false,
        error: "サーバーエラーが発生しました",
      },
      { status: 500 }
    );
  }
}
