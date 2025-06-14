import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { OpenAI } from "openai";

// コサイン類似度計算ヘルパー
function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

// プロファイル全フィールドをテキスト結合
function profileToText(profile: {
  personality_type: string | null;
  idea_status: string | null;
  desired_role_in_team: string | null;
  self_introduction_comment: string | null;
}): string {
  return [
    profile.personality_type,
    profile.idea_status,
    profile.desired_role_in_team,
    profile.self_introduction_comment,
  ]
    .filter(Boolean)
    .join(" ");
}

export async function POST(req: NextRequest) {
  try {
    console.log("🔍 /api/matching/start called");
    const body = await req.json();
    console.log("Request body:", body);

    const userId: number = body.userId;
    const desiredRole: string | null = body.desired_role_in_team || null;
    console.log("Parsed userId:", userId, "desiredRole:", desiredRole);

    if (!userId) {
      console.warn("Missing userId");
      return NextResponse.json({ success: false, error: "userId is required" }, { status: 400 });
    }

    // 発火元ユーザーのプロフィール取得
    console.log("Fetching sourceProfile for userId:", userId);
    const sourceProfile = await prisma.user_profiles.findUnique({
      where: { user_id: userId },
    });
    console.log("sourceProfile result:", sourceProfile);
    if (!sourceProfile) {
      console.error("Source user profile not found for userId:", userId);
      return NextResponse.json({ success: false, error: "Source user profile not found" }, { status: 404 });
    }

    // 候補ユーザーの絞り込み
    console.log("Fetching candidateUsers, excluding userId:", userId);
    const candidateUsers = await prisma.users.findMany({
      where: {
        id: { not: userId },
        user_profiles: desiredRole
          ? { desired_role_in_team: desiredRole }
          : undefined,
      },
      include: {
        user_profiles: true,
      },
    });
    console.log(`Found ${candidateUsers.length} candidateUsers`);

    // OpenAI クライアント初期化
    console.log("Initializing OpenAI client");
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || "",
    });

    // 発火元ユーザーの埋め込み取得
    const sourceText = profileToText(sourceProfile);
    console.log("Source text for embedding:", sourceText);
    const srcEmbedRes = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: sourceText,
    });
    console.log("source embed response:", srcEmbedRes);
    const sourceVec = srcEmbedRes.data[0].embedding;
    console.log("sourceVec slice:", sourceVec.slice(0, 5), "...");

    const matchResults = [];

    for (const user of candidateUsers) {
      try {
        console.log(`--- Processing candidate user ${user.id} ---`);
        if (!user.user_profiles) {
          console.warn("Skipping user without profile:", user.id);
          continue;
        }
        const text = profileToText(user.user_profiles);
        console.log("Text for candidate embedding:", text);
        const embRes = await openai.embeddings.create({
          model: "text-embedding-ada-002",
          input: text,
        });
        console.log("candidate embed response:", embRes);
        const vec = embRes.data[0].embedding;
        const score = cosineSimilarity(sourceVec, vec);
        console.log(`Computed similarity score for user ${user.id}:`, score);

        // match_results テーブルに upsert
        console.log("Upserting match_results for user pair:", userId, user.id);
        const record = await prisma.match_results.upsert({
          where: {
            user_id_matched_user_id: {
              user_id: userId,
              matched_user_id: user.id,
            },
          },
          update: { score },
          create: {
            user_id: userId,
            matched_user_id: user.id,
            score,
          },
        });
        console.log("Upsert result:", record);

        matchResults.push(record);
      } catch (innerError) {
        console.error("Error processing candidate user", user.id, innerError);
      }
    }

    console.log("Finished processing all candidates. Returning results.");
    return NextResponse.json({ success: true, results: matchResults });
  } catch (error: any) {
    console.error("Error in /api/matching/start route:", error);
    return NextResponse.json({ success: false, error: error.message || "Unknown server error" }, { status: 500 });
  }
}
