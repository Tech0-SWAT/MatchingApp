// app/page.tsx - 本番用クリーン版
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

// 通常のインポート
import LoginScreen from "@/components/login-screen";
import SignUpScreen from "@/components/signup-screen";
import SearchResultsScreen from "@/components/search-results-screen";
import ProfileSetupScreen from "@/components/profile-setup-screen";
import TeamManagementScreen from "@/components/team-management-screen";

interface UserProfile {
  id: number;
  name: string;
  email: string;
  profile?: any;
}

export default function Home() {
  const [currentScreen, setCurrentScreen] = useState("login");
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFirstLogin, setIsFirstLogin] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // 初期認証チェック
  useEffect(() => {
    if (isInitialized) return; // 二重実行を防ぐ

    const checkAuthStatus = async () => {
      try {
        console.log("認証状況を確認中...");

        const response = await fetch("/api/auth/check", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        console.log("認証チェックレスポンス:", response.status);

        if (response.ok) {
          const data = await response.json();
          console.log("認証チェック結果:", data);

          if (data.success && data.user) {
            console.log("ユーザー情報取得成功:", data.user);
            setCurrentUser(data.user);

            // プロフィール設定済みかチェック
            const hasProfile = data.user.profile && (data.user.profile.desired_role_in_team || data.user.profile.self_introduction_comment);

            console.log("プロフィール設定状況:", hasProfile);

            if (hasProfile) {
              console.log("プロフィール設定済み → 仲間探し画面へ");
              setCurrentScreen("search-results");
            } else {
              console.log("プロフィール未設定 → プロフィール設定画面へ");
              setCurrentScreen("profile-setup");
              setIsFirstLogin(true);
            }
          } else {
            console.log("未ログイン → ログイン画面のまま");
            setCurrentScreen("login");
          }
        } else {
          console.log("認証チェック失敗 → ログイン画面のまま");
          setCurrentScreen("login");
        }
      } catch (error) {
        console.error("認証チェックエラー:", error);
        setCurrentScreen("login");
      } finally {
        setIsLoading(false);
        setIsInitialized(true);
      }
    };

    checkAuthStatus();
  }, [isInitialized]);

  // ナビゲーションハンドラー
  const handleNavigation = (screen: string, data?: any) => {
    console.log("🧭 画面遷移リクエスト:", { screen, data });

    try {
      setCurrentScreen(screen);

      // ユーザー情報の更新処理を改善
      if (data) {
        if (data.user) {
          console.log("ユーザー情報を更新:", data.user);
          setCurrentUser(data.user);
        } else if (data.id) {
          // data 自体がユーザー情報の場合
          console.log("ユーザー情報を更新:", data);
          setCurrentUser(data);
        }

        if (data.isFirstLogin) {
          setIsFirstLogin(true);
        }
      }

      if (screen === "login") {
        console.log("ログイン画面へ遷移 → ユーザー情報をクリア");
        setCurrentUser(null);
        setIsFirstLogin(false);
      }

      setError(null);
      console.log("✅ 画面遷移完了:", screen);
    } catch (error) {
      console.error("❌ 画面遷移エラー:", error);
      setError("画面遷移でエラーが発生しました");
    }
  };

  // ローディング中
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#5D70F7] mx-auto mb-4"></div>
          <p className="text-[#6C757D]">認証状況を確認しています...</p>
          <p className="text-xs text-gray-400 mt-2">初回アクセス時は少し時間がかかる場合があります</p>
        </div>
      </div>
    );
  }

  // エラー状態
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA] p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">エラーが発生しました</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <div className="space-y-2">
              <Button
                onClick={() => {
                  setError(null);
                  setCurrentScreen("login");
                }}
                className="w-full bg-[#5D70F7] hover:bg-[#4D60E7]"
              >
                ログイン画面に戻る
              </Button>
              <Button onClick={() => window.location.reload()} variant="outline" className="w-full">
                ページを再読み込み
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 画面表示
  const renderScreen = () => {
    switch (currentScreen) {
      case "login":
        return <LoginScreen onNavigate={handleNavigation} />;

      case "signup":
        return <SignUpScreen onNavigate={handleNavigation} />;

      case "profile-setup":
        if (!currentUser) {
          console.warn("プロフィール設定画面: ユーザー情報がないためログイン画面に戻る");
          setTimeout(() => setCurrentScreen("login"), 0);
          return <LoginScreen onNavigate={handleNavigation} />;
        }
        return <ProfileSetupScreen onNavigate={handleNavigation} currentUser={currentUser} isFirstLogin={isFirstLogin} />;

      case "search-results":
        if (!currentUser) {
          console.warn("検索画面: ユーザー情報がないためログイン画面に戻る");
          setTimeout(() => setCurrentScreen("login"), 0);
          return <LoginScreen onNavigate={handleNavigation} />;
        }
        return <SearchResultsScreen onNavigate={handleNavigation} currentUser={currentUser} />;

      case "team-management":
        if (!currentUser) {
          console.warn("チーム管理画面: ユーザー情報がないためログイン画面に戻る");
          setTimeout(() => setCurrentScreen("login"), 0);
          return <LoginScreen onNavigate={handleNavigation} />;
        }
        return <TeamManagementScreen onNavigate={handleNavigation} currentUser={currentUser} />;

      default:
        console.warn("⚠️ 不明な画面:", currentScreen, "→ ログイン画面を表示");
        return <LoginScreen onNavigate={handleNavigation} />;
    }
  };

  return renderScreen();
}
