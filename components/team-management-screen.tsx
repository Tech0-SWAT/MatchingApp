"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Users, Plus, Calendar, User, ArrowLeft, CheckCircle, AlertCircle, X, ChevronsUpDown } from "lucide-react"

interface TeamManagementScreenProps {
  onNavigate: (screen: string) => void
}

// TeamMemberの型定義を修正
interface TeamMember {
  user_id: number
  user_name: string
  user_email: string
  role_in_team: string | null
  joined_at: string
}

interface Team {
  id: number
  course_step_id: number
  name: string
  project_name: string | null
  created_at: string
  course_step_name: string
  members: TeamMember[]
}

interface CourseStep {
  id: number
  name: string
  start_date: string | null
  end_date: string | null
}

interface UserOption {
  id: number
  name: string
  email: string
  role?: string | null
}

export default function TeamManagementScreen({ onNavigate }: TeamManagementScreenProps) {
  const [teams, setTeams] = useState<Team[]>([])
  const [courseSteps, setCourseSteps] = useState<CourseStep[]>([])
  const [selectedCourseStep, setSelectedCourseStep] = useState<number | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newTeam, setNewTeam] = useState({
    name: "",
    project_name: "",
    course_step_id: 0,
    creator_role: "",
  })
  const [selectedMembers, setSelectedMembers] = useState<UserOption[]>([])
  const [userOptions, setUserOptions] = useState<UserOption[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const [successMessage, setSuccessMessage] = useState("")

  // データ読み込み
  useEffect(() => {
    loadData()
  }, [selectedCourseStep])

  // ユーザー検索
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        // 既に選択されているユーザーIDを除外
        const excludeIds = selectedMembers.map((member) => member.id).join(",")
        const response = await fetch(`/api/users?query=${searchQuery}&excludeIds=${excludeIds}`)
        if (response.ok) {
          const data = await response.json()
          if (data.success) {
            setUserOptions(
              data.users.map((user: any) => ({
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.profile?.desired_role_in_team || null,
              })),
            )
          }
        }
      } catch (error) {
        console.error("ユーザー検索エラー:", error)
      }
    }

    if (isUserDropdownOpen) {
      fetchUsers()
    }
  }, [searchQuery, isUserDropdownOpen, selectedMembers])

  // loadDataメソッドのエラーハンドリングを強化
  const loadData = async () => {
    try {
      // コース情報取得
      const masterResponse = await fetch("/api/master-data")
      if (masterResponse.ok) {
        const masterResult = await masterResponse.json()
        if (masterResult.success) {
          setCourseSteps(masterResult.data.courseSteps)
        } else {
          console.error("マスターデータ取得エラー:", masterResult.error)
        }
      } else {
        console.error("マスターデータAPIエラー:", masterResponse.statusText)
      }

      // チーム情報取得 - 現在のユーザーが参加しているチームのみ
      const params = new URLSearchParams()
      params.append("userId", "current") // 現在のユーザーのチームのみ取得
      if (selectedCourseStep) {
        params.append("courseStepId", selectedCourseStep.toString())
      }

      const teamsResponse = await fetch(`/api/teams?${params}`)
      if (teamsResponse.ok) {
        const teamsResult = await teamsResponse.json()
        if (teamsResult.success) {
          setTeams(teamsResult.teams)
        } else {
          console.error("チーム取得エラー:", teamsResult.error)
        }
      } else {
        console.error("チームAPIエラー:", teamsResponse.statusText)
      }
    } catch (error) {
      console.error("データ読み込みエラー:", error)
    }
  }

  const handleCreateTeam = async () => {
    setIsLoading(true)
    setErrors([])
    setSuccessMessage("")

    try {
      if (!newTeam.name || !newTeam.course_step_id || selectedMembers.length === 0) {
        setErrors(["チーム名、コース、メンバーは必須です"])
        setIsLoading(false)
        return
      }

      const memberIds = selectedMembers.map((member) => member.id)

      const response = await fetch("/api/teams", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          course_step_id: newTeam.course_step_id,
          name: newTeam.name,
          project_name: newTeam.project_name || null,
          member_ids: memberIds,
          creator_role: newTeam.creator_role || null,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setSuccessMessage("チームが正常に作成されました")
        setIsCreateDialogOpen(false)
        setNewTeam({
          name: "",
          project_name: "",
          course_step_id: 0,
          creator_role: "",
        })
        setSelectedMembers([])
        loadData()
      } else {
        setErrors([data.error || "チーム作成に失敗しました"])
      }
    } catch (error) {
      console.error("チーム作成エラー:", error)
      setErrors(["ネットワークエラーが発生しました"])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectMember = (user: UserOption) => {
    setSelectedMembers([...selectedMembers, user])
    setIsUserDropdownOpen(false)
    setSearchQuery("")
  }

  const handleRemoveMember = (userId: number) => {
    setSelectedMembers(selectedMembers.filter((member) => member.id !== userId))
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const getRoleLabel = (role: string | null) => {
    if (!role) return null

    const roleMap: Record<string, string> = {
      tech_lead: "Tech Lead",
      developer_main: "Developer",
      biz_planning: "Biz/企画",
      design_ux: "Design/UX",
      pm_management: "PM",
      support_member: "サポート",
      no_preference: "未指定",
    }

    return roleMap[role] || role
  }

  // teamsByStepの計算を修正
  const teamsByStep = courseSteps
    .map((step) => {
      return {
        step,
        teams: teams.filter((team) => team.course_step_id === step.id),
      }
    })
    .filter(({ teams }) => teams.length > 0) // 空のステップを除外

  return (
    <div className="min-h-screen p-4 bg-[#F8F9FA]">
      <div className="max-w-6xl mx-auto">
        {/* ヘッダー */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            size="icon"
            onClick={() => onNavigate("search-results")}
            className="border-2 border-gray-300 hover:border-[#5D70F7]"
          >
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
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>新しいチーム作成</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-[#343A40]">ステップ選択</label>
                  <Select
                    value={newTeam.course_step_id.toString()}
                    onValueChange={(value) => setNewTeam({ ...newTeam, course_step_id: Number.parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="ステップを選択" />
                    </SelectTrigger>
                    <SelectContent>
                      {courseSteps.map((course) => (
                        <SelectItem key={course.id} value={course.id.toString()}>
                          {course.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-[#343A40]">チーム名</label>
                  <Input
                    placeholder="例: Team Alpha"
                    value={newTeam.name}
                    onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-[#343A40]">プロジェクト名（任意）</label>
                  <Input
                    placeholder="例: 学習管理システム"
                    value={newTeam.project_name}
                    onChange={(e) => setNewTeam({ ...newTeam, project_name: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-[#343A40]">あなたの役割</label>
                  <Input
                    placeholder="例: Tech Lead, PM, Designer"
                    value={newTeam.creator_role}
                    onChange={(e) => setNewTeam({ ...newTeam, creator_role: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-[#343A40]">メンバー選択</label>

                  {/* 選択済みメンバー表示 */}
                  {selectedMembers.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {selectedMembers.map((member) => (
                        <Badge key={member.id} variant="secondary" className="flex items-center gap-1 pl-2">
                          {member.name}
                          <button
                            onClick={() => handleRemoveMember(member.id)}
                            className="ml-1 rounded-full hover:bg-gray-200 p-0.5"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* メンバー検索・選択 */}
                  <Popover open={isUserDropdownOpen} onOpenChange={setIsUserDropdownOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={isUserDropdownOpen}
                        className="w-full justify-between"
                      >
                        <span className="truncate">メンバーを追加</span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput
                          placeholder="名前またはメールで検索..."
                          value={searchQuery}
                          onValueChange={setSearchQuery}
                          className="h-9"
                        />
                        <CommandList>
                          <CommandEmpty>該当するユーザーがいません</CommandEmpty>
                          <CommandGroup>
                            <ScrollArea className="h-60">
                              {userOptions.map((user) => (
                                <CommandItem
                                  key={user.id}
                                  value={user.id.toString()}
                                  onSelect={() => handleSelectMember(user)}
                                  className="flex items-center justify-between"
                                >
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

                <Button
                  onClick={handleCreateTeam}
                  disabled={isLoading}
                  className="w-full bg-[#4CAF50] hover:bg-[#45A049]"
                >
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
              <Select
                value={selectedCourseStep?.toString() || "all"}
                onValueChange={(value) => setSelectedCourseStep(value === "all" ? null : Number.parseInt(value))}
              >
                <SelectTrigger className="w-64">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべてのステップ</SelectItem>
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
        {selectedCourseStep ? (
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
                          {team.project_name && (
                            <Badge className="bg-[#4CAF50]/10 text-[#2E7D32] border-[#4CAF50]/20 text-xs">
                              {team.project_name}
                            </Badge>
                          )}
                          <div className="flex items-center gap-1 text-xs text-[#6C757D]">
                            <Calendar className="w-3 h-3" />
                            {formatDate(team.created_at)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <h3 className="text-sm font-medium text-[#343A40]">メンバー ({team.members.length}人)</h3>
                      {team.members.map((member) => (
                        <div
                          key={member.user_id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
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
                            {member.role_in_team && (
                              <Badge variant="outline" className="text-xs">
                                {member.role_in_team}
                              </Badge>
                            )}
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
            {teamsByStep.map(({ step, teams }) => (
              <div key={step.id}>
                <h2 className="text-xl font-semibold text-[#343A40] mb-4 flex items-center">
                  <Badge className="mr-2 bg-[#5D70F7] text-white">{step.name}</Badge>
                  {step.start_date && step.end_date && (
                    <span className="text-sm font-normal text-[#6C757D]">
                      {formatDate(step.start_date)} 〜 {formatDate(step.end_date)}
                    </span>
                  )}
                </h2>

                {teams.length === 0 ? (
                  <Card className="border border-gray-200 shadow-sm p-6 text-center">
                    <p className="text-[#6C757D]">このステップのチームはありません</p>
                  </Card>
                ) : (
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
                                {team.project_name && (
                                  <Badge className="bg-[#4CAF50]/10 text-[#2E7D32] border-[#4CAF50]/20 text-xs">
                                    {team.project_name}
                                  </Badge>
                                )}
                                <div className="flex items-center gap-1 text-xs text-[#6C757D]">
                                  <Calendar className="w-3 h-3" />
                                  {formatDate(team.created_at)}
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <h3 className="text-sm font-medium text-[#343A40]">メンバー ({team.members.length}人)</h3>
                            {team.members.map((member) => (
                              <div
                                key={member.user_id}
                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                              >
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
                                  {member.role_in_team && (
                                    <Badge variant="outline" className="text-xs">
                                      {member.role_in_team}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
