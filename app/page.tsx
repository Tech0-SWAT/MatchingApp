"use client";

import { useState, useEffect } from "react";
import LoginScreen from "@/components/login-screen";
import ProfileSetupScreen from "@/components/profile-setup-screen";
import SearchResultsScreen from "@/components/search-results-screen";
import ProfileDetailScreen from "@/components/profile-detail-screen";
import TeamManagementScreen from "@/components/team-management-screen";

type Screen = "login" | "profile-setup" | "search-results" | "profile-detail" | "team-management";

interface User {
  id: number;
  name: string;
  email: string;
  personality_type?: string;
  idea_status?: string;
  desired_role_in_team?: string;
  self_introduction_comment?: string;
  product_genre_ids?: number[];
  timeslot_ids?: number[];
  team_priority_ids?: number[];
}

export default function Home() {
  const [currentScreen, setCurrentScreen] = useState<Screen>("login");
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedProfileData, setSelectedProfileData] = useState<any>(null);

  // ログイン状態をチェック
  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const response = await fetch("/api/auth/me");
        if (response.ok) {
          const userData = await response.json();
          setCurrentUser(userData.user);
          setCurrentScreen("search-results");
        }
      } catch (error) {
        console.log("ログインチェックエラー:", error);
      }
    };

    checkLoginStatus();
  }, []);

  const handleNavigation = (screen: Screen, data?: any) => {
    setCurrentScreen(screen);
    if (data) {
      if (screen === "profile-detail") {
        setSelectedProfileData(data);
      }
    }
  };

  const handleLogin = (userData: User) => {
    console.log("handleLogin called with:", userData); // デバッグ用
    setCurrentUser(userData);
    setCurrentScreen("profile-setup"); // profile-setupに遷移
  };

  // 応急処置: ログイン後に手動でユーザー設定
  useEffect(() => {
    if (currentScreen === "profile-setup" && !currentUser) {
      console.log("応急処置: currentUserを手動設定");
      setCurrentUser({
        id: 1,
        name: "田中 太郎",
        email: "tanaka@example.com",
      });
    }
  }, [currentScreen, currentUser]);

  const handleLogout = async () => {
    try {
      // サーバーサイドでのログアウト処理
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
    } catch (error) {
      console.log("ログアウトエラー:", error);
    }

    // クライアントサイドの状態をクリア
    setCurrentUser(null);
    setSelectedProfileData(null);
    setCurrentScreen("login");
  };

  const renderCurrentScreen = () => {
    switch (currentScreen) {
      case "login":
        return <LoginScreen onLogin={handleLogin} onNavigate={handleNavigation} />;

      case "profile-setup":
        return <ProfileSetupScreen onNavigate={handleNavigation} currentUser={currentUser} />;

      case "search-results":
        return <SearchResultsScreen onNavigate={handleNavigation} currentUser={currentUser} />;

      case "profile-detail":
        return <ProfileDetailScreen onNavigate={handleNavigation} profileData={selectedProfileData} currentUser={currentUser} />;

      case "team-management":
        return <TeamManagementScreen onNavigate={handleNavigation} />;

      default:
        return (
          <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]">
            <div className="text-center">
              <h1 className="text-2xl font-semibold text-[#343A40] mb-4">学生マッチングアプリ</h1>
              <p className="text-[#6C757D] mb-6">画面の読み込み中...</p>
              <button onClick={() => setCurrentScreen("login")} className="px-4 py-2 bg-[#5D70F7] text-white rounded hover:bg-[#4D60E7]">
                ログインページへ
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <main className="min-h-screen">
      {renderCurrentScreen()}

      {/* グローバルナビゲーション（ログイン後のみ表示） */}
      {currentUser && currentScreen !== "login" && currentScreen !== "profile-setup" && (
        <div className="fixed bottom-4 right-4 z-50">
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-3 flex gap-2">
            <button onClick={() => handleNavigation("search-results")} className={`px-3 py-2 rounded text-sm ${currentScreen === "search-results" ? "bg-[#5D70F7] text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
              検索
            </button>
            <button onClick={() => handleNavigation("team-management")} className={`px-3 py-2 rounded text-sm ${currentScreen === "team-management" ? "bg-[#5D70F7] text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
              チーム
            </button>
            <button onClick={handleLogout} className="px-3 py-2 rounded text-sm bg-red-100 text-red-700 hover:bg-red-200">
              ログアウト
            </button>
          </div>
        </div>
      )}

      {/* デバッグ情報（開発環境のみ） */}
      {process.env.NODE_ENV === "development" && (
        <div className="fixed top-4 left-4 z-50 bg-black bg-opacity-75 text-white text-xs p-2 rounded">
          現在の画面: {currentScreen}
          <br />
          ユーザー: {currentUser?.name || "未ログイン"}
        </div>
      )}
    </main>
  );
}
