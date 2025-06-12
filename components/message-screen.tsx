"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { ArrowLeft, Send, User } from "lucide-react"

interface MessageScreenProps {
  student: any
  onNavigate: (screen: string) => void
}

interface Message {
  id: number
  text: string
  sender: "me" | "other"
  timestamp: string
}

export default function MessageScreen({ student, onNavigate }: MessageScreenProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "こんにちは！プロフィールを拝見させていただきました。",
      sender: "me",
      timestamp: "14:30",
    },
    {
      id: 2,
      text: "一緒に学習できればと思いメッセージしました！",
      sender: "me",
      timestamp: "14:30",
    },
    {
      id: 3,
      text: "こんにちは！メッセージありがとうございます😊",
      sender: "other",
      timestamp: "14:35",
    },
    {
      id: 4,
      text: "ぜひ一緒に学習しましょう！どのような分野に興味がありますか？",
      sender: "other",
      timestamp: "14:35",
    },
  ])
  const [newMessage, setNewMessage] = useState("")

  const sendMessage = () => {
    if (newMessage.trim()) {
      const message: Message = {
        id: messages.length + 1,
        text: newMessage.trim(),
        sender: "me",
        timestamp: new Date().toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" }),
      }
      setMessages([...messages, message])
      setNewMessage("")
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  if (!student) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]">
        <p className="text-[#6C757D]">学生情報が見つかりません</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F9FA]">
      {/* ヘッダー */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => onNavigate("profile-detail")}
            className="border-2 border-gray-300 hover:border-[#5D70F7]"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#5D70F7] to-[#38C9B9] rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-semibold text-[#343A40]">{student.name}</h1>
              <p className="text-sm text-[#6C757D]">オンライン</p>
            </div>
          </div>
        </div>
      </div>

      {/* メッセージエリア */}
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="max-w-2xl mx-auto space-y-4">
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.sender === "me" ? "justify-end" : "justify-start"}`}>
              <div className="max-w-[70%]">
                <Card
                  className={`p-3 border-0 ${
                    message.sender === "me"
                      ? "bg-[#5D70F7] text-white"
                      : "bg-white text-[#343A40] border border-gray-200 shadow-sm"
                  }`}
                >
                  <p className="text-sm leading-relaxed">{message.text}</p>
                </Card>
                <p className={`text-xs text-[#6C757D] mt-1 ${message.sender === "me" ? "text-right" : "text-left"}`}>
                  {message.timestamp}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* メッセージ入力エリア */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="max-w-2xl mx-auto flex gap-3">
          <Input
            placeholder="メッセージを入力..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1 border-2 border-gray-300 focus:border-[#5D70F7]"
          />
          <Button
            onClick={sendMessage}
            disabled={!newMessage.trim()}
            className="bg-[#4CAF50] hover:bg-[#45A049] text-white px-6"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
