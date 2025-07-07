// app/api/master-data/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    console.log("=== Database Master Data API Called ===");

    const [productGenres, timeslots, teamPriorities, courseSteps] = await Promise.all([prisma.product_genres.findMany(), prisma.availability_timeslots.findMany(), prisma.team_priorities.findMany(), prisma.course_steps.findMany()]);

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
    console.error("=== Master Data API Error ===", error);

    // ダミーデータで代替
    return NextResponse.json({
      success: true,
      data: {
        productGenres: [],
        timeslots: [],
        teamPriorities: [],
        courseSteps: [],
      },
    });
  }
}
