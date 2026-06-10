import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { LoginPage } from './pages/LoginPage'
import { AppShell } from './components/layout/AppShell'
import { DashboardPage } from './pages/DashboardPage'
import { IdeasPage } from './pages/IdeasPage'
import { ResearchPage } from './pages/ResearchPage'
import { PlannerPage } from './pages/PlannerPage'
import { ProjectsPage } from './pages/ProjectsPage'
import { ContentPage } from './pages/ContentPage'
import { CRMPage } from './pages/CRMPage'
import { ChatPage } from './pages/ChatPage'
import { KnowledgePage } from './pages/KnowledgePage'
import { SettingsPage } from './pages/SettingsPage'
import { SocialPage } from './pages/SocialPage'
import { FinancePage } from './pages/FinancePage'
import { SeoPage } from './pages/SeoPage'
import { JourneyPage } from './pages/JourneyPage'
import { WordPressPage } from './pages/WordPressPage'

function AuthenticatedApp() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/ideas" element={<IdeasPage />} />
        <Route path="/research" element={<ResearchPage />} />
        <Route path="/planner" element={<PlannerPage />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/content" element={<ContentPage />} />
        <Route path="/crm" element={<CRMPage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/knowledge" element={<KnowledgePage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/social" element={<SocialPage />} />
        <Route path="/finance" element={<FinancePage />} />
        <Route path="/seo" element={<SeoPage />} />
        <Route path="/journey" element={<JourneyPage />} />
        <Route path="/wordpress" element={<WordPressPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  )
}

export default function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-surface-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-brand-600 flex items-center justify-center text-2xl animate-pulse">
            🚀
          </div>
          <div className="text-slate-400 text-sm">Loading OneFounder...</div>
        </div>
      </div>
    )
  }

  if (!user) {
    return <LoginPage onSuccess={() => window.location.reload()} />
  }

  return (
    <BrowserRouter>
      <AuthenticatedApp />
    </BrowserRouter>
  )
}
