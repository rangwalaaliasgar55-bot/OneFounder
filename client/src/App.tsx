import { lazy, Suspense, useEffect, useState, useRef } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { LoginPage } from './pages/LoginPage'
import { AppShell } from './components/layout/AppShell'
import { CommandPalette } from './components/CommandPalette'
import { FloatingAI } from './components/FloatingAI'
import { OnboardingModal } from './components/OnboardingModal'
import { ShortcutsModal } from './components/ShortcutsModal'
import { ToastProvider } from './components/ui/ToastProvider'
import { ErrorBoundary } from './components/ErrorBoundary'

const DashboardPage  = lazy(() => import('./pages/DashboardPage').then(m => ({ default: m.DashboardPage })))
const IdeasPage      = lazy(() => import('./pages/IdeasPage').then(m => ({ default: m.IdeasPage })))
const ResearchPage   = lazy(() => import('./pages/ResearchPage').then(m => ({ default: m.ResearchPage })))
const PlannerPage    = lazy(() => import('./pages/PlannerPage').then(m => ({ default: m.PlannerPage })))
const ProjectsPage   = lazy(() => import('./pages/ProjectsPage').then(m => ({ default: m.ProjectsPage })))
const ContentPage    = lazy(() => import('./pages/ContentPage').then(m => ({ default: m.ContentPage })))
const CRMPage        = lazy(() => import('./pages/CRMPage').then(m => ({ default: m.CRMPage })))
const ChatPage       = lazy(() => import('./pages/ChatPage').then(m => ({ default: m.ChatPage })))
const KnowledgePage  = lazy(() => import('./pages/KnowledgePage').then(m => ({ default: m.KnowledgePage })))
const SettingsPage   = lazy(() => import('./pages/SettingsPage').then(m => ({ default: m.SettingsPage })))
const SocialPage     = lazy(() => import('./pages/SocialPage').then(m => ({ default: m.SocialPage })))
const FinancePage    = lazy(() => import('./pages/FinancePage').then(m => ({ default: m.FinancePage })))
const SeoPage        = lazy(() => import('./pages/SeoPage').then(m => ({ default: m.SeoPage })))
const JourneyPage    = lazy(() => import('./pages/JourneyPage').then(m => ({ default: m.JourneyPage })))
const WordPressPage  = lazy(() => import('./pages/WordPressPage').then(m => ({ default: m.WordPressPage })))
const InvestorPage   = lazy(() => import('./pages/InvestorPage').then(m => ({ default: m.InvestorPage })))

function prefetchAfterIdle(importFns: Array<() => Promise<unknown>>, delay = 200) {
  const run = () => { importFns.forEach(fn => { try { fn() } catch (_) {} }) }
  if (typeof requestIdleCallback !== 'undefined') requestIdleCallback(run, { timeout: 3000 })
  else setTimeout(run, delay)
}

function LoginPrefetch() {
  useEffect(() => {
    prefetchAfterIdle([
      () => import('./pages/DashboardPage'),
      () => import('./pages/IdeasPage'),
      () => import('./pages/ChatPage'),
    ])
  }, [])
  return null
}

function AppPrefetch() {
  useEffect(() => {
    prefetchAfterIdle([
      () => import('./pages/ResearchPage'),
      () => import('./pages/PlannerPage'),
      () => import('./pages/ProjectsPage'),
      () => import('./pages/ContentPage'),
      () => import('./pages/CRMPage'),
      () => import('./pages/SocialPage'),
      () => import('./pages/FinancePage'),
      () => import('./pages/SeoPage'),
      () => import('./pages/JourneyPage'),
      () => import('./pages/KnowledgePage'),
      () => import('./pages/SettingsPage'),
      () => import('./pages/WordPressPage'),
      () => import('./pages/InvestorPage'),
    ])
  }, [])
  return null
}

function PageFallback() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-brand-600/20 flex items-center justify-center animate-pulse">
          <div className="w-4 h-4 rounded bg-brand-500/60" />
        </div>
        <div className="text-xs text-slate-600">Loading...</div>
      </div>
    </div>
  )
}

// G+X go-to shortcuts map
const GO_TO_ROUTES: Record<string, string> = {
  d: '/', a: '/chat', i: '/ideas', f: '/finance',
  c: '/crm', p: '/projects', r: '/research', s: '/seo',
  n: '/content', j: '/journey', v: '/investor',
}

function AuthenticatedApp() {
  const navigate = useNavigate()
  const [cmdOpen, setCmdOpen]           = useState(false)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(
    () => !localStorage.getItem('of_onboarded')
  )
  const gKeyRef = useRef(false)
  const gTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      const typing = tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement)?.isContentEditable

      // ⌘K — command palette
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setCmdOpen(o => !o)
        return
      }

      if (typing) return

      // ? — shortcuts modal
      if (e.key === '?') { setShortcutsOpen(o => !o); return }

      // G+X go-to navigation
      if (e.key.toLowerCase() === 'g' && !e.metaKey && !e.ctrlKey) {
        gKeyRef.current = true
        if (gTimerRef.current) clearTimeout(gTimerRef.current)
        gTimerRef.current = setTimeout(() => { gKeyRef.current = false }, 1200)
        return
      }
      if (gKeyRef.current) {
        const route = GO_TO_ROUTES[e.key.toLowerCase()]
        if (route) { navigate(route); gKeyRef.current = false }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [navigate])

  const handleOnboardingComplete = (data: any) => {
    localStorage.setItem('of_onboarded', 'true')
    localStorage.setItem('of_profile', JSON.stringify(data))
    setShowOnboarding(false)
  }

  return (
    <>
      {showOnboarding && <OnboardingModal onComplete={handleOnboardingComplete} />}
      <ShortcutsModal open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} />
      <FloatingAI />

      <AppShell onCmdK={() => setCmdOpen(true)} onShortcuts={() => setShortcutsOpen(true)}>
        <AppPrefetch />
        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route path="/"          element={<DashboardPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/ideas"     element={<IdeasPage />} />
            <Route path="/research"  element={<ResearchPage />} />
            <Route path="/planner"   element={<PlannerPage />} />
            <Route path="/projects"  element={<ProjectsPage />} />
            <Route path="/content"   element={<ContentPage />} />
            <Route path="/crm"       element={<CRMPage />} />
            <Route path="/chat"      element={<ChatPage />} />
            <Route path="/knowledge" element={<KnowledgePage />} />
            <Route path="/settings"  element={<SettingsPage />} />
            <Route path="/social"    element={<SocialPage />} />
            <Route path="/finance"   element={<FinancePage />} />
            <Route path="/seo"       element={<SeoPage />} />
            <Route path="/journey"   element={<JourneyPage />} />
            <Route path="/wordpress" element={<WordPressPage />} />
            <Route path="/investor"  element={<InvestorPage />} />
            <Route path="*"          element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </AppShell>
    </>
  )
}

export default function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: '#060b18' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-brand-600 flex items-center justify-center text-2xl animate-pulse">🚀</div>
          <div className="text-slate-500 text-sm">Loading OneFounder...</div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <>
        <LoginPrefetch />
        <LoginPage onSuccess={() => window.location.reload()} />
      </>
    )
  }

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <ToastProvider>
          <ErrorBoundary>
            <AuthenticatedApp />
          </ErrorBoundary>
        </ToastProvider>
      </BrowserRouter>
    </ErrorBoundary>
  )
}
