// components/search-results-screen.tsx - 修正版
"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Users, User, Clock, Briefcase, AlertCircle, Sparkles, CheckCircle, LogOut, X } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

// 型定義
interface CurrentUser {
  id: number;
  name: string;
  email: string;
}

interface SearchResultsScreenProps {
  onNavigate?: (screen: string, data?: any) => void;
  currentUser?: CurrentUser;
}

interface Student {
  id: number;
  name: string;
  email?: string;
  profile?: {
    desired_role_in_team?: string;
    personality_type?: string;
    self_introduction_comment?: string;
    idea_status?: string;
  };
  product_genres?: Array<{ id: number; name: string }>;
  timeslots?: Array<{ id: number; description: string; day_type: "weekday" | "weekend_holiday" }>;
  match_score?: number;
  match_reason?: string;
}

const roleTypes = [
  { value: "", label: "こだわりなし" },
  { value: "biz", label: "Biz" },
  { value: "tech", label: "Tech" },
  { value: "design", label: "Design" },
] as const;

export default function SearchResultsScreen({ onNavigate, currentUser: initialCurrentUser }: SearchResultsScreenProps) {
  const [roleType, setRoleType] = useState("");
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [matchingStatusMessage, setMatchingStatusMessage] = useState<string | null>(null);
  const [showMatchingResults, setShowMatchingResults] = useState(false);
  const [excludePastTeammates, setExcludePastTeammates] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // currentUser の検証とエラーハンドリング
  if (!initialCurrentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#F8F9FA]">
        <Card className="border border-red-200 shadow-sm p-8 text-center">
          <h3 className="text-lg font-semibold text-red-600 mb-2">認証エラー</h3>
          <p className="text-red-500 mb-4">ユーザー情報が見つかりません。</p>
          <Button onClick={() => (window.location.href = "/login")} className="bg-red-500 hover:bg-red-600 text-white">
            ログイン画面に戻る
          </Button>
        </Card>
      </div>
    );
  }

  const currentUser: CurrentUser = initialCurrentUser;

  // フォールバック用のナビゲーション（修正版）
  const handleFallbackNavigation = useCallback((destination: string, data?: any) => {
    console.log(`フォールバックナビゲーション: ${destination}`, data);

    // profile-detail の場合は直接モーダルを表示
    if (destination === "profile-detail" && data) {
      console.log("プロフィール詳細モーダルを表示:", data);
      setSelectedStudent(data);
      setShowProfileModal(true);
      return; // ここで早期リターンして、他の処理を実行しない
    }

    // ログイン画面への遷移
    if (destination === "login") {
      console.log("ログイン画面に遷移");
      window.location.href = "/login";
      return;
    }

    // その他の画面遷移（デモ用アラート）
    const messages: { [key: string]: string } = {
      "profile-setup": "プロフィール設定画面への移動がリクエストされました",
      "team-management": "チーム管理画面への移動がリクエストされました",
    };

    const message = messages[destination] || `${destination} への移動がリクエストされました`;
    alert(`${message}\n（実装状況に応じて適切な画面に移動してください）`);
  }, []);

  // 安全なナビゲーション関数
  const safeNavigate = useCallback(
    (destination: string, data?: any) => {
      console.log(`ナビゲーション要求: ${destination}`, data);

      if (onNavigate && typeof onNavigate === "function") {
        try {
          onNavigate(destination, data);
        } catch (error) {
          console.error("onNavigate エラー:", error);
          handleFallbackNavigation(destination, data);
        }
      } else {
        handleFallbackNavigation(destination, data);
      }
    },
    [onNavigate, handleFallbackNavigation]
  );

  // ログアウト処理
  const handleLogout = useCallback(async () => {
    if (!confirm("ログアウトしますか？")) {
      return;
    }

    setIsLoggingOut(true);
    console.log("ログアウト処理開始...");

    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();
      console.log("ログアウトAPI結果:", data);

      if (data.success) {
        console.log("✅ サーバー側ログアウト成功");

        try {
          localStorage.clear();
          sessionStorage.clear();
          console.log("✅ ローカルストレージクリア完了");
        } catch (storageError) {
          console.warn("ストレージクリアエラー:", storageError);
        }

        alert("ログアウトしました。ログイン画面に移動します。");
        safeNavigate("login");
      } else {
        console.error("❌ サーバー側ログアウト失敗:", data.error);
        alert(`ログアウトエラー: ${data.error}`);
      }
    } catch (error) {
      console.error("❌ ログアウトネットワークエラー:", error);

      try {
        localStorage.clear();
        sessionStorage.clear();
        console.log("⚠️ ネットワークエラーだが、ローカルストレージはクリアしました");
      } catch (storageError) {
        console.warn("ストレージクリアエラー:", storageError);
      }

      if (confirm("ネットワークエラーが発生しましたが、ローカルのデータはクリアされました。\nログイン画面に移動しますか？")) {
        safeNavigate("login");
      }
    } finally {
      setIsLoggingOut(false);
    }
  }, [safeNavigate]);

  // マッチング処理
  const handleStartMatching = useCallback(async () => {
    console.log("=== マッチング開始 ===");
    console.log("currentUser:", currentUser);

    setIsLoading(true);
    setErrors([]);
    setMatchingStatusMessage(null);
    setFilteredStudents([]);
    setShowResults(false);
    setShowMatchingResults(false);

    try {
      setMatchingStatusMessage("🔍 マッチング計算中...");

      const response = await fetch("/api/matching/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          desired_role_in_team: roleType || null,
          excludePastTeammates: excludePastTeammates,
        }),
      });

      const data = await response.json();
      console.log("マッチング結果:", data);

      if (data.success) {
        setMatchingStatusMessage("✅ マッチング計算が完了しました！");
        setFilteredStudents(data.results || []);
        setShowResults(true);
        setShowMatchingResults(true);

        setTimeout(() => setMatchingStatusMessage(null), 3000);
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
  }, [currentUser, roleType, excludePastTeammates]);

  // 学生プロフィールクリック（修正版）
  const handleStudentClick = useCallback((student: Student) => {
    console.log("学生プロフィールクリック:", student);
    // 直接モーダルを表示する
    setSelectedStudent(student);
    setShowProfileModal(true);
  }, []);

  // モーダルを閉じる
  const handleCloseModal = useCallback(() => {
    setShowProfileModal(false);
    setSelectedStudent(null);
  }, []);

  return (
    <div className="min-h-screen p-4 bg-[#F8F9FA]">
      <div className="max-w-4xl mx-auto">
        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-8">
          <div className="text-center flex-1">
            <h1 className="text-2xl font-semibold text-[#343A40] mb-2">仲間を探す (Tech0内)</h1>
            <p className="text-[#6C757D]">詳細な条件を設定して、最適な仲間を見つけましょう</p>
          </div>
          <div className="flex gap-3">
            <Button onClick={() => safeNavigate("profile-setup")} variant="outline" className="border-2 border-[#5D70F7] text-[#5D70F7] hover:bg-[#5D70F7] hover:text-white">
              <User className="w-4 h-4 mr-2" />
              プロフィール設定
            </Button>
            <Button onClick={() => safeNavigate("team-management")} variant="outline" className="border-2 border-[#4CAF50] text-[#4CAF50] hover:bg-[#4CAF50] hover:text-white">
              <Users className="w-4 h-4 mr-2" />
              チーム管理
            </Button>

            {/* ログアウトボタン */}
            <Button onClick={handleLogout} disabled={isLoggingOut} variant="outline" className="border-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-white disabled:opacity-50">
              <LogOut className="w-4 h-4 mr-2" />
              {isLoggingOut ? "ログアウト中..." : "ログアウト"}
            </Button>
          </div>
        </div>

        {/* ユーザー情報表示 */}
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#5D70F7] to-[#38C9B9] rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-semibold text-gray-800">{currentUser.name}</p>
              <p className="text-sm text-gray-600">{currentUser.email}</p>
            </div>
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
            <CheckCircle className={`h-4 w-4 ${matchingStatusMessage.startsWith("✅") ? "text-green-600" : "text-blue-600"}`} />
            <AlertDescription className={`${matchingStatusMessage.startsWith("✅") ? "text-green-800" : "text-blue-800"}`}>{matchingStatusMessage}</AlertDescription>
          </Alert>
        )}

        {/* 検索条件設定エリア */}
        <Card className="border border-gray-200 shadow-sm mb-8">
          <CardContent className="p-6">
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

              {/* チーム履歴フィルター */}
              <div className="flex items-center space-x-3">
                <Checkbox id="exclude-past-teammates" checked={excludePastTeammates} onCheckedChange={(checked) => setExcludePastTeammates(checked === true)} />
                <Label htmlFor="exclude-past-teammates" className="text-sm cursor-pointer">
                  過去にチームを組んだことのある人を除く
                </Label>
              </div>

              {/* マッチング開始ボタン */}
              <Button onClick={handleStartMatching} disabled={isLoading} className="w-full h-12 bg-[#5D70F7] hover:bg-[#4D60E7] text-white font-medium text-lg disabled:opacity-50">
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
              {showMatchingResults ? "あなたのマッチング結果" : "検索結果"} ({filteredStudents.length}件)
            </h2>

            {filteredStudents.length === 0 ? (
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
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-[#5D70F7] to-[#38C9B9] rounded-full flex items-center justify-center flex-shrink-0">
                          <User className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-[#343A40] mb-1">{student?.name || "名前不明"}</h3>
                          <div className="flex items-center gap-2 text-sm text-[#6C757D] mb-3">
                            <Badge variant="outline" className="text-xs">
                              {student?.profile?.desired_role_in_team || "役割未設定"}
                            </Badge>
                            {student?.profile?.personality_type && (
                              <Badge variant="outline" className="text-xs">
                                {student.profile.personality_type}
                              </Badge>
                            )}
                          </div>

                          {/* マッチングスコア */}
                          {showMatchingResults && student?.match_score !== undefined && (
                            <div className="mb-3">
                              <Badge className="bg-[#FF8C42]/10 text-[#E67C32] border-[#FF8C42]/20">スコア: {student.match_score}</Badge>
                              {student.match_reason && <p className="text-sm text-[#6C757D] line-clamp-2 mt-1">{student.match_reason}</p>}
                            </div>
                          )}

                          {/* 自己紹介 */}
                          {student?.profile?.self_introduction_comment && (
                            <div>
                              <div className="text-sm font-medium text-[#343A40] mb-1">自己紹介</div>
                              <p className="text-sm text-[#6C757D] line-clamp-2">{student.profile.self_introduction_comment}</p>
                            </div>
                          )}
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

      {/* プロフィール詳細モーダル */}
      {showProfileModal && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={handleCloseModal}>
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-[#343A40]">プロフィール詳細</h2>
              <button onClick={handleCloseModal} className="text-gray-500 hover:text-gray-700 transition-colors" aria-label="閉じる">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              <div className="space-y-6">
                {/* 基本情報 */}
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 bg-gradient-to-br from-[#5D70F7] to-[#38C9B9] rounded-full flex items-center justify-center">
                    <User className="w-10 h-10 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-[#343A40] mb-2">{selectedStudent?.name || "名前不明"}</h3>
                    <div className="flex gap-2 flex-wrap">
                      <Badge className="bg-[#5D70F7]/10 text-[#5D70F7] border-[#5D70F7]/20">{selectedStudent?.profile?.desired_role_in_team || "役割未設定"}</Badge>
                      {selectedStudent?.profile?.personality_type && (
                        <Badge variant="outline" className="text-xs">
                          {selectedStudent.profile.personality_type}
                        </Badge>
                      )}
                      {selectedStudent?.profile?.idea_status && <Badge className="bg-[#FF8C42]/10 text-[#FF8C42] border-[#FF8C42]/20">{selectedStudent.profile.idea_status}</Badge>}
                    </div>
                  </div>
                </div>

                {/* マッチングスコア */}
                {showMatchingResults && selectedStudent?.match_score !== undefined && (
                  <div className="bg-gradient-to-r from-orange-50 to-yellow-50 p-4 rounded-lg border border-orange-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-5 h-5 text-[#FF8C42]" />
                      <h4 className="text-lg font-semibold text-[#343A40]">マッチングスコア</h4>
                    </div>
                    <div className="flex items-center gap-3 mb-2">
                      <Badge className="bg-[#FF8C42] text-white text-lg px-3 py-1">{selectedStudent.match_score}/100</Badge>
                      <div className="flex-1 bg-gray-200 rounded-full h-3">
                        <div className="bg-gradient-to-r from-[#FF8C42] to-[#E67C32] h-3 rounded-full transition-all duration-500" style={{ width: `${selectedStudent.match_score}%` }}></div>
                      </div>
                    </div>
                    {selectedStudent.match_reason && <p className="text-sm text-[#6C757D]">{selectedStudent.match_reason}</p>}
                  </div>
                )}

                {/* 自己紹介 */}
                {selectedStudent?.profile?.self_introduction_comment && (
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <h4 className="text-lg font-semibold text-[#343A40] mb-3 flex items-center gap-2">
                      <User className="w-5 h-5 text-[#5D70F7]" />
                      自己紹介・こんな活動がしたい
                    </h4>
                    <p className="text-[#6C757D] leading-relaxed whitespace-pre-wrap">{selectedStudent.profile.self_introduction_comment}</p>
                  </div>
                )}

                {/* 興味のあるプロダクトジャンル */}
                {selectedStudent?.product_genres && selectedStudent.product_genres.length > 0 && (
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <h4 className="text-lg font-semibold text-[#343A40] mb-3 flex items-center gap-2">
                      <Briefcase className="w-5 h-5 text-[#4CAF50]" />
                      興味のあるプロダクトジャンル
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedStudent.product_genres.map((genre, index) => (
                        <Badge key={genre?.id || index} className="bg-[#4CAF50]/10 text-[#4CAF50] border-[#4CAF50]/20">
                          {genre?.name || `ジャンル${index + 1}`}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* 利用可能な時間帯 */}
                {selectedStudent?.timeslots && selectedStudent.timeslots.length > 0 && (
                  <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                    <h4 className="text-lg font-semibold text-[#343A40] mb-3 flex items-center gap-2">
                      <Clock className="w-5 h-5 text-[#9C27B0]" />
                      利用可能な時間帯
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {selectedStudent.timeslots.map((timeslot, index) => (
                        <div key={timeslot?.id || index} className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${timeslot?.day_type === "weekend_holiday" ? "bg-orange-400" : "bg-blue-400"}`}></div>
                          <span className="text-sm text-[#6C757D]">{timeslot?.description || `時間帯${index + 1}`}</span>
                          <Badge variant="outline" className="text-xs ml-auto">
                            {timeslot?.day_type === "weekend_holiday" ? "休日" : "平日"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
