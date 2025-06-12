"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Users, User, Clock, Briefcase, AlertCircle, Search } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface SearchResultsScreenProps {
  onNavigate: (screen: string, data?: any) => void
  currentUser: any
}

const roleTypes = [
  { value: "", label: "こだわらない" },
  { value: "tech", label: "Tech (技術・開発)" },
  { value: "biz", label: "Biz (ビジネス・企画)" },
  { value: "design", label: "Design (デザイン・UX)" },
]

const weekdayTimesOptions = [
  { value: "", label: "平日 特に希望なし" },
  { value: "平日 朝5時～7時", label: "平日 朝5時～7時" },
  { value: "平日 7時～9時", label: "平日 7時～9時" },
  { value: "平日 18時～20時", label: "平日 18時～20時" },
  { value: "平日 20時～22時", label: "平日 20時～22時" },
  { value: "平日 22時～24時", label: "平日 22時～24時" },
  { value: "平日 いつでも良い", label: "平日 いつでも良い" },
]

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
]

const ideaStatuses = [
  { value: "", label: "こだわらない" },
  { value: "concrete", label: "具体的な開発アイデアを持っている" },
  { value: "rough", label: "おおまかなテーマや興味分野がある" },
  { value: "brainstorm", label: "アイデア出しから一緒に考えたい" },
  { value: "participate", label: "他の人のアイデアに積極的に参加したい" },
]

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
]

export default function SearchResultsScreen({ onNavigate, currentUser }: SearchResultsScreenProps) {
  const [roleType, setRoleType] = useState("")
  const [filteredStudents, setFilteredStudents] = useState<any[]>([]) // 初期値を空配列に設定
  const [showResults, setShowResults] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<string[]>([])

  const handleSearch = async () => {
    setIsLoading(true)
    setErrors([])

    try {
      const searchCriteria = {
        roleType,
      }

      const response = await fetch("/api/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(searchCriteria),
      })

      const data = await response.json()

      if (data.success) {
        setFilteredStudents(Array.isArray(data.results) ? data.results : [])
        setShowResults(true)
      } else {
        setErrors(data.errors || [data.error || "マッチングに失敗しました"])
        setFilteredStudents([])
      }
    } catch (error) {
      console.error("マッチングエラー:", error)
      setErrors(["ネットワークエラーが発生しました。再度お試しください。"])
      setFilteredStudents([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleStudentClick = (student: any) => {
    onNavigate("profile-detail", student)
  }

  const getRoleTypeLabel = (type: string) => {
    const role = roleTypes.find((r) => r.value === type)
    return role ? role.label : type
  }

  const getIdeaStatusLabel = (status: string) => {
    const idea = ideaStatuses.find((i) => i.value === status)
    return idea ? idea.label : status
  }

  const getGenreLabels = (genres: string[]) => {
    if (!Array.isArray(genres)) return []
    return genres.map((genre) => {
      const found = productGenres.find((g) => g.value === genre)
      return found ? found.label : genre
    })
  }

  return (
    <div className="min-h-screen p-4 bg-[#F8F9FA]">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="text-center flex-1">
            <h1 className="text-2xl font-semibold text-[#343A40] mb-2">仲間を探す (Tech0内)</h1>
            <p className="text-[#6C757D]">詳細な条件を設定して、最適な仲間を見つけましょう</p>
          </div>
          <Button
            onClick={() => onNavigate("team-management")}
            variant="outline"
            className="border-2 border-[#4CAF50] text-[#4CAF50] hover:bg-[#4CAF50] hover:text-white"
          >
            <Users className="w-4 h-4 mr-2" />
            チーム管理
          </Button>
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

              <Button
                onClick={handleSearch}
                disabled={isLoading}
                className="w-full h-12 bg-[#FF8C42] hover:bg-[#E67C32] text-white font-medium text-lg disabled:opacity-50"
              >
                <Search className="w-4 h-4 mr-2" />
                {isLoading ? "マッチング中..." : "マッチング開始"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 検索結果表示エリア */}
        {showResults && (
          <div>
            <h2 className="text-xl font-semibold text-[#343A40] mb-6">
              検索結果 ({Array.isArray(filteredStudents) ? filteredStudents.length : 0}件)
            </h2>

            {!Array.isArray(filteredStudents) || filteredStudents.length === 0 ? (
              <Card className="border border-gray-200 shadow-sm p-8 text-center">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-lg font-semibold text-[#343A40] mb-2">
                  条件に合うユーザーは見つかりませんでした。
                </h3>
                <p className="text-[#6C757D]">検索条件を変えてみてください。</p>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredStudents.map((student, index) => (
                  <Card
                    key={student?.id || index}
                    className="border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer w-full"
                    onClick={() => handleStudentClick(student)}
                  >
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
                                    {getRoleTypeLabel(student?.roleType || "")}
                                  </Badge>
                                  {student?.personalityType && (
                                    <Badge variant="outline" className="text-xs">
                                      {student.personalityType}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* マッチしたキーワード */}
                            {Array.isArray(student?.matchKeywords) && student.matchKeywords.length > 0 && (
                              <div className="mb-3">
                                <div className="text-sm font-medium text-[#343A40] mb-1">マッチしたキーワード</div>
                                <div className="flex flex-wrap gap-1">
                                  {student.matchKeywords.map((keyword: string, keywordIndex: number) => (
                                    <Badge
                                      key={keywordIndex}
                                      className="bg-[#5D70F7]/10 text-[#5D70F7] border-[#5D70F7]/20"
                                    >
                                      {keyword}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* アイデア状況とプロダクトジャンル */}
                            <div className="mb-3">
                              <div className="text-sm font-medium text-[#343A40] mb-1">アイデア状況・興味ジャンル</div>
                              <div className="flex flex-wrap gap-1">
                                {student?.ideaStatus && (
                                  <Badge className="bg-[#FFD700]/10 text-[#B8860B] border-[#FFD700]/20">
                                    {getIdeaStatusLabel(student.ideaStatus)}
                                  </Badge>
                                )}
                                {Array.isArray(student?.productGenres) &&
                                  getGenreLabels(student.productGenres.slice(0, 2)).map((genre, genreIndex) => (
                                    <Badge
                                      key={genreIndex}
                                      className="bg-[#4CAF50]/10 text-[#2E7D32] border-[#4CAF50]/20"
                                    >
                                      {genre}
                                    </Badge>
                                  ))}
                                {Array.isArray(student?.productGenres) && student.productGenres.length > 2 && (
                                  <Badge className="bg-gray-100 text-gray-600">
                                    +{student.productGenres.length - 2}
                                  </Badge>
                                )}
                              </div>
                            </div>

                            {/* 活動時間 */}
                            <div className="mb-3">
                              <div className="text-sm font-medium text-[#343A40] mb-1">活動時間</div>
                              <div className="flex items-center gap-2 text-sm text-[#6C757D]">
                                <Clock className="w-3 h-3" />
                                <div className="flex flex-wrap gap-1">
                                  {Array.isArray(student?.weekdayTimes) &&
                                    student.weekdayTimes.slice(0, 2).map((time: string, timeIndex: number) => (
                                      <Badge key={timeIndex} variant="outline" className="text-xs">
                                        {time}
                                      </Badge>
                                    ))}
                                  {Array.isArray(student?.weekdayTimes) && student.weekdayTimes.length > 2 && (
                                    <Badge variant="outline" className="text-xs">
                                      +{student.weekdayTimes.length - 2}
                                    </Badge>
                                  )}
                                  <span>•</span>
                                  {Array.isArray(student?.weekendTimes) &&
                                    student.weekendTimes.slice(0, 2).map((time: string, timeIndex: number) => (
                                      <Badge key={timeIndex} variant="outline" className="text-xs">
                                        {time}
                                      </Badge>
                                    ))}
                                  {Array.isArray(student?.weekendTimes) && student.weekendTimes.length > 2 && (
                                    <Badge variant="outline" className="text-xs">
                                      +{student.weekendTimes.length - 2}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* こんな活動がしたい */}
                            {student?.collaboration && (
                              <div className="mb-3">
                                <div className="text-sm font-medium text-[#343A40] mb-1">こんな活動がしたい</div>
                                <p className="text-sm text-[#6C757D] line-clamp-2">{student.collaboration}</p>
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
  )
}
