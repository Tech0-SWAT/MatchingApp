// components/profile-detail-screen.tsx
"use client"; // クライアントコンポーネントであることを宣言

import React from "react"; // Reactをインポート
// uiコンポーネントのインポートは必要に応じて調整してください
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"; // CardHeader, CardTitleも追加
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, User, Code, Clock, Target, MessageSquare, Briefcase, Heart, Calendar } from "lucide-react"; // MessageSquare を含める

// プロップスの型定義（実際のAPIデータ構造に合わせて修正）
interface ProfileDetailScreenProps {
  student: {
    id: number;
    name: string;
    email?: string;
    profile?: {
      personality_type?: string;
      idea_status?: string;
      desired_role_in_team?: string; // DBからはBIZ, TECH, DESIGN, FLEXIBLE が来る想定
      self_introduction_comment?: string;
    };
    product_genres?: Array<{
      id: number;
      name: string;
    }>;
    timeslots?: Array<{
      id: number;
      description: string;
      day_type: string;
    }>;
    match_score?: number;
    match_reason?: string;
  };
  onNavigate: (screen: string, data?: any) => void;
}

// 役割タイプのラベル変換
// ★★修正点★★: DBから来る大文字の英語名（BIZ, TECH, DESIGN, FLEXIBLE）を日本語や表示名に変換
const getRoleTypeLabel = (type?: string) => {
  const roleTypes: { [key: string]: string } = {
    BIZ: "Biz",
    TECH: "Tech",
    DESIGN: "Design",
    FLEXIBLE: "こだわらない", // DBに格納される英語名から日本語に変換
  };
  return roleTypes[type as keyof typeof roleTypes] || type || "未設定";
};

// アイデア状況のラベル変換 (変更なし、既存のコードが正しい想定)
const getIdeaStatusLabel = (status?: string) => {
  const ideaStatuses: { [key: string]: string } = {
    HAS_SPECIFIC_IDEA: "具体的な開発アイデアを持っている",
    HAS_ROUGH_THEME: "おおまかなテーマや興味分野がある",
    WANTS_TO_BRAINSTORM: "アイデア出しから一緒に考えたい",
    WANTS_TO_PARTICIPATE: "他の人のアイデアに積極的に参加したい",
  };
  return ideaStatuses[status as keyof typeof ideaStatuses] || status || "未設定";
};

// コンポーネントの定義とエクスポート
export default function ProfileDetailScreen({ student, onNavigate }: ProfileDetailScreenProps) {
  console.log("★★★★ ProfileDetailScreen: コンポーネントがロード・レンダリングされました。"); // ★デバッグログ追加
  console.log("★★★★ ProfileDetailScreen: 受け取ったstudentデータ:", student); // デバッグ用

  // student データが渡されていない場合のフォールバック
  if (!student) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]">
        <p className="text-[#6C757D]">学生情報が見つかりません</p>
      </div>
    );
  }

  // 平日と土日祝の時間帯を分ける
  const weekdaySlots = student.timeslots?.filter((slot) => slot.day_type === "weekday") || [];
  const weekendSlots = student.timeslots?.filter((slot) => slot.day_type === "weekend_holiday") || [];

  // ここからJSXを返す
  return (
    <div className="min-h-screen p-4 bg-[#F8F9FA]">
      <div className="max-w-2xl mx-auto">
        {/* ヘッダー */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" size="icon" onClick={() => onNavigate("search-results")} className="border-2 border-gray-300 hover:border-[#5D70F7]">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-2xl font-semibold text-[#343A40]">プロフィール詳細</h1>
        </div>

        {/* プロフィールヘッダー */}
        <Card className="border border-gray-200 shadow-sm mb-6">
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-[#5D70F7] to-[#38C9B9] rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-semibold text-[#343A40] mb-2">{student.name}</h2>

            {/* 基本情報バッジ */}
            <div className="flex items-center justify-center gap-2 mb-4">
              <Badge variant="outline" className="text-sm">
                {getRoleTypeLabel(student.profile?.desired_role_in_team)}
              </Badge>
              {student.profile?.personality_type && (
                <Badge variant="outline" className="text-sm">
                  {student.profile.personality_type}
                </Badge>
              )}
            </div>

            {/* マッチングスコア */}
            {student.match_score !== undefined && (
              <div className="text-center">
                <div className="text-sm text-[#6C757D] mb-1">マッチングスコア</div>
                <Badge className="bg-[#FF8C42]/10 text-[#E67C32] border-[#FF8C42]/20 text-lg px-3 py-1">{student.match_score}点</Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 希望する役割 */}
        <Card className="border border-gray-200 shadow-sm mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#343A40]">
              <Briefcase className="w-5 h-5 text-[#5D70F7]" />
              希望する役割
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[#343A40] leading-relaxed">{getRoleTypeLabel(student.profile?.desired_role_in_team)}</p>
          </CardContent>
        </Card>

        {/* アイデア状況 */}
        <Card className="border border-gray-200 shadow-sm mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#343A40]">
              <Target className="w-5 h-5 text-[#38C9B9]" />
              アイデア状況
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[#343A40] leading-relaxed">{getIdeaStatusLabel(student.profile?.idea_status)}</p>
          </CardContent>
        </Card>

        {/* 興味のあるプロダクトジャンル */}
        {student.product_genres && student.product_genres.length > 0 && (
          <Card className="border border-gray-200 shadow-sm mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#343A40]">
                <Heart className="w-5 h-5 text-[#E91E63]" />
                興味のあるプロダクトジャンル
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {student.product_genres.map((genre, index) => (
                  <Badge key={index} className="bg-[#4CAF50]/10 text-[#2E7D32] border-[#4CAF50]/20">
                    {genre.name}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 活動可能時間 */}
        {(weekdaySlots.length > 0 || weekendSlots.length > 0) && (
          <Card className="border border-gray-200 shadow-sm mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#343A40]">
                <Calendar className="w-5 h-5 text-[#FF9800]" />
                活動可能時間
              </CardTitle>
            </CardHeader>
            <CardContent>
              {weekdaySlots.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-[#343A40] mb-2">平日</h4>
                  <div className="flex flex-wrap gap-2">
                    {weekdaySlots.map((slot, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {slot.description}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {weekendSlots.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-[#343A40] mb-2">土日祝</h4>
                  <div className="flex flex-wrap gap-2">
                    {weekendSlots.map((slot, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {slot.description}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* 自己紹介・こんな活動がしたい */}
        {student.profile?.self_introduction_comment && (
          <Card className="border border-gray-200 shadow-sm mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#343A40]">
                <MessageSquare className="w-5 h-5 text-[#FF8C42]" />
                自己紹介・こんな活動がしたい
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[#343A40] leading-relaxed">{student.profile.self_introduction_comment}</p>
            </CardContent>
          </Card>
        )}

        {/* マッチング理由 */}
        {student.match_reason && (
          <Card className="border border-gray-200 shadow-sm mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#343A40]">
                <Target className="w-5 h-5 text-[#9C27B0]" />
                マッチング理由
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[#343A40] leading-relaxed">{student.match_reason}</p>
            </CardContent>
          </Card>
        )}

        <div className="mt-8 text-center">
          {/* 例: 検索結果に戻るボタン */}
          <Button onClick={() => onNavigate("search-results")} className="px-6 py-3 bg-[#5D70F7] text-white rounded-lg hover:bg-[#4D60E7] transition-colors">
            検索結果に戻る
          </Button>
        </div>
      </div>
    </div>
  );
}
