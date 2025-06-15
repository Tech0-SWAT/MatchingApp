"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Users, Plus, Calendar, User, ArrowLeft, CheckCircle, AlertCircle, X, ChevronsUpDown, Trash2 } from "lucide-react";

interface TeamManagementScreenProps {
  onNavigate: (screen: string) => void;
}

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
  course_step_name: string;
  members: TeamMember[];
}

interface CourseStep {
  id: number;
  name: string;
  start_date: string | null;
  end_date: string | null;
}

interface UserOption {
  id: number;
  name: string;
  email: string;
  role?: string | null;
}

interface SelectedTeamMember {
  user_id: number;
  user_name: string;
  user_email: string;
  role_in_team: string | null;
}

const createTeamRoleOptions = [
  { value: "unspecified", label: "役割を選択" },
  { value: "biz", label: "Biz" },
  { value: "tech", label: "Tech" },
  { value: "design", label: "Design" },
];

export default function TeamManagementScreen({ onNavigate }: TeamManagementScreenProps) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [courseSteps, setCourseSteps] = useState<CourseStep[]>([]);
  const [selectedCourseStep, setSelectedCourseStep] = useState<number | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newTeam, setNewTeam] = useState({
    name: "",
    project_name: "",
    course_step_id: null as number | null,
    creator_role: "unspecified",
  });
  const [selectedMembers, setSelectedMembers] = useState<SelectedTeamMember[]>([]);
  const [userOptions, setUserOptions] = useState<UserOption[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    loadData();
  }, [selectedCourseStep]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const excludeIds = Array.isArray(selectedMembers)
          ? selectedMembers
              .map((member) => member?.user_id)
              .filter((id) => id !== undefined)
              .join(",")
          : "";

        const response = await fetch(`/api/users?query=${encodeURIComponent(searchQuery)}&excludeIds=${excludeIds}`);

        if (response.ok) {
          const data = await response.json();
          if (data && data.success && data.users && Array.isArray(data.users)) {
            setUserOptions(
              data.users.map((user: any) => ({
                id: user?.id || 0,
                name: user?.name || "Unknown",
                email: user?.email || "",
                role: user?.profile?.desired_role_in_team || null,
              }))
            );
          } else {
            console.error("ユーザー検索APIエラー: 'users'データが不正です", data);
            setUserOptions([]);
          }
        } else {
          console.error("ユーザー検索APIエラー:", response.status, response.statusText);
          setUserOptions([]);
        }
      } catch (error) {
        console.error("ユーザー検索エラー:", error);
        setUserOptions([]);
      }
    };

    if (isUserDropdownOpen) {
      fetchUsers();
    }
  }, [searchQuery, isUserDropdownOpen, selectedMembers]);

  const loadData = async () => {
    try {
      const masterResponse = await fetch("/api/master-data");
      if (masterResponse.ok) {
        const masterResult = await masterResponse.json();
        if (masterResult.success && masterResult.data && masterResult.data.courseSteps) {
          setCourseSteps(masterResult.data.courseSteps);
        } else {
          console.error("マスターデータ取得エラー: 'courseSteps'データが不正です", masterResult.error);
          setCourseSteps([]);
        }
      } else {
        console.error("マスターデータAPIエラー:", masterResponse.status, masterResponse.statusText);
        setCourseSteps([]);
      }

      const params = new URLSearchParams();
      params.append("userId", "1");
      if (selectedCourseStep) {
        params.append("courseStepId", selectedCourseStep.toString());
      }

      const teamsResponse = await fetch(`/api/teams?${params}`);
      if (teamsResponse.ok) {
        const teamsResult = await teamsResponse.json();

        console.log("🌐 Teams API Response:", {
          success: teamsResult.success,
          teamsCount: teamsResult.teams?.length || 0,
          fullResponse: teamsResult,
        });

        if (teamsResult.success && Array.isArray(teamsResult.teams)) {
          teamsResult.teams.forEach((team: any, index: number) => {
            console.log(`👥 Team ${index + 1}: ${team.name}`);
            if (team.members && Array.isArray(team.members)) {
              team.members.forEach((member: any, mIndex: number) => {
                console.log(`  👤 Member ${mIndex + 1}:`, {
                  name: member.user_name,
                  email: member.user_email,
                  role_in_team: member.role_in_team,
                  role_type: typeof member.role_in_team,
                  role_json: JSON.stringify(member.role_in_team),
                });
              });
            }
          });

          setTeams(teamsResult.teams);
        } else {
          console.error("❌ Teams data invalid:", teamsResult);
          setTeams([]);
        }
      } else {
        console.error("❌ Teams API error:", teamsResponse.status);
        setTeams([]);
      }
    } catch (error) {
      console.error("データ読み込みエラー:", error);
      setCourseSteps([]);
      setTeams([]);
    }
  };

  const deleteTeam = async (teamId: number, teamName: string) => {
    if (!confirm(`「${teamName}」を削除しますか？\n\nこの操作は取り消せません。`)) {
      return;
    }

    setIsLoading(true);
    setErrors([]);
    setSuccessMessage("");

    try {
      const response = await fetch(`/api/teams?teamId=${teamId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        console.log("チーム削除成功");
        setSuccessMessage(`「${teamName}」が削除されました`);
        await loadData();
      } else {
        console.error("削除エラー:", data.error);
        setErrors([`削除に失敗しました: ${data.error}`]);
      }
    } catch (error) {
      console.error("削除リクエストエラー:", error);
      setErrors(["削除中にエラーが発生しました"]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTeam = async () => {
    console.log("🚀 チーム作成ボタンがクリックされました！");
    console.log("🔄 Loading状態を設定中...");

    setIsLoading(true);
    setErrors([]);
    setSuccessMessage("");

    try {
      console.log("=== VALIDATION DEBUG START ===");
      console.log("newTeam:", newTeam);
      console.log("selectedMembers:", selectedMembers);
      console.log("newTeam.name.trim():", `"${newTeam.name.trim()}"`);
      console.log("newTeam.course_step_id:", newTeam.course_step_id);
      console.log("selectedMembers.length:", selectedMembers.length);
      console.log("newTeam.creator_role:", `"${newTeam.creator_role}"`);

      const validationErrors: string[] = [];

      // チーム名チェック
      if (!newTeam.name.trim()) {
        console.log("❌ チーム名が空です");
        validationErrors.push("チーム名を入力してください。");
      } else {
        console.log("✅ チーム名OK:", `"${newTeam.name.trim()}"`);
      }

      // ステップチェック
      if (newTeam.course_step_id === null) {
        console.log("❌ ステップが選択されていません");
        validationErrors.push("ステップを選択してください。");
      } else {
        console.log("✅ ステップOK:", newTeam.course_step_id);
      }

      // メンバーチェック
      if (selectedMembers.length === 0) {
        console.log("❌ メンバーが選択されていません");
        validationErrors.push("メンバーを1人以上選択してください。");
      } else {
        console.log("✅ メンバーOK:", selectedMembers.length, "人");
      }

      // 作成者役割チェック
      if (newTeam.creator_role === "unspecified") {
        console.log("❌ 作成者の役割が選択されていません");
        validationErrors.push("あなたの役割を選択してください。");
      } else {
        console.log("✅ 作成者役割OK:", `"${newTeam.creator_role}"`);
      }

      // 各メンバーの役割チェック
      selectedMembers.forEach((member, index) => {
        console.log(`Member ${index + 1} (${member.user_name}):`, {
          role_in_team: member.role_in_team,
          is_unspecified: member.role_in_team === "unspecified",
          is_empty: !member.role_in_team,
        });

        if (!member.role_in_team || member.role_in_team === "unspecified") {
          console.log(`❌ ${member.user_name} の役割が選択されていません`);
          validationErrors.push(`${member.user_name} のチーム内での役割を選択してください。`);
        } else {
          console.log(`✅ ${member.user_name} の役割OK:`, `"${member.role_in_team}"`);
        }
      });

      console.log("=== VALIDATION ERRORS ===");
      console.log("validationErrors:", validationErrors);
      console.log("validationErrors.length:", validationErrors.length);

      if (validationErrors.length > 0) {
        console.log("❌ バリデーションエラーあり、処理を停止");
        setErrors(validationErrors);
        setIsLoading(false);
        return;
      }

      console.log("✅ バリデーション通過、チーム作成処理を開始");

      console.log("=== TEAM CREATION DEBUG ===");
      console.log("newTeam:", newTeam);
      console.log("selectedMembers:", selectedMembers);

      const memberDataToSend = selectedMembers.map((member) => ({
        user_id: member.user_id,
        role_in_team: member.role_in_team === "unspecified" ? null : member.role_in_team,
      }));

      const requestBody = {
        course_step_id: newTeam.course_step_id as number,
        name: newTeam.name.trim(),
        project_name: newTeam.project_name?.trim() || null,
        member_data: memberDataToSend,
        creator_role: newTeam.creator_role === "unspecified" ? null : newTeam.creator_role,
      };

      console.log("📤 API REQUEST:");
      console.log("URL: POST /api/teams");
      console.log("Body:", JSON.stringify(requestBody, null, 2));

      const response = await fetch("/api/teams", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      console.log("📥 API RESPONSE:");
      console.log("Status:", response.status, response.statusText);
      console.log("Headers:", Object.fromEntries(response.headers.entries()));

      const data = await response.json();
      console.log("Response Data:", JSON.stringify(data, null, 2));
      console.log("Error Message:", data.error);
      console.log("Error Details:", data.details);

      if (data.success) {
        setSuccessMessage("チームが正常に作成されました");
        setIsCreateDialogOpen(false);
        setNewTeam({
          name: "",
          project_name: "",
          course_step_id: null,
          creator_role: "unspecified",
        });
        setSelectedMembers([]);
        loadData();
      } else {
        setErrors([data.error || "チーム作成に失敗しました"]);
      }
    } catch (error) {
      console.error("チーム作成エラー:", error);
      setErrors(["ネットワークエラーが発生しました"]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectMember = (userOption: UserOption) => {
    if (!userOption || !userOption.id) return;

    if (!selectedMembers.some((member) => member.user_id === userOption.id)) {
      setSelectedMembers((prev) => {
        const currentMembers = Array.isArray(prev) ? prev : [];
        // ユーザーのプロフィール役割が有効な場合はそれを使用、そうでなければ "unspecified"
        const validRoles = ["biz", "tech", "design"];
        const initialRole = validRoles.includes(userOption.role || "") ? userOption.role : "unspecified";

        return [
          ...currentMembers,
          {
            user_id: userOption.id,
            user_name: userOption.name,
            user_email: userOption.email,
            role_in_team: initialRole,
          },
        ];
      });
    }
    setIsUserDropdownOpen(false);
    setSearchQuery("");
  };

  const handleMemberRoleChange = (userId: number, role: string) => {
    setSelectedMembers((prev) => prev.map((member) => (member.user_id === userId ? { ...member, role_in_team: role } : member)));
  };

  const handleRemoveMember = (userId: number) => {
    if (!userId) return;

    setSelectedMembers((prev) => {
      const currentMembers = Array.isArray(prev) ? prev : [];
      return currentMembers.filter((member) => member && member.user_id !== userId);
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // 表示用のgetRoleLabel関数（ログを削除）
  const getRoleLabel = (role: string | null) => {
    if (role === null || role === undefined || role === "" || role === "unspecified") {
      return "未指定";
    }

    const normalized = String(role).trim().toLowerCase();
    const roleMap: Record<string, string> = {
      tech: "Tech",
      biz: "Biz",
      design: "Design",
      "tech lead": "Tech",
      developer: "Tech",
      designer: "Design",
      pm: "Biz",
      テック: "Tech",
      ビズ: "Biz",
      デザイン: "Design",
      エンジニア: "Tech",
      プログラマー: "Tech",
      ビジネス: "Biz",
      プロジェクトマネージャー: "Biz",
      "ui/ux": "Design",
      デザイナー: "Design",
    };

    return roleMap[normalized] || "未指定";
  };

  const teamsByStep = courseSteps
    .map((step) => {
      return {
        step,
        teams: teams.filter((team) => team.course_step_id === step.id),
      };
    })
    .filter(({ teams }) => teams.length > 0);

  return (
    <div className="min-h-screen p-4 bg-[#F8F9FA]">
      <div className="max-w-6xl mx-auto">
        {/* ヘッダー */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" size="icon" onClick={() => onNavigate("search-results")} className="border-2 border-gray-300 hover:border-[#5D70F7]">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-semibold text-[#343A40]">チーム管理</h1>
            <p className="text-[#6C757D]">各ステップでのチーム情報を管理</p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#4CAF50] hover:bg-[#45A049] text-white">
                <Plus className="w-4 h-4 mr-2" />
                新しいチーム作成
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>新しいチーム作成</DialogTitle>
                <DialogDescription>チームの詳細情報を入力し、メンバーと役割を設定してください。</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-[#343A40]">ステップ選択</label>
                  <Select value={newTeam.course_step_id?.toString() || ""} onValueChange={(value) => setNewTeam({ ...newTeam, course_step_id: Number.parseInt(value) })}>
                    <SelectTrigger>
                      <SelectValue placeholder="ステップを選択" />
                    </SelectTrigger>
                    <SelectContent>
                      {courseSteps.length === 0 ? (
                        <SelectItem value="" disabled>
                          ステップが見つかりません
                        </SelectItem>
                      ) : (
                        courseSteps.map((course) => (
                          <SelectItem key={course.id} value={course.id.toString()}>
                            {course.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-[#343A40]">チーム名</label>
                  <Input placeholder="例: Team Alpha" value={newTeam.name} onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })} />
                </div>

                <div>
                  <label className="text-sm font-medium text-[#343A40]">プロジェクト名（任意）</label>
                  <Input placeholder="例: 学習管理システム" value={newTeam.project_name} onChange={(e) => setNewTeam({ ...newTeam, project_name: e.target.value })} />
                </div>

                <div>
                  <label className="text-sm font-medium text-[#343A40]">あなたの役割</label>
                  <Select value={newTeam.creator_role} onValueChange={(value) => setNewTeam({ ...newTeam, creator_role: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="役割を選択" />
                    </SelectTrigger>
                    <SelectContent>
                      {createTeamRoleOptions
                        .filter((opt) => opt.value !== "unspecified")
                        .map((role) => (
                          <SelectItem key={role.value} value={role.value}>
                            {role.label}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-[#343A40]">メンバー選択と役割設定</label>

                  {/* 選択済みメンバーと役割表示 */}
                  {Array.isArray(selectedMembers) && selectedMembers.length > 0 && (
                    <div className="space-y-3 mb-4 p-4 bg-gray-50 rounded-lg">
                      <h4 className="text-sm font-medium">選択済みメンバー ({selectedMembers.length}人)</h4>
                      {selectedMembers
                        .filter((member) => member && member.user_id)
                        .map((member) => (
                          <div key={member.user_id} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-gradient-to-br from-[#5D70F7] to-[#38C9B9] rounded-full flex items-center justify-center">
                                <User className="w-4 h-4 text-white" />
                              </div>
                              <div>
                                <div className="font-medium text-[#343A40]">{member.user_name}</div>
                                <div className="text-xs text-[#6C757D]">{member.user_email}</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Select value={member.role_in_team || "unspecified"} onValueChange={(value) => handleMemberRoleChange(member.user_id, value)}>
                                <SelectTrigger className="w-32">
                                  <SelectValue placeholder="役割選択" />
                                </SelectTrigger>
                                <SelectContent>
                                  {createTeamRoleOptions.map((role) => (
                                    <SelectItem key={role.value} value={role.value}>
                                      {role.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Button variant="outline" size="sm" onClick={() => handleRemoveMember(member.user_id)} className="px-2 py-1 h-8">
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}

                  {/* メンバー検索・選択 */}
                  <Popover open={isUserDropdownOpen} onOpenChange={setIsUserDropdownOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" role="combobox" aria-expanded={isUserDropdownOpen} className="w-full justify-between">
                        <span className="truncate">メンバーを追加</span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput placeholder="名前またはメールで検索..." value={searchQuery} onValueChange={setSearchQuery} className="h-9" />
                        <CommandList>
                          <CommandEmpty>該当するユーザーがいません</CommandEmpty>
                          <CommandGroup>
                            <ScrollArea className="h-60">
                              {userOptions.map((user) => (
                                <CommandItem key={user.id} value={user.id.toString()} onSelect={() => handleSelectMember(user)} className="flex items-center justify-between">
                                  <div className="flex flex-col">
                                    <span>{user.name}</span>
                                    <span className="text-xs text-gray-500">{user.email}</span>
                                  </div>
                                  {user.role && (
                                    <Badge variant="outline" className="ml-2">
                                      {getRoleLabel(user.role)}
                                    </Badge>
                                  )}
                                </CommandItem>
                              ))}
                            </ScrollArea>
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                {errors.length > 0 && (
                  <Alert className="border-red-200 bg-red-50">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800">
                      {errors.map((error, index) => (
                        <div key={index}>{error}</div>
                      ))}
                    </AlertDescription>
                  </Alert>
                )}

                <Button onClick={handleCreateTeam} disabled={isLoading} className="w-full bg-[#4CAF50] hover:bg-[#45A049]">
                  {isLoading ? "作成中..." : "チーム作成"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* 成功メッセージ */}
        {successMessage && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{successMessage}</AlertDescription>
          </Alert>
        )}

        {/* ステップフィルター */}
        <Card className="border border-gray-200 shadow-sm mb-6">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-[#343A40]">ステップで絞り込み:</label>
              <Select value={selectedCourseStep?.toString() || "all"} onValueChange={(value) => setSelectedCourseStep(value === "all" ? null : Number.parseInt(value))}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="ステップを選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべて表示</SelectItem>
                  {courseSteps.map((course) => (
                    <SelectItem key={course.id} value={course.id.toString()}>
                      {course.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* ステップごとのチーム一覧 */}
        {selectedCourseStep !== null ? (
          // 特定のステップが選択されている場合
          <div className="space-y-6">
            {teams.length === 0 ? (
              <Card className="border border-gray-200 shadow-sm p-8 text-center">
                <div className="text-6xl mb-4">👥</div>
                <h3 className="text-lg font-semibold text-[#343A40] mb-2">このステップのチームがありません</h3>
                <p className="text-[#6C757D]">新しいチームを作成してみましょう。</p>
              </Card>
            ) : (
              teams.map((team) => (
                <Card key={team.id} className="border border-gray-200 shadow-sm">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2 text-[#343A40]">
                          <Users className="w-5 h-5 text-[#5D70F7]" />
                          {team.name}
                        </CardTitle>
                        <div className="flex items-center gap-4 mt-2">
                          {team.project_name && <Badge className="bg-[#4CAF50]/10 text-[#2E7D32] border-[#4CAF50]/20 text-xs">{team.project_name}</Badge>}
                          <div className="flex items-center gap-1 text-xs text-[#6C757D]">
                            <Calendar className="w-3 h-3" />
                            {formatDate(team.created_at)}
                          </div>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => deleteTeam(team.id, team.name)} disabled={isLoading} className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300">
                        <Trash2 className="w-4 h-4 mr-1" />
                        削除
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <h3 className="text-sm font-medium text-[#343A40]">メンバー ({team.members.length}人)</h3>
                      {team.members.map((member) => (
                        <div key={member.user_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-gradient-to-br from-[#5D70F7] to-[#38C9B9] rounded-full flex items-center justify-center">
                              <User className="w-4 h-4 text-white" />
                            </div>
                            <div>
                              <div className="font-medium text-[#343A40]">{member.user_name}</div>
                              <div className="text-sm text-[#6C757D]">{member.user_email}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {getRoleLabel(member.role_in_team)}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        ) : (
          // すべてのステップを表示する場合
          <div className="space-y-10">
            {teamsByStep.length === 0 ? (
              <Card className="border border-gray-200 shadow-sm p-8 text-center">
                <div className="text-6xl mb-4">👥</div>
                <h3 className="text-lg font-semibold text-[#343A40] mb-2">まだチームがありません</h3>
                <p className="text-[#6C757D]">新しいチームを作成してみましょう。</p>
              </Card>
            ) : (
              teamsByStep.map(({ step, teams }) => (
                <div key={step.id}>
                  <h2 className="text-xl font-semibold text-[#343A40] mb-4 flex items-center">
                    <Badge className="mr-2 bg-[#5D70F7] text-white">{step.name}</Badge>
                  </h2>

                  <div className="space-y-4">
                    {teams.map((team) => (
                      <Card key={team.id} className="border border-gray-200 shadow-sm">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="flex items-center gap-2 text-[#343A40]">
                                <Users className="w-5 h-5 text-[#5D70F7]" />
                                {team.name}
                              </CardTitle>
                              <div className="flex items-center gap-4 mt-2">
                                {team.project_name && <Badge className="bg-[#4CAF50]/10 text-[#2E7D32] border-[#4CAF50]/20 text-xs">{team.project_name}</Badge>}
                                <div className="flex items-center gap-1 text-xs text-[#6C757D]">
                                  <Calendar className="w-3 h-3" />
                                  {formatDate(team.created_at)}
                                </div>
                              </div>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => deleteTeam(team.id, team.name)} disabled={isLoading} className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300">
                              <Trash2 className="w-4 h-4 mr-1" />
                              削除
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <h3 className="text-sm font-medium text-[#343A40]">メンバー ({team.members.length}人)</h3>
                            {team.members.map((member) => (
                              <div key={member.user_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 bg-gradient-to-br from-[#5D70F7] to-[#38C9B9] rounded-full flex items-center justify-center">
                                    <User className="w-4 h-4 text-white" />
                                  </div>
                                  <div>
                                    <div className="font-medium text-[#343A40]">{member.user_name}</div>
                                    <div className="text-sm text-[#6C757D]">{member.user_email}</div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-xs">
                                    {getRoleLabel(member.role_in_team)}
                                  </Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
