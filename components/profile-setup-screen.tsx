"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Brain, Lightbulb, Package, Clock, Users, Target, MessageSquare, AlertCircle, CheckCircle } from "lucide-react";

interface ProfileSetupScreenProps {
  onNavigate: (screen: string, data?: any) => void;
}

interface MasterData {
  productGenres: Array<{ id: number; name: string }>;
  timeslots: Array<{ id: number; description: string; day_type: string; sort_order: number | null }>;
  teamPriorities: Array<{ id: number; name: string }>;
  courseSteps: Array<{ id: number; name: string; start_date: string | null; end_date: string | null }>;
}

export default function ProfileSetupScreen({ onNavigate }: ProfileSetupScreenProps) {
  const [profile, setProfile] = useState({
    personality_type: "",
    idea_status: "",
    product_genre_ids: [] as number[],
    timeslot_ids: [] as number[],
    desired_role_in_team: "",
    team_priority_ids: [] as number[],
    self_introduction_comment: "",
  });

  const [masterData, setMasterData] = useState<MasterData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState("");

  // マスターデータとプロフィール読み込み
  useEffect(() => {
    const loadData = async () => {
      try {
        // マスターデータ取得
        const masterResponse = await fetch("/api/master-data");
        if (masterResponse.ok) {
          const masterResult = await masterResponse.json();
          if (masterResult.success) {
            setMasterData(masterResult.data);
          }
        }

        // プロフィール取得（編集時）
        const profileResponse = await fetch("/api/profile?userId=current");
        if (profileResponse.ok) {
          const profileResult = await profileResponse.json();
          if (profileResult.success && profileResult.profile) {
            setProfile(profileResult.profile);
          }
        }
      } catch (error) {
        console.error("データ読み込みエラー:", error);
      }
    };

    loadData();
  }, []);

  const ideaStatuses = [
    { value: "has_specific_idea", label: "具体的な開発アイデアを持っている" },
    { value: "has_rough_theme", label: "おおまかなテーマや興味分野がある" },
    { value: "wants_to_brainstorm", label: "アイデア出しから一緒に考えたい" },
    { value: "wants_to_participate", label: "他の人のアイデアに積極的に参加したい" },
  ];

  const teamRoles = [
    { value: "", label: "こだわらない" },
    { value: "biz", label: "Biz" },
    { value: "tech", label: "Tech" },
    { value: "design", label: "Design" },
  ];

  const handleSave = async () => {
    setIsLoading(true);
    setErrors([]);
    setSuccessMessage("");

    try {
      const response = await fetch("/api/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(profile),
      });

      const data = await response.json();

      if (data.success) {
        setSuccessMessage("プロフィールが正常に保存されました");
        setTimeout(() => {
          onNavigate("search-results", profile);
        }, 1500);
      } else {
        setErrors(data.errors || [data.error || "保存に失敗しました"]);
      }
    } catch (error) {
      console.error("保存エラー:", error);
      setErrors(["ネットワークエラーが発生しました。再度お試しください。"]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleProductGenre = (genreId: number) => {
    if (profile.product_genre_ids.includes(genreId)) {
      setProfile({
        ...profile,
        product_genre_ids: profile.product_genre_ids.filter((id) => id !== genreId),
      });
    } else {
      setProfile({
        ...profile,
        product_genre_ids: [...profile.product_genre_ids, genreId],
      });
    }
  };

  const toggleTimeslot = (timeslotId: number) => {
    if (profile.timeslot_ids.includes(timeslotId)) {
      setProfile({
        ...profile,
        timeslot_ids: profile.timeslot_ids.filter((id) => id !== timeslotId),
      });
    } else {
      setProfile({
        ...profile,
        timeslot_ids: [...profile.timeslot_ids, timeslotId],
      });
    }
  };

  const toggleTeamPriority = (priorityId: number) => {
    if (profile.team_priority_ids.includes(priorityId)) {
      setProfile({
        ...profile,
        team_priority_ids: profile.team_priority_ids.filter((id) => id !== priorityId),
      });
    } else {
      setProfile({
        ...profile,
        team_priority_ids: [...profile.team_priority_ids, priorityId],
      });
    }
  };

  if (!masterData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#5D70F7] mx-auto mb-4"></div>
          <p className="text-[#6C757D]">データを読み込んでいます...</p>
        </div>
      </div>
    );
  }

  // 時間帯を平日・土日祝で分ける
  const weekdayTimeslots = masterData.timeslots.filter((t) => t.day_type === "weekday").sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  const weekendTimeslots = masterData.timeslots.filter((t) => t.day_type === "weekend_holiday").sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

  return (
    <div className="min-h-screen p-4 bg-[#F8F9FA]">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-[#343A40] mb-2">プロフィール情報登録</h1>
          <p className="text-[#6C757D]">あなたの情報を入力して、最適なチームメンバーを見つけましょう</p>
        </div>

        {/* エラー・成功メッセージ */}
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

        {successMessage && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{successMessage}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-6">
          {/* 性格タイプ */}
          <Card className="border border-gray-200 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-[#343A40] text-lg">
                <Brain className="w-5 h-5 text-[#38C9B9]" />
                あなたの性格タイプ（例: MBTI）
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Input placeholder="例: INFP, ESTJ など具体的に入力" value={profile.personality_type} onChange={(e) => setProfile({ ...profile, personality_type: e.target.value })} className="border-2 border-gray-300 focus:border-[#5D70F7]" maxLength={50} />
            </CardContent>
          </Card>

          {/* アイデア状況 */}
          <Card className="border border-gray-200 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-[#343A40] text-lg">
                <Lightbulb className="w-5 h-5 text-[#FFD700]" />
                開発アイデアの状況
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup value={profile.idea_status} onValueChange={(value) => setProfile({ ...profile, idea_status: value })} className="space-y-3">
                {ideaStatuses.map((status) => (
                  <div key={status.value} className="flex items-center space-x-2">
                    <RadioGroupItem value={status.value} id={status.value} />
                    <Label htmlFor={status.value} className="text-[#343A40] cursor-pointer">
                      {status.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>

          {/* プロダクトジャンル */}
          <Card className="border border-gray-200 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-[#343A40] text-lg">
                <Package className="w-5 h-5 text-[#4CAF50]" />
                興味のあるプロダクトジャンル（複数選択可）
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {masterData.productGenres.map((genre) => (
                  <div key={genre.id} className="flex items-center space-x-2">
                    <Checkbox id={`genre-${genre.id}`} checked={profile.product_genre_ids.includes(genre.id)} onCheckedChange={() => toggleProductGenre(genre.id)} />
                    <Label htmlFor={`genre-${genre.id}`} className="text-[#343A40] cursor-pointer text-sm">
                      {genre.name}
                    </Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 活動時間帯 */}
          <Card className="border border-gray-200 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-[#343A40] text-lg">
                <Clock className="w-5 h-5 text-[#FF8C42]" />
                活動時間帯（複数選択可）
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* 平日 */}
              <div className="space-y-3">
                <h4 className="font-medium text-[#343A40]">平日の活動時間帯</h4>
                <div className="space-y-2">
                  {weekdayTimeslots.map((timeslot) => (
                    <div key={timeslot.id} className="flex items-center space-x-2">
                      <Checkbox id={`timeslot-${timeslot.id}`} checked={profile.timeslot_ids.includes(timeslot.id)} onCheckedChange={() => toggleTimeslot(timeslot.id)} />
                      <Label htmlFor={`timeslot-${timeslot.id}`} className="text-[#343A40] cursor-pointer text-sm">
                        {timeslot.description}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* 土日祝 */}
              <div className="space-y-3">
                <h4 className="font-medium text-[#343A40]">土日祝の活動時間帯</h4>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {weekendTimeslots.map((timeslot) => (
                    <div key={timeslot.id} className="flex items-center space-x-2">
                      <Checkbox id={`timeslot-${timeslot.id}`} checked={profile.timeslot_ids.includes(timeslot.id)} onCheckedChange={() => toggleTimeslot(timeslot.id)} />
                      <Label htmlFor={`timeslot-${timeslot.id}`} className="text-[#343A40] cursor-pointer text-sm">
                        {timeslot.description}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* チームでの役割 */}
          <Card className="border border-gray-200 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-[#343A40] text-lg">
                <Users className="w-5 h-5 text-[#5D70F7]" />
                チームでの希望する役割
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup value={profile.desired_role_in_team} onValueChange={(value) => setProfile({ ...profile, desired_role_in_team: value })} className="space-y-3">
                {teamRoles.map((role) => (
                  <div key={role.value} className="flex items-start space-x-2">
                    <RadioGroupItem value={role.value} id={role.value} className="mt-1" />
                    <Label htmlFor={role.value} className="text-[#343A40] cursor-pointer text-sm leading-relaxed">
                      {role.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>

          {/* チームの進め方・雰囲気 */}
          <Card className="border border-gray-200 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-[#343A40] text-lg">
                <Target className="w-5 h-5 text-[#38C9B9]" />
                チームで重視したいこと（複数選択可）
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {masterData.teamPriorities.map((priority) => (
                  <div key={priority.id} className="flex items-center space-x-2">
                    <Checkbox id={`priority-${priority.id}`} checked={profile.team_priority_ids.includes(priority.id)} onCheckedChange={() => toggleTeamPriority(priority.id)} />
                    <Label htmlFor={`priority-${priority.id}`} className="text-[#343A40] cursor-pointer text-sm">
                      {priority.name}
                    </Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 自己紹介・コメント */}
          <Card className="border border-gray-200 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-[#343A40] text-lg">
                <MessageSquare className="w-5 h-5 text-[#FF8C42]" />
                自己紹介・コメント
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="これまでのご経験、Tech0での学習で得たこと、このプロジェクトで挑戦したいこと、その他チームメンバーに伝えたいアピールポイントや補足情報など、自由にご記入ください。(ここでの記述もキーワード検索の対象になります)"
                value={profile.self_introduction_comment}
                onChange={(e) => setProfile({ ...profile, self_introduction_comment: e.target.value })}
                className="min-h-[120px] border-2 border-gray-300 focus:border-[#5D70F7] resize-none"
                maxLength={1000}
              />
              <div className="text-right text-sm text-[#6C757D] mt-1">{profile.self_introduction_comment.length}/1000文字</div>
            </CardContent>
          </Card>

          <Button onClick={handleSave} disabled={isLoading} className="w-full h-12 bg-[#5D70F7] hover:bg-[#4D60E7] text-white font-medium text-lg disabled:opacity-50">
            {isLoading ? "保存中..." : "プロフィールを保存する"}
          </Button>
        </div>
      </div>
    </div>
  );
}
