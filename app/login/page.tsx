"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Mail, Lock, Eye, EyeOff, AlertCircle } from "lucide-react"

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      // TODO: 実際の認証API呼び出し
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (data.success) {
        // ログイン成功時の処理
        router.push("/dashboard")
      } else {
        setError(data.error || "ログインに失敗しました")
      }
    } catch (error) {
      console.error("ログインエラー:", error)
      setError("ネットワークエラーが発生しました")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#F8F9FA]">
      <Card className="w-full max-w-md border border-gray-200 shadow-sm">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-semibold text-[#343A40] mb-2">受講生マッチング</h1>
            <p className="text-[#6C757D]">Tech0でのチーム活動をサポート</p>
          </div>

          {error && (
            <Alert className="mb-6 border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-[#343A40]">
                メールアドレス
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#6C757D] w-4 h-4" />
                <Input
                  id="email"
                  type="email"
                  placeholder="例: user@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-11 border-2 border-gray-300 focus:border-[#5D70F7] transition-colors"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-[#343A40]">
                パスワード
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#6C757D] w-4 h-4" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="パスワードを入力"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 h-11 border-2 border-gray-300 focus:border-[#5D70F7] transition-colors"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#6C757D] hover:text-[#343A40]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 bg-[#5D70F7] hover:bg-[#4D60E7] text-white font-medium transition-colors disabled:opacity-50"
            >
              {isLoading ? "ログイン中..." : "ログイン"}
            </Button>
          </form>

          <div className="text-center pt-4">
            <p className="text-sm text-[#6C757D]">
              アカウントをお持ちでない方は
              <a href="/signup" className="text-[#5D70F7] hover:underline ml-1 font-medium">
                こちら (新規登録)
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
