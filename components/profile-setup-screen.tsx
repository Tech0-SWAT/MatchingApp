// components/profile-setup-screen.tsx - 正しいコンポーネント
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Save, User, Briefcase, Clock, Target, Heart, LogOut } from "lucide-react";

interface ProfileSetupScreenProps {
  onNavigate?: (screen: string) => void;
  currentUser?: any;
  isFirstLogin?: boolean;
}

const roleTypes = [
  { value: "", label: "柔軟に対応" },
  { value: "biz", label: "Biz（ビジネス）" },
  { value: "tech", label: "Tech（技術）" },
  { value: "design", label: "Design（デザイン）" },
];

const ideaStatuses = [
  { value: "", label: "特に決まっていない" },
  { value: "has_specific_idea", label: "具体的な開発アイデアを持っている" },
  { value: "has_rough_theme", label: "おおまかなテーマや興味分野がある" },
  { value: "wants_to_brainstorm", label: "アイデア出しから一緒に考えたい" },
  { value: "wants_to_participate", label: "他の人のアイデアに積極的に参加したい" },
];

const productGenres = [
  { id: 1, name: "業務効率化・SaaS" },
  { id: 2, name: "教育・学習支援" },
  { id: 3, name: "ヘルスケア・ウェルネス" },
  { id: 4, name: "エンターテイメント・ゲーム" },
  { id: 5, name: "Eコマース・マーケットプレイス" },
  { id: 6, name: "コミュニケーション・SNS" },
  { id: 7, name: "AI・機械学習を活用したプロダクト" },
  { id: 8, name: "ソーシャルグッド・地域活性化" },
  { id: 9, name: "ジャンルには特にこだわらない" },
];

const weekdayTimeslots = [
  { id: 1, name: "平日 朝5時～7時" },
  { id: 2, name: "平日 7時～9時" },
  { id: 3, name: "平日 18時～20時" },
  { id: 4, name: "平日 20時～22時" },
  { id: 5, name: "平日 22時～24時" },
  { id: 6, name: "平日 いつでも良い" },
];

const weekendTimeslots = [
  { id: 7, name: "土日祝 0時～2時" },
  { id: 8, name: "土日祝 2時～4時" },
  { id: 9, name: "土日祝 4時～6時" },
  { id: 10, name: "土日祝 6時～8時" },
  { id: 11, name: "土日祝 8時～10時" },
  { id: 12, name: "土日祝 10時～12時" },
  { id: 13, name: "土日祝 12時～14時" },
  { id: 14, name: "土日祝 14時～16時" },
  { id: 15, name: "土日祝 16時～18時" },
  { id: 16, name: "土日祝 18時～20時" },
  { id: 17, name: "土日祝 20時～22時" },
  { id: 18, name: "土日祝 22時～24時" },
  { id: 19, name: "土日祝 いつでも良い" },
];

const teamPriorities = [
  { id: 1, name: "学習・成長を重視" },
  { id: 2, name: "プロダクトの完成度を重視" },
  { id: 3, name: "チームワークを重視" },
  { id: 4, name: "新しい技術への挑戦" },
  { id: 5, name: "ビジネス視点での開発" },
];

export default function ProfileSetupScreen({ onNavigate, currentUser: initialCurrentUser, isFirstLogin = false }: ProfileSetupScreenProps) {
  const [formData, setFormData] = useState({
    desired_role_in_team: "",
    personality_type: "",
    idea_status: "",
    self_introduction_comment: "",
    product_genre_ids: [] as number[],
    weekday_timeslot_ids: [] as number[],
    weekend_timeslot_ids: [] as number[],
    team_priority_ids: [] as number[],
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // currentUser を確実に有効な値にする
  const currentUser = {
    id: initialCurrentUser?.id || 1,
    name: initialCurrentUser?.name || "デモユーザー",
    email: initialCurrentUser?.email || "demo@example.com",
    ...initialCurrentUser,
  };

  // 安全なナビゲーション関数
  const safeNavigate = (destination: string) => {
    console.log(`ナビゲーション要求: ${destination}`);

    if (onNavigate && typeof onNavigate === "function") {
      try {
        onNavigate(destination);
      } catch (error) {
        console.error("onNavigate エラー:", error);
        handleFallbackNavigation(destination);
      }
    } else {
      handleFallbackNavigation(destination);
    }
  };

  // フォールバック用のナビゲーション
  const handleFallbackNavigation = (destination: string) => {
    const messages: { [key: string]: string } = {
      "search-results": "仲間探し画面への移動がリクエストされました",
      login: "ログイン画面に移動します",
    };

    const message = messages[destination] || `${destination} への移動がリクエストされました`;

    if (destination === "login") {
      window.location.href = "/login";
    } else {
      alert(`${message}\n（実装状況に応じて適切な画面に移動してください）`);
    }
  };

  // ログアウト処理
  const handleLogout = async () => {
    if (!confirm("ログアウトしますか？未保存の変更は失われます。")) {
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
  };

  // プロフィール情報を読み込み
  useEffect(() => {
    const loadProfile = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("/api/profile");
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.user?.profile) {
            const profile = data.user.profile;
            setFormData((prev) => ({
              ...prev,
              desired_role_in_team: profile.desired_role_in_team || "",
              personality_type: profile.personality_type || "",
              idea_status: profile.idea_status || "",
              self_introduction_comment: profile.self_introduction_comment || "",
              product_genre_ids: data.user.product_genres?.map((g: any) => g.id) || [],
              weekday_timeslot_ids: data.user.timeslots?.filter((t: any) => t.day_type === "weekday")?.map((t: any) => t.id) || [],
              weekend_timeslot_ids: data.user.timeslots?.filter((t: any) => t.day_type === "weekend_holiday")?.map((t: any) => t.id) || [],
              team_priority_ids: data.user.team_priorities?.map((p: any) => p.id) || [],
            }));
          }
        }
      } catch (error) {
        console.error("プロフィール読み込みエラー:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadProfile();
  }, []);

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleArrayChange = (field: string, id: number, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: checked ? [...(prev[field as keyof typeof prev] as number[]), id] : (prev[field as keyof typeof prev] as number[]).filter((item) => item !== id),
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);

    try {
      const response = await fetch("/api/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: currentUser?.id || 1,
          ...formData,
          timeslot_ids: [...formData.weekday_timeslot_ids, ...formData.weekend_timeslot_ids],
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({ type: "success", text: "プロフィールが正常に保存されました！" });
        setTimeout(() => {
          safeNavigate("search-results");
        }, 2000);
      } else {
        setMessage({ type: "error", text: data.error || "保存に失敗しました" });
      }
    } catch (error) {
      console.error("保存エラー:", error);
      setMessage({ type: "error", text: "ネットワークエラーが発生しました" });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#5D70F7] mx-auto mb-4"></div>
          <p className="text-[#6C757D]">プロフィール情報を読み込んでいます...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 bg-[#F8F9FA]">
      <div className="max-w-4xl mx-auto">
        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            {!isFirstLogin && (
              <Button onClick={() => safeNavigate("search-results")} variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                戻る
              </Button>
            )}
            <div>
              <h1 className="text-2xl font-semibold text-[#343A40]">{isFirstLogin ? "プロフィール設定（初回登録）" : "プロフィール設定"}</h1>
              <p className="text-[#6C757D]">{isFirstLogin ? "マッチングを開始するために、まずあなたの情報を教えてください" : "あなたの情報を設定して、最適なマッチングを実現しましょう"}</p>
            </div>
          </div>

          {/* ログアウトボタン */}
          <Button onClick={handleLogout} disabled={isLoggingOut} variant="outline" className="border-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-white disabled:opacity-50">
            <LogOut className="w-4 h-4 mr-2" />
            {isLoggingOut ? "ログアウト中..." : "ログアウト"}
          </Button>
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

        {/* メッセージ */}
        {message && (
          <Alert className={`mb-6 ${message.type === "success" ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}>
            <AlertDescription className={message.type === "success" ? "text-green-800" : "text-red-800"}>{message.text}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-8">
          {/* 基本情報 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-[#5D70F7]" />
                基本情報
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="personality">性格タイプ（MBTI等）</Label>
                <Input id="personality" value={formData.personality_type} onChange={(e) => handleInputChange("personality_type", e.target.value)} placeholder="例: INTJ, ENFP など" className="mt-2" />
              </div>

              <div>
                <Label htmlFor="role">希望する役割</Label>
                <RadioGroup value={formData.desired_role_in_team} onValueChange={(value) => handleInputChange("desired_role_in_team", value)} className="mt-2">
                  {roleTypes.map((role) => (
                    <div key={role.value} className="flex items-center space-x-2">
                      <RadioGroupItem value={role.value} id={`role-${role.value}`} />
                      <Label htmlFor={`role-${role.value}`}>{role.label}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div>
                <Label htmlFor="idea-status">アイデア状況</Label>
                <RadioGroup value={formData.idea_status} onValueChange={(value) => handleInputChange("idea_status", value)} className="mt-2">
                  {ideaStatuses.map((status) => (
                    <div key={status.value} className="flex items-center space-x-2">
                      <RadioGroupItem value={status.value} id={`idea-${status.value}`} />
                      <Label htmlFor={`idea-${status.value}`}>{status.label}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            </CardContent>
          </Card>

          {/* 自己紹介 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-[#FF8C42]" />
                自己紹介
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="introduction">自己紹介・こんな活動がしたい</Label>
                <Textarea id="introduction" value={formData.self_introduction_comment} onChange={(e) => handleInputChange("self_introduction_comment", e.target.value)} placeholder="あなたの興味や、チームでどんな活動をしたいかを教えてください" className="mt-2" rows={4} />
              </div>
            </CardContent>
          </Card>

          {/* 興味分野 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-[#4CAF50]" />
                興味のあるプロダクトジャンル
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {productGenres.map((genre) => (
                  <div key={genre.id} className="flex items-center space-x-2">
                    <Checkbox id={`genre-${genre.id}`} checked={formData.product_genre_ids.includes(genre.id)} onCheckedChange={(checked) => handleArrayChange("product_genre_ids", genre.id, checked === true)} />
                    <Label htmlFor={`genre-${genre.id}`} className="text-sm">
                      {genre.name}
                    </Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 活動時間 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#38C9B9]" />
                活動可能時間
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-base font-medium">平日</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                  {weekdayTimeslots.map((slot) => (
                    <div key={slot.id} className="flex items-center space-x-2">
                      <Checkbox id={`weekday-${slot.id}`} checked={formData.weekday_timeslot_ids.includes(slot.id)} onCheckedChange={(checked) => handleArrayChange("weekday_timeslot_ids", slot.id, checked === true)} />
                      <Label htmlFor={`weekday-${slot.id}`} className="text-sm">
                        {slot.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-base font-medium">土日祝</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                  {weekendTimeslots.map((slot) => (
                    <div key={slot.id} className="flex items-center space-x-2">
                      <Checkbox id={`weekend-${slot.id}`} checked={formData.weekend_timeslot_ids.includes(slot.id)} onCheckedChange={(checked) => handleArrayChange("weekend_timeslot_ids", slot.id, checked === true)} />
                      <Label htmlFor={`weekend-${slot.id}`} className="text-sm">
                        {slot.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* チームに求めるもの */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-red-500" />
                チームに求める優先順位
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {teamPriorities.map((priority) => (
                  <div key={priority.id} className="flex items-center space-x-2">
                    <Checkbox id={`priority-${priority.id}`} checked={formData.team_priority_ids.includes(priority.id)} onCheckedChange={(checked) => handleArrayChange("team_priority_ids", priority.id, checked === true)} />
                    <Label htmlFor={`priority-${priority.id}`} className="text-sm">
                      {priority.name}
                    </Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 保存ボタン */}
          <div className="flex justify-center pb-8">
            <Button onClick={handleSave} disabled={isSaving} className="w-full max-w-md h-12 bg-[#5D70F7] hover:bg-[#4D60E7] text-white font-medium text-lg disabled:opacity-50">
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? "保存中..." : isFirstLogin ? "プロフィールを保存して仲間探しを開始" : "プロフィールを保存"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
