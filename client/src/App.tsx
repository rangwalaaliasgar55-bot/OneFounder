import { useState, useEffect } from 'react'
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

type Page =
  | 'dashboard'
  | 'ideas'
  | 'research'
  | 'planner'
  | 'projects'
  | 'content'
  | 'crm'
  | 'chat'
  | 'knowledge'
  | 'settings'
  | 'social'
  | 'finance'
  | 'seo'
  | 'journey'

export default function App() {
  const { user, loading } = useAuth()
  const [currentPage, setCurrentPage] = useState<Page>('dashboard')

  useEffect(() => {
    const hash = window.location.hash.replace('#', '') as Page
    if (hash) setCurrentPage(hash)
  }, [])

  const navigate = (page: Page) => {
    setCurrentPage(page)
    window.location.hash = page
  }

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

  const pages: Record<Page, JSX.Element> = {
    dashboard: <DashboardPage navigate={navigate} />,
    ideas: <IdeasPage />,
    research: <ResearchPage />,
    planner: <PlannerPage />,
    projects: <ProjectsPage />,
    content: <ContentPage />,
    crm: <CRMPage />,
    chat: <ChatPage />,
    knowledge: <KnowledgePage />,
    settings: <SettingsPage />,
    social: <SocialPage />,
    finance: <FinancePage />,
    seo: <SeoPage />,
    journey: <JourneyPage />,
  }

  return (
    <AppShell currentPage={currentPage} navigate={navigate} user={user}>
      {pages[currentPage]}
    </AppShell>
  )
}
