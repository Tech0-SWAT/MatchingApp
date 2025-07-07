"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, Lock, User, Eye, EyeOff } from "lucide-react";

interface SignUpScreenProps {
  onNavigate: (screen: string, data?: any) => void;
}

export default function SignUpScreen({ onNavigate }: SignUpScreenProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleSignUp = async () => {
    // バリデーション
    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      alert("すべての項目を入力してください");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      alert("パスワードが一致しません");
      return;
    }

    if (formData.password.length < 6) {
      alert("パスワードは6文字以上で入力してください");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (data.success) {
        console.log("新規登録成功:", data);
        // 登録成功後、ユーザー情報を渡してプロフィール設定画面に遷移
        onNavigate("profile-setup", { user: data.user, isFirstLogin: true });
      } else {
        alert(`新規登録に失敗しました: ${data.error}`);
      }
    } catch (error) {
      console.error("新規登録エラー:", error);
      alert("新規登録中にエラーが発生しました");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#F8F9FA]">
      <Card className="w-full max-w-md border border-gray-200 shadow-sm">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-semibold text-[#343A40] mb-2">新規アカウント作成</h1>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium text-[#343A40]">
                お名前
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#6C757D] w-4 h-4" />
                <Input id="name" type="text" placeholder="例: 山田 太郎" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="pl-10 h-11 border-2 border-gray-300 focus:border-[#5D70F7] transition-colors" disabled={isLoading} />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-[#343A40]">
                メールアドレス
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#6C757D] w-4 h-4" />
                <Input id="email" type="email" placeholder="例: user@example.com" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="pl-10 h-11 border-2 border-gray-300 focus:border-[#5D70F7] transition-colors" disabled={isLoading} />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-[#343A40]">
                パスワード
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#6C757D] w-4 h-4" />
                <Input id="password" type={showPassword ? "text" : "password"} placeholder="パスワードを入力" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="pl-10 pr-10 h-11 border-2 border-gray-300 focus:border-[#5D70F7] transition-colors" disabled={isLoading} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#6C757D] hover:text-[#343A40]" disabled={isLoading}>
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium text-[#343A40]">
                パスワード（確認用）
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#6C757D] w-4 h-4" />
                <Input id="confirmPassword" type={showConfirmPassword ? "text" : "password"} placeholder="パスワードを再入力" value={formData.confirmPassword} onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })} className="pl-10 pr-10 h-11 border-2 border-gray-300 focus:border-[#5D70F7] transition-colors" disabled={isLoading} />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#6C757D] hover:text-[#343A40]" disabled={isLoading}>
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button onClick={handleSignUp} disabled={isLoading} className="w-full h-11 bg-[#5D70F7] hover:bg-[#4D60E7] text-white font-medium transition-colors disabled:opacity-50">
              {isLoading ? "登録中..." : "登録する"}
            </Button>

            <div className="text-center pt-4">
              <p className="text-sm text-[#6C757D]">
                既にアカウントをお持ちですか？
                <button onClick={() => onNavigate("login")} className="text-[#5D70F7] hover:underline ml-1 font-medium" disabled={isLoading}>
                  ログイン
                </button>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
