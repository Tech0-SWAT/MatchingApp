"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, User, Code, Clock, Target, MessageSquare, MessageCircle } from "lucide-react"

interface ProfileDetailScreenProps {
  student: any
  onNavigate: (screen: string, data?: any) => void
}

export default function ProfileDetailScreen({ student, onNavigate }: ProfileDetailScreenProps) {
  if (!student) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]">
        <p className="text-[#6C757D]">学生情報が見つかりません</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 bg-[#F8F9FA]">
      <div className="max-w-2xl mx-auto">
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
          <h1 className="text-2xl font-semibold text-[#343A40]">プロフィール詳細</h1>
        </div>

        {/* プロフィールヘッダー */}
        <Card className="border border-gray-200 shadow-sm mb-6">
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-[#5D70F7] to-[#38C9B9] rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-semibold text-[#343A40] mb-2">{student.name}</h2>
            <div className="flex items-center justify-center gap-2 text-[#6C757D] mb-6">
              <Clock className="w-4 h-4" />
              <span>{student.timePreference}</span>
            </div>
            <Button
              onClick={() => onNavigate("message", student)}
              className="bg-[#4CAF50] hover:bg-[#45A049] text-white px-8"
            >
              <MessageCircle className="w-4 h-4 mr-2" />
              メッセージを送る
            </Button>
          </CardContent>
        </Card>

        {/* 得意なスキル・技術 */}
        <Card className="border border-gray-200 shadow-sm mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#343A40]">
              <Code className="w-5 h-5 text-[#5D70F7]" />
              得意なスキル・技術
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[#343A40] leading-relaxed">{student.skills}</p>
          </CardContent>
        </Card>

        {/* 興味のある分野・学習中のこと */}
        <Card className="border border-gray-200 shadow-sm mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#343A40]">
              <Target className="w-5 h-5 text-[#38C9B9]" />
              興味のある分野・学習中のこと
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[#343A40] leading-relaxed">{student.interests}</p>
          </CardContent>
        </Card>

        {/* こんな活動がしたい・こんな人と組みたい */}
        <Card className="border border-gray-200 shadow-sm mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#343A40]">
              <MessageSquare className="w-5 h-5 text-[#FF8C42]" />
              こんな活動がしたい・こんな人と組みたい
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[#343A40] leading-relaxed">{student.collaboration}</p>
          </CardContent>
        </Card>

        {/* 自己紹介 */}
        <Card className="border border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-[#343A40]">
              <User className="w-5 h-5 text-[#5D70F7]" />
              自己紹介
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[#343A40] leading-relaxed">{student.introduction}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
