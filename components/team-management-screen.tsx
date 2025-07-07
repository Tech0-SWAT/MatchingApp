// components/team-management-screen.tsx - 既存API対応版
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Users, User, Calendar, Target, UserPlus, Trash2, Briefcase, BookOpen, X, Eye, UserCheck, RefreshCw } from "lucide-react";

interface TeamManagementScreenProps {
  onNavigate: (screen: string) => void;
  currentUser: {
    id: number;
    name: string;
    email: string;
  };
}

// 既存APIに合わせた型定義
interface TeamMember {
  user_id: number;
  user_name: string;
  user_email: string;
  role_in_team: string | null;
  joined_at: string;
}

interface Team {
  id: number;
  course_step_id: number;
  name: string;
  project_name: string | null;
  created_at: string;
  updated_at: string;
  course_step_name: string;
  members: TeamMember[];
  isUserMember?: boolean; // フロントエンド用フラグ
}

interface CourseStep {
  id: number;
  name: string;
}

interface User {
  id: number;
  name: string;
  user_profiles?: {
    desired_role_in_team?: string;
    personality_type?: string;
    self_introduction_comment?: string;
  };
}

export default function TeamManagementScreen({ onNavigate, currentUser }: TeamManagementScreenProps) {
  // 必須プロパティの検証
  if (!currentUser || !onNavigate) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]">
        <Card className="border border-red-200 shadow-sm p-8 text-center">
          <h3 className="text-lg font-semibold text-red-600 mb-2">エラー</h3>
          <p className="text-red-500 mb-4">{!currentUser ? "ユーザー情報が見つかりません。" : "ナビゲーション機能が利用できません。"}</p>
          <Button onClick={() => (window.location.href = "/login")} className="bg-red-500 hover:bg-red-600 text-white">
            ログイン画面に戻る
          </Button>
        </Card>
      </div>
    );
  }

  console.log("🎯 TeamManagementScreen レンダリング:", { currentUser, onNavigate: typeof onNavigate });

  // State定義
  const [teams, setTeams] = useState<Team[]>([]);
  const [showCreateTeamModal, setShowCreateTeamModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "my-teams">("all");
  const [courseSteps, setCourseSteps] = useState<CourseStep[]>([]);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [teamCreationData, setTeamCreationData] = useState({
    name: "",
    project_name: "",
    course_step_id: 1,
    creator_role: "tech" as string,
    member_data: [] as Array<{ user_id: number; role_in_team: string }>,
  });

  // チーム作成モーダル関連
  const handleOpenCreateTeamModal = () => {
    setShowCreateTeamModal(true);
  };

  const handleCloseCreateTeamModal = () => {
    setShowCreateTeamModal(false);
    setTeamCreationData({
      name: "",
      project_name: "",
      course_step_id: courseSteps.length > 0 ? courseSteps[0].id : 1,
      creator_role: "tech",
      member_data: [],
    });
  };

  // 既存APIに合わせたチーム作成
  const handleCreateTeam = async () => {
    if (!teamCreationData.name.trim()) {
      alert("チーム名を入力してください");
      return;
    }

    setIsCreating(true);
    try {
      console.log("🚀 チーム作成リクエスト:", teamCreationData);

      const response = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          course_step_id: teamCreationData.course_step_id,
          name: teamCreationData.name,
          project_name: teamCreationData.project_name || null,
          member_data: teamCreationData.member_data,
          creator_role: teamCreationData.creator_role,
        }),
      });

      const data = await response.json();
      console.log("📡 チーム作成レスポンス:", data);

      if (data.success) {
        setMessage({ type: "success", text: `チーム「${teamCreationData.name}」が正常に作成されました` });
        handleCloseCreateTeamModal();
        fetchTeams();
      } else {
        setMessage({ type: "error", text: `チーム作成エラー: ${data.error}` });
      }
    } catch (error) {
      console.error("❌ チーム作成エラー:", error);
      setMessage({ type: "error", text: "チーム作成中にネットワークエラーが発生しました" });
    } finally {
      setIsCreating(false);
    }
  };

  // チーム削除
  const handleDeleteTeam = async (teamId: number, teamName: string) => {
    if (!confirm(`チーム「${teamName}」を削除しますか？この操作は取り消せません。`)) {
      return;
    }

    try {
      console.log("🗑️ チーム削除リクエスト:", teamId);

      const response = await fetch(`/api/teams?teamId=${teamId}`, {
        method: "DELETE",
      });

      const data = await response.json();
      console.log("📡 チーム削除レスポンス:", data);

      if (data.success) {
        setMessage({ type: "success", text: `チーム「${teamName}」を削除しました` });
        fetchTeams();
      } else {
        setMessage({ type: "error", text: `チーム削除エラー: ${data.error}` });
      }
    } catch (error) {
      console.error("❌ チーム削除エラー:", error);
      setMessage({ type: "error", text: "チーム削除中にネットワークエラーが発生しました" });
    }
  };

  // メンバー関連
  const handleMemberClick = (member: TeamMember) => {
    setSelectedMember(member);
    setShowMemberModal(true);
  };

  const handleCloseMemberModal = () => {
    setShowMemberModal(false);
    setSelectedMember(null);
  };

  // メンバー選択関連
  const handleAddMember = (userId: number) => {
    const user = availableUsers.find((u) => u.id === userId);
    if (user && !teamCreationData.member_data.some((m) => m.user_id === userId)) {
      // ユーザーの希望役割をデフォルトに設定
      const defaultRole = user.user_profiles?.desired_role_in_team || "tech";

      setTeamCreationData({
        ...teamCreationData,
        member_data: [
          ...teamCreationData.member_data,
          {
            user_id: userId,
            role_in_team: defaultRole,
          },
        ],
      });
    }
  };

  const handleRemoveMember = (userId: number) => {
    setTeamCreationData({
      ...teamCreationData,
      member_data: teamCreationData.member_data.filter((m) => m.user_id !== userId),
    });
  };

  const handleMemberRoleChange = (userId: number, role: string) => {
    setTeamCreationData({
      ...teamCreationData,
      member_data: teamCreationData.member_data.map((m) => (m.user_id === userId ? { ...m, role_in_team: role } : m)),
    });
  };

  // 既存APIを使用したチーム取得
  const fetchTeams = async () => {
    try {
      console.log("📡 チーム取得開始:", { filter, currentUserId: currentUser.id });

      let url = "/api/teams";

      if (filter === "my-teams") {
        url += "?userId=current"; // 既存APIの仕様に合わせる
      }

      const response = await fetch(url);
      const data = await response.json();

      console.log("📡 チーム取得レスポンス:", data);

      if (data.success && Array.isArray(data.teams)) {
        // 各チームにユーザー参加フラグを追加
        const teamsWithUserFlag: Team[] = data.teams.map((team: Team) => ({
          ...team,
          isUserMember: team.members.some((member) => member.user_id === currentUser.id),
        }));

        setTeams(teamsWithUserFlag);

        const userTeamsCount = teamsWithUserFlag.filter((team) => team.isUserMember).length;
        const totalTeamsCount = teamsWithUserFlag.length;

        if (totalTeamsCount === 0) {
          setMessage({
            type: "info",
            text: filter === "my-teams" ? "まだどのチームにも参加していません。新しいチームを作成するか、既存チームに参加しましょう！" : "まだチームが作成されていません。最初のチームを作成しましょう！",
          });
        } else {
          setMessage({
            type: "success",
            text: filter === "my-teams" ? `参加中のチーム: ${totalTeamsCount}件` : `全 ${totalTeamsCount} チーム取得。あなたは ${userTeamsCount} チームに参加中です。`,
          });
        }
      } else {
        throw new Error(data.error || "APIからデータを取得できませんでした");
      }
    } catch (error) {
      console.error("❌ チーム取得エラー:", error);
      setTeams([]);
      setMessage({
        type: "error",
        text: `チーム情報の取得に失敗しました: ${error instanceof Error ? error.message : "不明なエラー"}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // コースステップ取得
  const fetchCourseSteps = async () => {
    try {
      console.log("📡 コースステップ取得開始");

      const response = await fetch("/api/course-steps");
      const data = await response.json();

      console.log("📡 コースステップレスポンス:", data);

      if (data.success && Array.isArray(data.course_steps)) {
        setCourseSteps(data.course_steps);
        // 最初のステップをデフォルトに設定
        if (data.course_steps.length > 0) {
          setTeamCreationData((prev) => ({
            ...prev,
            course_step_id: data.course_steps[0].id,
          }));
        }
      } else {
        console.warn("⚠️ コースステップ取得失敗:", data);
        // フォールバック
        setCourseSteps([
          { id: 1, name: "Step 1" },
          { id: 2, name: "Step 2" },
          { id: 3, name: "Step 3" },
          { id: 4, name: "Step 4" },
        ]);
      }
    } catch (error) {
      console.error("❌ コースステップ取得エラー:", error);
      // フォールバック
      setCourseSteps([
        { id: 1, name: "Step 1" },
        { id: 2, name: "Step 2" },
        { id: 3, name: "Step 3" },
        { id: 4, name: "Step 4" },
      ]);
    }
  };

  // ユーザー一覧取得
  const fetchUsers = async () => {
    try {
      console.log("📡 ユーザー取得開始");

      const response = await fetch("/api/users");
      console.log("📡 ユーザーAPIレスポンス status:", response.status);

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log("📡 ユーザーレスポンス data:", data);

      if (data.success && Array.isArray(data.users)) {
        // 現在のユーザーを除外し、プロフィール情報も含める（APIの実際の構造に合わせる）
        const filteredUsers = data.users
          .filter((user: any) => user.id !== currentUser.id)
          .map((user: any) => ({
            id: user.id,
            name: user.name,
            // APIのprofileを期待するuser_profilesに変換
            user_profiles: user.profile
              ? {
                  desired_role_in_team: user.profile.desired_role_in_team,
                  personality_type: user.profile.personality_type,
                  self_introduction_comment: null,
                }
              : null,
          }));
        setAvailableUsers(filteredUsers);
        console.log("✅ 利用可能ユーザー:", filteredUsers.length + "人", filteredUsers);
      } else {
        throw new Error("Invalid API response format");
      }
    } catch (error) {
      console.error("❌ ユーザー取得エラー:", error);

      // 500エラーの場合は一時的なモックデータを使用
      console.log("🔧 モックデータを使用します");
      const mockUsers = [
        {
          id: 2,
          name: "田中太郎",
          user_profiles: {
            desired_role_in_team: "tech",
            personality_type: "INTJ",
            self_introduction_comment: "フロントエンド開発が得意です",
          },
        },
        {
          id: 3,
          name: "佐藤花子",
          user_profiles: {
            desired_role_in_team: "design",
            personality_type: "ENFP",
            self_introduction_comment: "UI/UXデザインを専門にしています",
          },
        },
        {
          id: 4,
          name: "鈴木一郎",
          user_profiles: {
            desired_role_in_team: "biz",
            personality_type: "ESTJ",
            self_introduction_comment: "ビジネス戦略とマーケティングを担当",
          },
        },
        {
          id: 5,
          name: "山田二郎",
          user_profiles: {
            desired_role_in_team: "flexible",
            personality_type: "ISFP",
            self_introduction_comment: "何でもやります",
          },
        },
        {
          id: 6,
          name: "高橋三郎",
          user_profiles: null,
        },
      ];

      setAvailableUsers(mockUsers);
      setMessage({
        type: "error",
        text: "ユーザーAPI接続エラーのため、モックデータを表示中です",
      });
    }
  };

  // ユーティリティ関数
  const getDesiredRoleLabel = (role: string | undefined) => {
    if (!role) return "未設定";
    const roleMap: { [key: string]: string } = {
      tech: "Tech",
      biz: "Biz",
      design: "Design",
      flexible: "こだわらない",
    };
    return roleMap[role] || role;
  };

  const getDesiredRoleColor = (role: string | undefined) => {
    if (!role) return "bg-gray-100 text-gray-600";
    const colorMap: { [key: string]: string } = {
      tech: "bg-blue-100 text-blue-700",
      biz: "bg-green-100 text-green-700",
      design: "bg-purple-100 text-purple-700",
      flexible: "bg-orange-100 text-orange-700",
    };
    return colorMap[role] || "bg-gray-100 text-gray-600";
  };
  const getStatusLabel = (team: Team) => {
    // チーム作成から時間が経っているか、メンバーが多いかで判定
    const daysSinceCreation = Math.floor((Date.now() - new Date(team.created_at).getTime()) / (1000 * 60 * 60 * 24));

    if (daysSinceCreation > 30 && team.members.length >= 3) {
      return { label: "進行中", color: "bg-green-100 text-green-800" };
    } else if (team.members.length >= 2) {
      return { label: "開始準備", color: "bg-blue-100 text-blue-800" };
    } else {
      return { label: "メンバー募集", color: "bg-yellow-100 text-yellow-800" };
    }
  };

  const getRoleLabel = (role: string | null) => {
    if (!role) return "未設定";
    const roleMap: { [key: string]: string } = {
      tech: "Tech",
      biz: "Biz",
      design: "Design",
      flexible: "こだわらない",
    };
    return roleMap[role] || role;
  };

  // ナビゲーション関数
  const safeNavigate = (destination: string) => {
    console.log(`🧭 ナビゲーション要求: ${destination}`);
    try {
      onNavigate(destination);
    } catch (error) {
      console.error("❌ ナビゲーションエラー:", error);
      alert("画面遷移でエラーが発生しました。ページを再読み込みしてください。");
    }
  };

  // フィルタリング
  const filteredTeams = teams.filter((team) => {
    if (filter === "my-teams") {
      return team.isUserMember;
    }
    return true; // 'all'の場合
  });

  // 初期化
  useEffect(() => {
    console.log("🔄 useEffect 実行:", { userId: currentUser.id });
    fetchCourseSteps();
    fetchUsers();
  }, [currentUser.id]);

  // フィルター変更時にチーム再取得
  useEffect(() => {
    fetchTeams();
  }, [filter]);

  // メッセージの自動消去
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 7000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // ローディング表示
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#5D70F7] mx-auto mb-4"></div>
          <p className="text-[#6C757D]">チーム情報を読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 bg-[#F8F9FA]">
      <div className="max-w-6xl mx-auto">
        {/* ヘッダー */}
        <div className="flex items-center gap-4 mb-8">
          <Button onClick={() => safeNavigate("search-results")} variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            戻る
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-semibold text-[#343A40]">チーム管理</h1>
            <p className="text-[#6C757D]">チーム情報を確認・管理できます</p>
          </div>
          <div className="flex gap-3">
            <Button onClick={fetchTeams} variant="outline" disabled={isLoading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              更新
            </Button>
            <Button onClick={handleOpenCreateTeamModal} className="bg-[#4CAF50] hover:bg-[#45A049] text-white">
              <UserPlus className="w-4 h-4 mr-2" />
              新しいチーム作成
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

        {/* フィルター */}
        <div className="mb-6 flex gap-3">
          <Button onClick={() => setFilter("all")} variant={filter === "all" ? "default" : "outline"} className={filter === "all" ? "bg-[#5D70F7] text-white" : ""}>
            <Eye className="w-4 h-4 mr-2" />
            全チーム ({teams.length})
          </Button>
          <Button onClick={() => setFilter("my-teams")} variant={filter === "my-teams" ? "default" : "outline"} className={filter === "my-teams" ? "bg-[#4CAF50] text-white" : ""}>
            <UserCheck className="w-4 h-4 mr-2" />
            参加中のチーム ({teams.filter((t) => t.isUserMember).length})
          </Button>
        </div>

        {/* メッセージ */}
        {message && (
          <Alert className={`mb-6 ${message.type === "success" ? "border-green-200 bg-green-50" : message.type === "info" ? "border-blue-200 bg-blue-50" : "border-orange-200 bg-orange-50"}`}>
            <AlertDescription className={message.type === "success" ? "text-green-800" : message.type === "info" ? "text-blue-800" : "text-orange-800"}>{message.text}</AlertDescription>
          </Alert>
        )}

        {/* チーム一覧 */}
        <div className="space-y-6">
          {filteredTeams.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">{filter === "my-teams" ? "参加中のチームはありません" : "チームがありません"}</h3>
                <p className="text-gray-500 mb-6">{filter === "my-teams" ? "まだどのチームにも参加していません。新しいチームを作成しましょう" : "まだチームが作成されていません。最初のチームを作成しましょう"}</p>
                <div className="flex gap-3 justify-center">
                  {filter === "my-teams" && (
                    <Button onClick={() => setFilter("all")} variant="outline" className="border-[#5D70F7] text-[#5D70F7] hover:bg-[#5D70F7] hover:text-white">
                      全チームを見る
                    </Button>
                  )}
                  <Button onClick={() => safeNavigate("search-results")} className="bg-[#5D70F7] hover:bg-[#4D60E7] text-white">
                    仲間を探す
                  </Button>
                  <Button onClick={handleOpenCreateTeamModal} variant="outline" className="border-[#4CAF50] text-[#4CAF50] hover:bg-[#4CAF50] hover:text-white">
                    チーム作成
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            filteredTeams.map((team) => {
              const status = getStatusLabel(team);
              return (
                <Card key={team.id} className={`border shadow-sm ${team.isUserMember ? "border-green-300 bg-green-50/30" : "border-gray-200"}`}>
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <CardTitle className="text-xl text-[#343A40]">{team.name}</CardTitle>
                          {team.isUserMember && <Badge className="bg-green-100 text-green-800">参加中</Badge>}
                          <Badge className={status.color}>{status.label}</Badge>
                          <Badge variant="outline" className="text-xs">
                            <BookOpen className="w-3 h-3 mr-1" />
                            {team.course_step_name}
                          </Badge>
                        </div>
                        <p className="text-[#6C757D] mb-3">{team.project_name || team.name}</p>
                        <div className="flex items-center gap-4 text-sm text-[#6C757D]">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            開始日: {new Date(team.created_at).toLocaleDateString("ja-JP")}
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {team.members.length}名
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {team.isUserMember && (
                          <Button onClick={() => handleDeleteTeam(team.id, team.name)} variant="outline" size="sm" className="text-red-600 border-red-300 hover:bg-red-50">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-6">
                    {/* メンバー一覧 */}
                    <div>
                      <h4 className="text-md font-semibold text-[#343A40] mb-3 flex items-center gap-2">
                        <Users className="w-4 h-4 text-[#4CAF50]" />
                        チームメンバー
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {team.members.map((member) => (
                          <div key={member.user_id} className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${member.user_id === currentUser.id ? "bg-blue-100 border border-blue-200" : "bg-gray-50 hover:bg-gray-100"}`} onClick={() => handleMemberClick(member)}>
                            <div className="w-10 h-10 bg-gradient-to-br from-[#5D70F7] to-[#38C9B9] rounded-full flex items-center justify-center">
                              <User className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-medium text-[#343A40] truncate">
                                  {member.user_name}
                                  {member.user_id === currentUser.id && <span className="text-xs text-blue-600 ml-1">(あなた)</span>}
                                </p>
                                <Badge variant="outline" className="text-xs">
                                  {getRoleLabel(member.role_in_team)}
                                </Badge>
                              </div>
                              <p className="text-xs text-[#6C757D]">参加日: {new Date(member.joined_at).toLocaleDateString("ja-JP")}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* プロジェクト情報 */}
                    <div>
                      <h4 className="text-md font-semibold text-[#343A40] mb-3 flex items-center gap-2">
                        <Target className="w-4 h-4 text-[#FF8C42]" />
                        プロジェクト: {team.project_name || team.name}
                      </h4>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-[#6C757D] mb-3">{team.project_name ? `${team.project_name}のプロジェクト` : `${team.name}のプロジェクト`}</p>
                        <div className="text-xs text-gray-500">
                          作成日: {new Date(team.created_at).toLocaleDateString("ja-JP")} | 最終更新: {new Date(team.updated_at).toLocaleDateString("ja-JP")}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* チーム作成モーダル */}
        {showCreateTeamModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-[#343A40]">新しいチーム作成</h2>
                <button onClick={handleCloseCreateTeamModal} className="text-gray-500 hover:text-gray-700">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="team-name">チーム名 *</Label>
                    <Input id="team-name" value={teamCreationData.name} onChange={(e) => setTeamCreationData({ ...teamCreationData, name: e.target.value })} placeholder="例：革新的なWebアプリ開発チーム" />
                  </div>

                  <div>
                    <Label htmlFor="project-name">プロジェクト名</Label>
                    <Input id="project-name" value={teamCreationData.project_name} onChange={(e) => setTeamCreationData({ ...teamCreationData, project_name: e.target.value })} placeholder="例：タスク管理アプリ（未入力の場合チーム名が使用されます）" />
                  </div>

                  <div>
                    <Label htmlFor="course-step">コースステップ</Label>
                    <Select value={teamCreationData.course_step_id.toString()} onValueChange={(value) => setTeamCreationData({ ...teamCreationData, course_step_id: parseInt(value) })}>
                      <SelectTrigger>
                        <SelectValue placeholder="ステップを選択" />
                      </SelectTrigger>
                      <SelectContent>
                        {courseSteps.map((step) => (
                          <SelectItem key={step.id} value={step.id.toString()}>
                            {step.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="creator-role">あなたの役割</Label>
                    <Select value={teamCreationData.creator_role} onValueChange={(value) => setTeamCreationData({ ...teamCreationData, creator_role: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="役割を選択" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tech">Tech</SelectItem>
                        <SelectItem value="biz">Biz</SelectItem>
                        <SelectItem value="design">Design</SelectItem>
                        <SelectItem value="flexible">こだわらない</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* メンバー選択セクション */}
                  <div>
                    <Label>チームメンバーを選択（任意）</Label>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-sm text-gray-600">メンバーを追加</Label>
                        <Select onValueChange={(value) => handleAddMember(parseInt(value))}>
                          <SelectTrigger>
                            <SelectValue placeholder="メンバーを選択して追加" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableUsers
                              .filter((user) => !teamCreationData.member_data.some((m) => m.user_id === user.id))
                              .map((user) => (
                                <SelectItem key={user.id} value={user.id.toString()}>
                                  {user.name} ({user.email})
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {teamCreationData.member_data.length > 0 && (
                        <div>
                          <Label className="text-sm text-gray-600">選択中のメンバー</Label>
                          <div className="space-y-2">
                            {teamCreationData.member_data.map((member) => {
                              const user = availableUsers.find((u) => u.id === member.user_id);
                              return (
                                <div key={member.user_id} className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border">
                                  <div className="w-10 h-10 bg-gradient-to-br from-[#5D70F7] to-[#38C9B9] rounded-full flex items-center justify-center">
                                    <User className="w-5 h-5 text-white" />
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <p className="font-medium text-[#343A40]">{user?.name}</p>
                                      {user?.user_profiles?.desired_role_in_team && <Badge className={`text-xs ${getDesiredRoleColor(user.user_profiles.desired_role_in_team)}`}>{getDesiredRoleLabel(user.user_profiles.desired_role_in_team)}</Badge>}
                                    </div>
                                    <p className="text-xs text-[#6C757D]">ユーザーID: {user?.id}</p>
                                    {user?.user_profiles?.self_introduction_comment && (
                                      <p className="text-xs text-[#6C757D] mt-1 line-clamp-2">
                                        {user.user_profiles.self_introduction_comment.slice(0, 60)}
                                        {user.user_profiles.self_introduction_comment.length > 60 ? "..." : ""}
                                      </p>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <div>
                                      <Label className="text-xs text-gray-500">チーム内役割</Label>
                                      <Select value={member.role_in_team} onValueChange={(value) => handleMemberRoleChange(member.user_id, value)}>
                                        <SelectTrigger className="w-36 h-8">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="tech">Tech</SelectItem>
                                          <SelectItem value="biz">Biz</SelectItem>
                                          <SelectItem value="design">Design</SelectItem>
                                          <SelectItem value="flexible">こだわらない</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <Button onClick={() => handleRemoveMember(member.user_id)} variant="outline" size="sm" className="text-red-600 border-red-300 hover:bg-red-50 h-8 w-8 p-0">
                                      <X className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button onClick={handleCloseCreateTeamModal} variant="outline">
                    キャンセル
                  </Button>
                  <Button onClick={handleCreateTeam} disabled={isCreating || !teamCreationData.name.trim()} className="bg-[#4CAF50] hover:bg-[#45A049] text-white">
                    {isCreating ? "作成中..." : "チーム作成"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* メンバー詳細モーダル */}
        {showMemberModal && selectedMember && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-[#343A40]">メンバー詳細</h2>
                <button onClick={handleCloseMemberModal} className="text-gray-500 hover:text-gray-700">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-[#5D70F7] to-[#38C9B9] rounded-full flex items-center justify-center">
                    <User className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-[#343A40]">
                      {selectedMember.user_name}
                      {selectedMember.user_id === currentUser.id && <span className="text-sm text-blue-600 ml-2">(あなた)</span>}
                    </h3>
                    <p className="text-[#6C757D]">ユーザーID: {selectedMember.user_id}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="text-sm">
                        チーム役割: {getRoleLabel(selectedMember.role_in_team)}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="text-md font-semibold text-[#343A40] mb-2 flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-[#FF8C42]" />
                      役割情報
                    </h4>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-[#6C757D]">
                        <strong>チーム内役割:</strong> {getRoleLabel(selectedMember.role_in_team)}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-md font-semibold text-[#343A40] mb-2 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-[#38C9B9]" />
                      参加情報
                    </h4>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-[#6C757D] mb-2">
                        <strong>チーム参加日:</strong> {new Date(selectedMember.joined_at).toLocaleDateString("ja-JP")}
                      </p>
                      <p className="text-[#6C757D]">
                        <strong>参加からの日数:</strong> {Math.floor((Date.now() - new Date(selectedMember.joined_at).getTime()) / (1000 * 60 * 60 * 24))}日
                      </p>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-md font-semibold text-[#343A40] mb-2 flex items-center gap-2">
                      <User className="w-4 h-4 text-[#4CAF50]" />
                      基本情報
                    </h4>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-[#6C757D] mb-2">
                        <strong>ユーザー名:</strong> {selectedMember.user_name}
                      </p>
                      <p className="text-[#6C757D]">
                        <strong>ユーザーID:</strong> {selectedMember.user_id}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
