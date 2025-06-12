"use client"

import { useState } from "react"
import LoginScreen from "@/components/login-screen"
import SignUpScreen from "@/components/signup-screen"
import ProfileSetupScreen from "@/components/profile-setup-screen"
import SearchResultsScreen from "@/components/search-results-screen"
import ProfileDetailScreen from "@/components/profile-detail-screen"
import MessageScreen from "@/components/message-screen"
// MessageScreenの後にTeamManagementScreenをインポート
import TeamManagementScreen from "@/components/team-management-screen"

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<string>("login")
  const [selectedStudent, setSelectedStudent] = useState<any>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)

  const navigateToScreen = (screen: string, data?: any) => {
    setCurrentScreen(screen)
    if (data) {
      if (screen === "profile-detail") {
        setSelectedStudent(data)
      } else if (screen === "search-results") {
        setCurrentUser(data)
      } else if (screen === "message") {
        setSelectedStudent(data)
      }
    }
  }

  const renderScreen = () => {
    switch (currentScreen) {
      case "login":
        return <LoginScreen onNavigate={navigateToScreen} />
      case "signup":
        return <SignUpScreen onNavigate={navigateToScreen} />
      case "profile-setup":
        return <ProfileSetupScreen onNavigate={navigateToScreen} />
      case "search-results":
        return <SearchResultsScreen onNavigate={navigateToScreen} currentUser={currentUser} />
      case "profile-detail":
        return <ProfileDetailScreen student={selectedStudent} onNavigate={navigateToScreen} />
      case "message":
        return <MessageScreen student={selectedStudent} onNavigate={navigateToScreen} />
      // renderScreen関数内にteam-managementケースを追加
      case "team-management":
        return <TeamManagementScreen onNavigate={navigateToScreen} />
      default:
        return <LoginScreen onNavigate={navigateToScreen} />
    }
  }

  return <div className="min-h-screen bg-[#F8F9FA]">{renderScreen()}</div>
}
