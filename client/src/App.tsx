import { lazy, Suspense, useEffect, useState, useRef } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { AnimatedPage } from './components/layout/AnimatedPage'
import { useAuth } from './hooks/useAuth'
import { useOllamaStatus } from './hooks/useOllamaStatus'
import { ParticleField } from './components/ui/ParticleField'
import { LoginPage } from './pages/LoginPage'
import { AppShell } from './components/layout/AppShell'
import { CommandPalette } from './components/CommandPalette'
import { FloatingAI } from './components/FloatingAI'
import { ShortcutsModal } from './components/ShortcutsModal'
import { ToastProvider } from './components/ui/ToastProvider'
import { ErrorBoundary } from './components/ErrorBoundary'
import { SetupPage } from './pages/SetupPage'
import { PWAInstall } from './components/PWAInstall'

const DashboardPage  = lazy(() => import('./pages/DashboardPage').then(m => ({ default: m.DashboardPage })))
const MemoryPage     = lazy(() => import('./pages/MemoryPage').then(m => ({ default: m.MemoryPage })))
const TasksPage      = lazy(() => import('./pages/TasksPage').then(m => ({ default: m.TasksPage })))
const AgentPage      = lazy(() => import('./pages/AgentPage').then(m => ({ default: m.AgentPage })))
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
const AdminPage      = lazy(() => import('./pages/AdminPage').then(m => ({ default: m.AdminPage })))

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
      () => import('./pages/MemoryPage'),
      () => import('./pages/TasksPage'),
      () => import('./pages/AgentPage'),
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

function AnimatedRoutes() {
  const location = useLocation()
  return (
    <Routes location={location} key={location.pathname}>
      <Route path="/"          element={<AnimatedPage><DashboardPage /></AnimatedPage>} />
      <Route path="/dashboard" element={<AnimatedPage><DashboardPage /></AnimatedPage>} />
      <Route path="/ideas"     element={<AnimatedPage><IdeasPage /></AnimatedPage>} />
      <Route path="/research"  element={<AnimatedPage><ResearchPage /></AnimatedPage>} />
      <Route path="/planner"   element={<AnimatedPage><PlannerPage /></AnimatedPage>} />
      <Route path="/projects"  element={<AnimatedPage><ProjectsPage /></AnimatedPage>} />
      <Route path="/content"   element={<AnimatedPage><ContentPage /></AnimatedPage>} />
      <Route path="/crm"       element={<AnimatedPage><CRMPage /></AnimatedPage>} />
      <Route path="/chat"      element={<AnimatedPage><ChatPage /></AnimatedPage>} />
      <Route path="/knowledge" element={<AnimatedPage><KnowledgePage /></AnimatedPage>} />
      <Route path="/settings"  element={<AnimatedPage><SettingsPage /></AnimatedPage>} />
      <Route path="/social"    element={<AnimatedPage><SocialPage /></AnimatedPage>} />
      <Route path="/finance"   element={<AnimatedPage><FinancePage /></AnimatedPage>} />
      <Route path="/seo"       element={<AnimatedPage><SeoPage /></AnimatedPage>} />
      <Route path="/journey"   element={<AnimatedPage><JourneyPage /></AnimatedPage>} />
      <Route path="/wordpress" element={<AnimatedPage><WordPressPage /></AnimatedPage>} />
      <Route path="/investor"  element={<AnimatedPage><InvestorPage /></AnimatedPage>} />
      <Route path="/memory"    element={<AnimatedPage><MemoryPage /></AnimatedPage>} />
      <Route path="/tasks"     element={<AnimatedPage><TasksPage /></AnimatedPage>} />
      <Route path="/agents"    element={<AnimatedPage><AgentPage /></AnimatedPage>} />
      <Route path="/admin"     element={<AnimatedPage><AdminPage /></AnimatedPage>} />
      <Route path="*"          element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function AuthenticatedApp() {
  const navigate = useNavigate()
  const [cmdOpen, setCmdOpen]             = useState(false)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const { online: ollamaOnline } = useOllamaStatus()
  const gKeyRef  = useRef(false)
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

  return (
    <>
      <ShortcutsModal open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} />
      <FloatingAI />
      <PWAInstall />

      <AppShell onCmdK={() => setCmdOpen(true)} onShortcuts={() => setShortcutsOpen(true)}>
        <AppPrefetch />
        {/* Ollama offline banner — 3D glass */}
        {!ollamaOnline && ollamaOnline !== null && (
          <div className="mb-4 flex items-center gap-3 px-4 py-3 rounded-xl bg-yellow-500/5 border border-yellow-500/15 text-xs animate-slide-down"
            style={{ boxShadow: '0 4px 16px rgba(245,158,11,0.08), inset 0 1px 0 rgba(255,255,255,0.04)' }}>
            <span className="text-yellow-400 flex-shrink-0 text-base">⚠️</span>
            <span className="text-yellow-300/70 flex-1">
              Ollama is offline — AI features unavailable.
              Run: <code className="font-mono bg-black/30 px-1.5 py-0.5 rounded text-yellow-300/90">ollama serve</code>
            </span>
            <button
              onClick={() => navigate('/settings')}
              className="text-yellow-400 hover:text-yellow-300 transition-colors underline underline-offset-2 flex-shrink-0 font-medium"
            >
              Setup →
            </button>
          </div>
        )}
        <Suspense fallback={<PageFallback />}>
          <AnimatedRoutes />
        </Suspense>
      </AppShell>
    </>
  )
}

export default function App() {
  const { user, loading, refresh } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen relative" style={{ backgroundColor: '#060b18' }}>
        {/* Ambient orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-brand-500/10 blur-[80px] animate-float" />
          <div className="absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full bg-violet-500/8 blur-[60px] animate-float" style={{ animationDelay: '1s' }} />
        </div>
        <div className="flex flex-col items-center gap-5 relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center text-3xl shadow-lg shadow-brand-500/30 animate-pulse-glow">
            🚀
          </div>
          <div className="flex flex-col items-center gap-1.5">
            <div className="text-white font-bold text-lg tracking-tight">OneFounder</div>
            <div className="text-slate-500 text-xs">Loading your workspace...</div>
          </div>
          <div className="w-32 h-1 rounded-full bg-white/5 overflow-hidden">
            <div className="h-full w-1/2 rounded-full bg-gradient-to-r from-brand-500 to-violet-500 animate-shimmer" />
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="relative">
        <ParticleField particleCount={50} color="99,102,241" speed={0.2} connectDistance={100} />
        <LoginPrefetch />
        <LoginPage onSuccess={() => window.location.reload()} />
      </div>
    )
  }

  // Mandatory first-run setup — must complete AI configuration before entering
  if (!user.onboardingCompleted) {
    return (
      <ErrorBoundary>
        <SetupPage onComplete={async () => { await refresh(); window.location.replace('/') }} />
      </ErrorBoundary>
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
