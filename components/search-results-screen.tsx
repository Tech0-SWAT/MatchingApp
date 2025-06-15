"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Users, User, Clock, Briefcase, AlertCircle, Sparkles } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface SearchResultsScreenProps {
  onNavigate: (screen: string, data?: any) => void;
  currentUser: any; // ログインユーザーの情報
}

const roleTypes = [
  { value: "", label: "こだわらない" },
  { value: "biz", label: "Biz" },
  { value: "tech", label: "Tech" },
  { value: "design", label: "Design" },
];

const weekdayTimesOptions = [
  { value: "", label: "平日 特に希望なし" },
  { value: "平日 朝5時～7時", label: "平日 朝5時～7時" },
  { value: "平日 7時～9時", label: "平日 7時～9時" },
  { value: "平日 18時～20時", label: "平日 18時～20時" },
  { value: "平日 20時～22時", label: "平日 20時～22時" },
  { value: "平日 22時～24時", label: "平日 22時～24時" },
  { value: "平日 いつでも良い", label: "平日 いつでも良い" },
];

const weekendTimesOptions = [
  { value: "", label: "土日祝 特に希望なし" },
  { value: "土日祝 0時～2時", label: "土日祝 0時～2時" },
  { value: "土日祝 2時～4時", label: "土日祝 2時～4時" },
  { value: "土日祝 4時～6時", label: "土日祝 4時～6時" },
  { value: "土日祝 6時～8時", label: "土日祝 6時～8時" },
  { value: "土日祝 8時～10時", label: "土日祝 8時～10時" },
  { value: "土日祝 10時～12時", label: "土日祝 10時～12時" },
  { value: "土日祝 12時～14時", label: "土日祝 12時～14時" },
  { value: "土日祝 14時～16時", label: "土日祝 14時～16時" },
  { value: "土日祝 16時～18時", label: "土日祝 16時～18時" },
  { value: "土日祝 18時～20時", label: "土日祝 18時～20時" },
  { value: "土日祝 20時～22時", label: "土日祝 20時～22時" },
  { value: "土日祝 22時～24時", label: "土日祝 22時～24時" },
  { value: "土日祝 いつでも良い", label: "土日祝 いつでも良い" },
];

const ideaStatuses = [
  { value: "", label: "こだわらない" },
  { value: "concrete", label: "具体的な開発アイデアを持っている" },
  { value: "rough", label: "おおまかなテーマや興味分野がある" },
  { value: "brainstorm", label: "アイデア出しから一緒に考えたい" },
  { value: "participate", label: "他の人のアイデアに積極的に参加したい" },
];

const productGenres = [
  { value: "saas", label: "業務効率化・SaaS" },
  { value: "education", label: "教育・学習支援" },
  { value: "healthcare", label: "ヘルスケア・ウェルネス" },
  { value: "entertainment", label: "エンターテイメント・ゲーム" },
  { value: "ecommerce", label: "Eコマース・マーケットプレイス" },
  { value: "communication", label: "コミュニケーション・SNS" },
  { value: "ai", label: "AI・機械学習を活用したプロダクト" },
  { value: "social", label: "ソーシャルグッド・地域活性化" },
  { value: "any", label: "ジャンルには特にこだわらない" },
];

export default function SearchResultsScreen({ onNavigate, currentUser: initialCurrentUser }: SearchResultsScreenProps) {
  const [roleType, setRoleType] = useState("");
  const [filteredStudents, setFilteredStudents] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [matchingStatusMessage, setMatchingStatusMessage] = useState<string | null>(null);
  const [showMatchingResults, setShowMatchingResults] = useState(false);

  // currentUser の初期化を確実にする - idが無い場合はフォールバック値を設定
  const currentUser = {
    id: initialCurrentUser?.id || 1, // idが無い場合は1をデフォルトに
    name: initialCurrentUser?.name || "田中 太郎",
    email: initialCurrentUser?.email || "tanaka@example.com",
    ...initialCurrentUser, // 他のプロパティも保持
  };

  console.log("CurrentUser in SearchResultsScreen:", currentUser);

  const handleStartMatching = async () => {
    setIsLoading(true);
    setErrors([]);
    setMatchingStatusMessage(null);
    setFilteredStudents([]);
    setShowResults(false);

    try {
      if (!currentUser || !currentUser.id) {
        setErrors(["マッチングを開始するにはログインユーザーが必要です。"]);
        setIsLoading(false);
        return;
      }

      setMatchingStatusMessage("マッチング計算中...");

      const response = await fetch("/api/matching/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: currentUser.id,
          desired_role_in_team: roleType || null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMatchingStatusMessage("✅ マッチング計算が終了しました！結果を表示します。");
        await fetchAndDisplayMatchResults();
        setShowMatchingResults(true);
      } else {
        setErrors([data.error || "マッチング計算に失敗しました。"]);
        setMatchingStatusMessage(null);
      }
    } catch (error) {
      console.error("マッチング計算エラー:", error);
      setErrors(["ネットワークエラーが発生しました。再度お試しください。"]);
      setMatchingStatusMessage(null);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAndDisplayMatchResults = async () => {
    setIsLoading(true);
    setErrors([]);
    try {
      if (!currentUser || !currentUser.id) {
        setErrors(["マッチング結果を表示するにはログインユーザーが必要です。"]);
        setIsLoading(false);
        return;
      }

      const response = await fetch("/api/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fetchMatchesOnly: true,
          currentUserId: currentUser.id,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setFilteredStudents(Array.isArray(data.results) ? data.results : []);
        setShowResults(true);
      } else {
        setErrors(data.errors || [data.error || "マッチング結果の取得に失敗しました"]);
        setFilteredStudents([]);
      }
    } catch (error) {
      console.error("マッチング結果取得エラー:", error);
      setErrors(["ネットワークエラーが発生しました。再度お試しください。"]);
      setFilteredStudents([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStudentClick = (student: any) => {
    onNavigate("profile-detail", student);
  };

  const getRoleTypeLabel = (type: string) => {
    const role = roleTypes.find((r) => r.value === type);
    return role ? role.label : type;
  };

  const getIdeaStatusLabel = (status: string) => {
    const idea = ideaStatuses.find((i) => i.value === status);
    return idea ? idea.label : status;
  };

  // Fixed function to handle both string arrays and object arrays
  const getGenreLabels = (genres: any[]) => {
    if (!Array.isArray(genres)) return [];
    return genres.map((genre) => {
      // Handle object with id/name properties
      if (typeof genre === "object" && genre !== null) {
        if (genre.name) return genre.name;
        if (genre.label) return genre.label;
        // If it has a value property, try to find the label from productGenres
        if (genre.value) {
          const found = productGenres.find((g) => g.value === genre.value);
          return found ? found.label : genre.value;
        }
        // If it has an id, try to find by id (if productGenres had ids)
        return genre.id || String(genre);
      }
      // Handle string values
      if (typeof genre === "string") {
        const found = productGenres.find((g) => g.value === genre);
        return found ? found.label : genre;
      }
      // Fallback
      return String(genre);
    });
  };

  return (
    <div className="min-h-screen p-4 bg-[#F8F9FA]">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="text-center flex-1">
            <h1 className="text-2xl font-semibold text-[#343A40] mb-2">仲間を探す (Tech0内)</h1>
            <p className="text-[#6C757D]">詳細な条件を設定して、最適な仲間を見つけましょう</p>
          </div>
          <div className="flex gap-3">
            <Button onClick={() => onNavigate("profile-setup")} variant="outline" className="border-2 border-[#5D70F7] text-[#5D70F7] hover:bg-[#5D70F7] hover:text-white">
              <User className="w-4 h-4 mr-2" />
              プロフィール設定
            </Button>
            <Button onClick={() => onNavigate("team-management")} variant="outline" className="border-2 border-[#4CAF50] text-[#4CAF50] hover:bg-[#4CAF50] hover:text-white">
              <Users className="w-4 h-4 mr-2" />
              チーム管理
            </Button>
          </div>
        </div>

        {/* エラーメッセージ */}
        {errors.length > 0 && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <ul className="list-disc list-inside">
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* マッチングステータスメッセージ */}
        {matchingStatusMessage && (
          <Alert className={`mb-6 ${matchingStatusMessage.startsWith("✅") ? "border-green-200 bg-green-50" : "border-blue-200 bg-blue-50"}`}>
            <AlertCircle className={`h-4 w-4 ${matchingStatusMessage.startsWith("✅") ? "text-green-600" : "text-blue-600"}`} />
            <AlertDescription className={`${matchingStatusMessage.startsWith("✅") ? "text-green-800" : "text-blue-800"}`}>{matchingStatusMessage}</AlertDescription>
          </Alert>
        )}

        {/* 検索条件設定エリア */}
        <Card className="border border-gray-200 shadow-sm mb-8">
          <CardContent className="p-6">
            <div className="space-y-6">
              {/* 基本条件 */}
              <div className="space-y-6">
                {/* 求める役割タイプ */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-[#343A40] flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-[#FF8C42]" />
                    求める役割タイプ
                  </label>
                  <RadioGroup value={roleType} onValueChange={setRoleType} className="space-y-2">
                    {roleTypes.map((role) => (
                      <div key={role.value} className="flex items-center space-x-2">
                        <RadioGroupItem value={role.value} id={`role-${role.value}`} />
                        <Label htmlFor={`role-${role.value}`} className="text-sm cursor-pointer">
                          {role.label}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              </div>

              {/* マッチング開始ボタン */}
              <Button onClick={handleStartMatching} disabled={isLoading || !currentUser || !currentUser.id} className="w-full h-12 bg-[#5D70F7] hover:bg-[#4D60E7] text-white font-medium text-lg disabled:opacity-50">
                <Sparkles className="w-4 h-4 mr-2" />
                {isLoading ? "マッチング計算中..." : "マッチングを開始する"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 検索結果表示エリア */}
        {showResults && (
          <div>
            <h2 className="text-xl font-semibold text-[#343A40] mb-6">
              {showMatchingResults ? "あなたのマッチング結果" : "検索結果"} ({Array.isArray(filteredStudents) ? filteredStudents.length : 0}件)
            </h2>

            {!Array.isArray(filteredStudents) || filteredStudents.length === 0 ? (
              <Card className="border border-gray-200 shadow-sm p-8 text-center">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-lg font-semibold text-[#343A40] mb-2">条件に合うユーザーは見つかりませんでした。</h3>
                <p className="text-[#6C757D]">検索条件を変えてみてください。</p>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredStudents.map((student, index) => (
                  <Card key={student?.id || index} className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer w-full" onClick={() => handleStudentClick(student)}>
                    <CardContent className="p-6">
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="w-12 h-12 bg-gradient-to-br from-[#5D70F7] to-[#38C9B9] rounded-full flex items-center justify-center">
                                <User className="w-6 h-6 text-white" />
                              </div>
                              <div>
                                <h3 className="text-lg font-semibold text-[#343A40]">{student?.name || "名前不明"}</h3>
                                <div className="flex items-center gap-2 text-sm text-[#6C757D]">
                                  <Badge variant="outline" className="text-xs">
                                    {getRoleTypeLabel(student?.profile?.desired_role_in_team || "")}
                                  </Badge>
                                  {student?.profile?.personality_type && (
                                    <Badge variant="outline" className="text-xs">
                                      {student.profile.personality_type}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* マッチしたキーワード (マッチング結果のみに表示) */}
                            {showMatchingResults && Array.isArray(student?.match_keywords) && student.match_keywords.length > 0 && (
                              <div className="mb-3">
                                <div className="text-sm font-medium text-[#343A40] mb-1">マッチしたキーワード</div>
                                <div className="flex flex-wrap gap-1">
                                  {student.match_keywords.map((keyword: string, keywordIndex: number) => (
                                    <Badge key={keywordIndex} className="bg-[#5D70F7]/10 text-[#5D70F7] border-[#5D70F7]/20">
                                      {keyword}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* マッチングスコアと理由 (マッチング結果のみに表示) */}
                            {showMatchingResults && student?.match_score !== undefined && (
                              <div className="mb-3">
                                <div className="text-sm font-medium text-[#343A40] mb-1">マッチングスコア</div>
                                <Badge className="bg-[#FF8C42]/10 text-[#E67C32] border-[#FF8C42]/20">スコア: {student.match_score.toFixed(2)}</Badge>
                                {student.match_reason && <p className="text-sm text-[#6C757D] line-clamp-2 mt-1">{student.match_reason}</p>}
                              </div>
                            )}

                            {/* アイデア状況とプロダクトジャンル */}
                            <div className="mb-3">
                              <div className="text-sm font-medium text-[#343A40] mb-1">アイデア状況・興味ジャンル</div>
                              <div className="flex flex-wrap gap-1">
                                {student?.profile?.idea_status && <Badge className="bg-[#FFD700]/10 text-[#B8860B] border-[#FFD700]/20">{getIdeaStatusLabel(student.profile.idea_status)}</Badge>}
                                {Array.isArray(student?.product_genres) &&
                                  getGenreLabels(student.product_genres.slice(0, 2)).map((genre, genreIndex) => (
                                    <Badge key={genreIndex} className="bg-[#4CAF50]/10 text-[#2E7D32] border-[#4CAF50]/20">
                                      {genre}
                                    </Badge>
                                  ))}
                                {Array.isArray(student?.product_genres) && student.product_genres.length > 2 && <Badge className="bg-gray-100 text-gray-600">+{student.product_genres.length - 2}</Badge>}
                              </div>
                            </div>

                            {/* 活動時間 */}
                            <div className="mb-3">
                              <div className="text-sm font-medium text-[#343A40] mb-1">活動時間</div>
                              <div className="flex items-center gap-2 text-sm text-[#6C757D]">
                                <Clock className="w-3 h-3" />
                                <div className="flex flex-wrap gap-1">
                                  {Array.isArray(student?.timeslots) &&
                                    student.timeslots
                                      .filter((time: any) => time.day_type === "weekday")
                                      .slice(0, 2)
                                      .map((time: any, timeIndex: number) => (
                                        <Badge key={timeIndex} variant="outline" className="text-xs">
                                          {time.description}
                                        </Badge>
                                      ))}
                                  {Array.isArray(student?.timeslots) && student.timeslots.filter((time: any) => time.day_type === "weekday").length > 2 && (
                                    <Badge variant="outline" className="text-xs">
                                      +{student.timeslots.filter((time: any) => time.day_type === "weekday").length - 2}
                                    </Badge>
                                  )}
                                  <span>•</span>
                                  {Array.isArray(student?.timeslots) &&
                                    student.timeslots
                                      .filter((time: any) => time.day_type === "weekend_holiday")
                                      .slice(0, 2)
                                      .map((time: any, timeIndex: number) => (
                                        <Badge key={timeIndex} variant="outline" className="text-xs">
                                          {time.description}
                                        </Badge>
                                      ))}
                                  {Array.isArray(student?.timeslots) && student.timeslots.filter((time: any) => time.day_type === "weekend_holiday").length > 2 && (
                                    <Badge variant="outline" className="text-xs">
                                      +{student.timeslots.filter((time: any) => time.day_type === "weekend_holiday").length - 2}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* こんな活動がしたい */}
                            {student?.profile?.self_introduction_comment && (
                              <div className="mb-3">
                                <div className="text-sm font-medium text-[#343A40] mb-1">自己紹介・こんな活動がしたい</div>
                                <p className="text-sm text-[#6C757D] line-clamp-2">{student.profile.self_introduction_comment}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
