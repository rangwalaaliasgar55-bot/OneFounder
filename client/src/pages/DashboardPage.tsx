import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { api } from '../lib/api'
import { useAuth } from '../hooks/useAuth'
import { PageLoader, LoadingSpinner } from '../components/ui/LoadingSpinner'
import { useReducedMotion } from '../motion/scroll'
import { StatCard3D } from '../components/ui/StatCard3D'
import { ProgressRing3D } from '../components/ui/ProgressRing3D'
import { AnimatedCounter } from '../components/ui/AnimatedCounter'
import { SkeletonDashboard } from '../components/ui/Skeleton'
import { AnimatedGradientText } from '../components/ui/AnimatedGradientText'
import { TiltCard } from '../components/ui/TiltCard'
import { Confetti, useConfetti } from '../components/ui/Confetti'
import { MeshGradient } from '../components/ui/MeshGradient'

interface OllamaStatus {
  running: boolean
  models: string[]
  totalRamGb: number
  freeRamGb: number
  ramWarning: string | null
  version?: string
}

function AIStatusWidget({ selectedModel }: { selectedModel?: string }) {
  const [status, setStatus] = useState<OllamaStatus | null>(null)
  const [lastCheck, setLastCheck] = useState<Date | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const check = async () => {
    try {
      const h = await api.get<OllamaStatus>('/ollama/health')
      setStatus(h)
    } catch {
      setStatus({ running: false, models: [], totalRamGb: 0, freeRamGb: 0, ramWarning: null })
    }
    setLastCheck(new Date())
  }

  useEffect(() => {
    check()
    timerRef.current = setInterval(check, 30_000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [])

  const online = status?.running && (status?.models?.length ?? 0) > 0
  const activeModel = selectedModel || status?.models?.[0] || '—'
  const ramPct = status?.totalRamGb ? Math.round((1 - status.freeRamGb / status.totalRamGb) * 100) : 0

  return (
    <div className={`card border ${online ? 'border-green-500/15' : 'border-yellow-500/15'}`}>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-white flex items-center gap-2">
          🤖 AI Engine
          <span className={`inline-flex w-2 h-2 rounded-full ${online ? 'bg-green-400 animate-pulse' : 'bg-yellow-400'}`} />
        </h2>
        <div className="flex items-center gap-2">
          {lastCheck && (
            <span className="text-xs text-slate-600" title={lastCheck.toLocaleTimeString()}>
              {lastCheck.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          <button onClick={check} className="text-xs text-slate-600 hover:text-slate-400 transition-colors" title="Refresh">↻</button>
        </div>
      </div>

      {!status ? (
        <div className="text-xs text-slate-600 py-2">Checking...</div>
      ) : (
        <div className="space-y-2.5">
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
              <div className="text-xs text-slate-600 mb-0.5">Status</div>
              <div className={`text-xs font-semibold ${online ? 'text-green-400' : 'text-yellow-400'}`}>
                {online ? '● Online' : '○ Offline'}
              </div>
            </div>
            <div className="p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
              <div className="text-xs text-slate-600 mb-0.5">Active model</div>
              <div className="text-xs font-semibold text-white truncate">{activeModel}</div>
            </div>
          </div>

          {status.totalRamGb > 0 && (
            <div className="p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
              <div className="flex justify-between text-xs text-slate-600 mb-1">
                <span>RAM usage</span>
                <span>{status.freeRamGb} GB free / {status.totalRamGb} GB</span>
              </div>
              <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${ramPct > 80 ? 'bg-red-500' : ramPct > 60 ? 'bg-yellow-500' : 'bg-green-500'}`}
                  style={{ width: `${Math.min(ramPct, 100)}%` }}
                />
              </div>
            </div>
          )}

          {status.models.length > 0 && (
            <div>
              <div className="text-xs text-slate-600 mb-1">Installed models</div>
              <div className="flex flex-wrap gap-1">
                {status.models.map(m => (
                  <span key={m} className={`text-xs px-1.5 py-0.5 rounded ${m === activeModel ? 'bg-brand-500/15 text-brand-400 border border-brand-500/20' : 'bg-white/[0.04] text-slate-500'}`}>
                    {m}
                  </span>
                ))}
              </div>
            </div>
          )}

          {!online && (
            <div className="text-xs text-yellow-400/70 bg-yellow-500/5 border border-yellow-500/10 rounded-lg px-2.5 py-2">
              Run <code className="font-mono bg-black/20 px-1 rounded">ollama serve</code> to enable AI features
            </div>
          )}

          <div className="text-xs text-slate-700 pt-0.5">
            🔒 Local inference · No cloud · ₹0/month · Refreshes every 30s
          </div>
        </div>
      )}
    </div>
  )
}

interface Stats {
  ideas: number
  projects: number
  tasks: number
  leads: number
  content: number
  reports: number
  plans: number
}

interface DashboardData {
  stats: Stats
  recent: {
    ideas: any[]
    tasks: any[]
    leads: any[]
  }
}

interface MorningInsight {
  topOpportunity: string
  biggestProblem: string
  recommendedAction: string
}

const STATUS_COLORS: Record<string, string> = {
  todo: 'bg-slate-500/20 text-slate-400',
  in_progress: 'bg-blue-500/20 text-blue-400',
  done: 'bg-green-500/20 text-green-400',
  lead: 'bg-slate-500/20 text-slate-300',
  qualified: 'bg-brand-500/20 text-brand-400',
  won: 'bg-green-500/20 text-green-400',
  lost: 'bg-red-500/20 text-red-400',
}

function ScoreRing({ score, size = 80 }: { score: number; size?: number }) {
  const r = (size / 2) - 8
  const circ = 2 * Math.PI * r
  const offset = circ - (score / 100) * circ
  const color = score >= 70 ? '#22c55e' : score >= 45 ? '#f59e0b' : '#ef4444'
  return (
    <svg width={size} height={size} className="rotate-[-90deg]">
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={6} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={6}
        strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 1s ease' }} />
    </svg>
  )
}

function ScoreBar({ score }: { score: number }) {
  const color = score >= 70 ? 'bg-emerald-500' : score >= 45 ? 'bg-amber-500' : 'bg-red-500'
  return (
    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden w-full">
      <div className={`h-full ${color} rounded-full transition-all duration-700`} style={{ width: `${score}%` }} />
    </div>
  )
}

export function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [aiStatus, setAiStatus] = useState<{ available: boolean; provider: string; models?: string[] } | null>(null)

  const [healthScore, setHealthScore] = useState<any | null>(null)
  const [scoreLoading, setScoreLoading] = useState(false)

  const [brief, setBrief] = useState<any | null>(null)
  const [briefLoading, setBriefLoading] = useState(false)
  const [showBrief, setShowBrief] = useState(false)
  const reducedMotion = useReducedMotion()

  const [morningInsights, setMorningInsights] = useState<MorningInsight | null>(null)
  const [morningLoading, setMorningLoading] = useState(false)
  const { active: confettiActive, celebrate } = useConfetti()

  useEffect(() => {
    Promise.all([
      api.get<DashboardData>('/dashboard/stats'),
      api.get<any>('/ai/status'),
    ]).then(([dashboard, ai]) => {
      setData(dashboard)
      setAiStatus(ai)
    }).catch(console.error).finally(() => setLoading(false))
  }, [])

  const loadHealthScore = async () => {
    if (healthScore) return
    setScoreLoading(true)
    try {
      const score = await api.get<any>('/ceo/health-score')
      setHealthScore(score)
    } catch {} finally { setScoreLoading(false) }
  }

  const generateBrief = async () => {
    setBriefLoading(true)
    setShowBrief(true)
    try {
      const b = await api.post<any>('/ceo/brief', {})
      setBrief(b)
    } catch {} finally { setBriefLoading(false) }
  }

  const loadMorningInsights = async () => {
    setMorningLoading(true)
    try {
      const score = await api.get<any>('/ceo/health-score')
      const dims = score.dimensions || []
      const sorted = [...dims].sort((a: any, b: any) => a.score - b.score)
      const weakest = sorted[0]
      const strongest = sorted[dims.length - 1]
      setMorningInsights({
        topOpportunity: strongest ? `${strongest.icon} ${strongest.label}: ${strongest.insight}` : 'Start tracking your business metrics',
        biggestProblem: weakest ? `${weakest.icon} ${weakest.label} (${weakest.score}/100): ${weakest.insight}` : 'No issues detected yet',
        recommendedAction: score.overall < 50
          ? `Focus on ${weakest?.label?.toLowerCase() || 'growth'} — it will have the biggest impact on your score`
          : `Your business health is ${score.overall}/100. Keep building on your ${strongest?.label?.toLowerCase() || 'strengths'}`,
      })
    } catch {} finally { setMorningLoading(false) }
  }

  useEffect(() => { loadHealthScore() }, [])

  if (loading) return <SkeletonDashboard />

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 18) return 'Good afternoon'
    return 'Good evening'
  }

  const statCards = [
    { label: 'Business Ideas', value: data?.stats.ideas ?? 0, icon: '💡', page: '/ideas', color: 'brand' as const },
    { label: 'Active Projects', value: data?.stats.projects ?? 0, icon: '🎯', page: '/projects', color: 'violet' as const },
    { label: 'Open Tasks', value: data?.stats.tasks ?? 0, icon: '✅', page: '/projects', color: 'emerald' as const },
    { label: 'CRM Leads', value: data?.stats.leads ?? 0, icon: '👥', page: '/crm', color: 'orange' as const },
    { label: 'Content Pieces', value: data?.stats.content ?? 0, icon: '✍️', page: '/content', color: 'pink' as const },
    { label: 'Research Reports', value: data?.stats.reports ?? 0, icon: '🔍', page: '/research', color: 'cyan' as const },
    { label: 'Business Plans', value: data?.stats.plans ?? 0, icon: '📋', page: '/planner', color: 'amber' as const },
  ]

  const quickActions = [
    { icon: '💡', label: 'Generate Ideas', desc: 'Discover startup opportunities', page: '/ideas' },
    { icon: '🔍', label: 'Research Market', desc: 'Analyze competitors & trends', page: '/research' },
    { icon: '📋', label: 'Create Business Plan', desc: 'Full plan with AI', page: '/planner' },
    { icon: '🤖', label: 'Chat with AI Agent', desc: 'CEO, Marketing, Sales agents', page: '/chat' },
    { icon: '✍️', label: 'Generate Content', desc: 'Blog, LinkedIn, newsletters', page: '/content' },
    { icon: '🗺️', label: 'Founder Journey', desc: 'Track your startup milestones', page: '/journey' },
  ]

  const urgencyColor = (u: string) => u === 'high' ? 'text-red-400' : u === 'medium' ? 'text-amber-400' : 'text-emerald-400'
  const urgencyBg = (u: string) => u === 'high' ? 'bg-red-500/10 border-red-500/20' : u === 'medium' ? 'bg-amber-500/10 border-amber-500/20' : 'bg-emerald-500/10 border-emerald-500/20'

  const providerLabel = aiStatus?.available
    ? `🧠 AI Online (${aiStatus.models?.[0] || 'Ollama'})`
    : 'Demo Mode'

  return (
    <div className="p-6 max-w-7xl mx-auto relative">
      <MeshGradient />
      <Confetti active={confettiActive} />

      {/* Morning Briefing Card — 3D glass */}
      <motion.div
        className="mb-6 card-3d border-brand-500/20 bg-gradient-to-br from-brand-600/10 to-violet-600/5"
        initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      >
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">
              {greeting()}, <AnimatedGradientText className="font-bold">{user?.name?.split(' ')[0] || 'Founder'}</AnimatedGradientText> 👋
            </h1>
            <p className="text-slate-400 text-sm mt-0.5">Here's your business snapshot for today.</p>
          </div>
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
              aiStatus?.available
                ? 'bg-green-500/10 border border-green-500/20 text-green-400'
                : 'bg-yellow-500/10 border border-yellow-500/20 text-yellow-400'
            }`}>
              <div className={`w-1.5 h-1.5 rounded-full ${aiStatus?.available ? 'bg-green-400' : 'bg-yellow-400'} animate-pulse`} />
              {providerLabel}
            </div>
            <button
              onClick={loadMorningInsights}
              disabled={morningLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-brand-600/20 border border-brand-500/20 text-brand-300 hover:bg-brand-600/30 transition-all"
            >
              {morningLoading ? <LoadingSpinner size="sm" /> : '↻'} Refresh
            </button>
          </div>
        </div>

        {morningLoading ? (
          <div className="mt-4 flex items-center gap-2 text-slate-400 text-sm">
            <LoadingSpinner size="sm" /> Analyzing your business...
          </div>
        ) : morningInsights ? (
          <div className="mt-4 grid sm:grid-cols-3 gap-3">
            <div className="glass rounded-xl p-3 border border-emerald-500/15">
              <div className="text-xs font-semibold text-emerald-400 mb-1">💡 Top Opportunity</div>
              <p className="text-xs text-slate-300 leading-relaxed">{morningInsights.topOpportunity}</p>
            </div>
            <div className="glass rounded-xl p-3 border border-red-500/15">
              <div className="text-xs font-semibold text-red-400 mb-1">⚠️ Biggest Problem</div>
              <p className="text-xs text-slate-300 leading-relaxed">{morningInsights.biggestProblem}</p>
            </div>
            <div className="glass rounded-xl p-3 border border-brand-500/15">
              <div className="text-xs font-semibold text-brand-400 mb-1">🎯 Today's Action</div>
              <p className="text-xs text-slate-300 leading-relaxed">{morningInsights.recommendedAction}</p>
            </div>
          </div>
        ) : (
          <button onClick={loadMorningInsights} className="mt-4 text-sm text-brand-400 hover:text-brand-300 flex items-center gap-1">
            ✨ Generate morning insights →
          </button>
        )}
      </motion.div>

      {!aiStatus?.available && (
        <div className="mb-6 glass border border-yellow-500/20 rounded-xl p-4 flex items-start gap-3">
          <span className="text-yellow-400 text-lg">⚠️</span>
          <div>
            <p className="text-yellow-400 text-sm font-medium">AI in Demo Mode</p>
            <p className="text-slate-400 text-xs mt-0.5">
              Install <a href="https://ollama.ai" target="_blank" rel="noreferrer" className="text-brand-400 underline">Ollama</a> and run{' '}
              <code className="bg-white/10 px-1 rounded text-xs">ollama serve</code> then{' '}
              <code className="bg-white/10 px-1 rounded text-xs">ollama pull llama3.2</code> to enable the full AI Brain.
            </p>
          </div>
        </div>
      )}

      {/* Stats row — 3D animated cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3 mb-8">
        {statCards.map((card, i) => (
          <StatCard3D
            key={card.label}
            label={card.label}
            value={card.value}
            icon={card.icon}
            page={card.page}
            color={card.color}
            delay={i * 60}
          />
        ))}
      </div>

      {/* Business Health Score + CEO Brief row */}
      <div className="grid lg:grid-cols-5 gap-6 mb-6">
        <TiltCard className="lg:col-span-2 card-3d">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-white">🏥 Business Health Score</h2>
            {healthScore && (
              <button onClick={() => { setHealthScore(null); setTimeout(loadHealthScore, 100) }}
                className="text-xs text-slate-500 hover:text-slate-400">Refresh</button>
            )}
          </div>

          {scoreLoading ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : healthScore ? (
            <div>
              <div className="flex items-center gap-5 mb-5">
                <div className="relative flex-shrink-0">
                  <ProgressRing3D
                    value={healthScore.overall}
                    size={88}
                    strokeWidth={7}
                    color={healthScore.overall >= 70 ? '#22c55e' : healthScore.overall >= 45 ? '#f59e0b' : '#ef4444'}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-semibold mb-1 ${
                    healthScore.overall >= 70 ? 'text-emerald-400' : healthScore.overall >= 45 ? 'text-amber-400' : 'text-red-400'
                  }`}>
                    {healthScore.overall >= 70 ? '🟢 Strong' : healthScore.overall >= 45 ? '🟡 Growing' : '🔴 Early Stage'}
                  </div>
                  {healthScore.explanation && (
                    <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">{healthScore.explanation}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2.5">
                {healthScore.dimensions?.map((d: any) => (
                  <div key={d.key}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-slate-400">{d.icon} {d.label}</span>
                      <span className={`text-xs font-medium ${d.score >= 70 ? 'text-emerald-400' : d.score >= 40 ? 'text-amber-400' : 'text-red-400'}`}>{d.score}</span>
                    </div>
                    <ScoreBar score={d.score} />
                    <div className="text-xs text-slate-600 mt-0.5 truncate">{d.insight}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <button onClick={loadHealthScore} className="btn-primary w-full">Calculate Health Score</button>
          )}
        </TiltCard>

        {/* AI CEO Brief — 3D glass */}
        <div className="lg:col-span-3 card-3d bg-gradient-to-br from-brand-600/5 to-violet-600/5 border-brand-500/10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-white">🤖 AI CEO Daily Brief</h2>
            {brief && (
              <button onClick={generateBrief} className="text-xs text-slate-500 hover:text-slate-400 flex items-center gap-1">
                {briefLoading ? <LoadingSpinner size="sm" /> : '↻'} Regenerate
              </button>
            )}
          </div>

          {!showBrief ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="text-4xl mb-3">🚀</div>
              <h3 className="text-sm font-semibold text-white mb-1">Your AI Executive Assistant</h3>
              <p className="text-xs text-slate-400 mb-4 max-w-sm">Get today's priorities, biggest risks, top opportunities, and focus tasks — all tailored to your business.</p>
              <button onClick={generateBrief} className="btn-primary">
                Generate Today's Brief
              </button>
            </div>
          ) : briefLoading ? (
            <div className="flex flex-col items-center gap-3 py-8">
              <LoadingSpinner />
              <p className="text-sm text-slate-400">AI CEO is reviewing your business...</p>
            </div>
          ) : brief ? (
            <div className="space-y-4 overflow-y-auto max-h-[380px] pr-1">
              {brief.greeting && (
                <p className="text-sm text-slate-300 italic border-l-2 border-brand-500/50 pl-3">{brief.greeting}</p>
              )}

              {brief.topPriorities && brief.topPriorities.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">🎯 Top Priorities</h4>
                  <div className="space-y-2">
                    {brief.topPriorities.map((p: any, i: number) => (
                      <div key={i} className={`flex items-start gap-2 p-2.5 rounded-lg border ${urgencyBg(p.urgency)}`}>
                        <span className={`text-xs font-bold mt-0.5 ${urgencyColor(p.urgency)}`}>{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium text-white">{p.title}</div>
                          {p.description && <div className="text-xs text-slate-500 mt-0.5">{p.description}</div>}
                        </div>
                        {p.timeEstimate && <span className="text-xs text-slate-600 flex-shrink-0">{p.timeEstimate}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {brief.biggestRisks && brief.biggestRisks.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">⚠️ Risks to Watch</h4>
                  <div className="space-y-2">
                    {brief.biggestRisks.map((r: any, i: number) => (
                      <div key={i} className="p-2.5 rounded-lg bg-red-500/5 border border-red-500/10">
                        <div className="text-xs font-medium text-red-400">{r.risk}</div>
                        {r.mitigation && <div className="text-xs text-slate-500 mt-0.5">→ {r.mitigation}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {brief.opportunities && brief.opportunities.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">💡 Opportunities</h4>
                  <div className="space-y-2">
                    {brief.opportunities.map((o: any, i: number) => (
                      <div key={i} className="p-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                        <div className="text-xs font-medium text-emerald-400">{o.opportunity}</div>
                        {o.action && <div className="text-xs text-slate-500 mt-0.5">→ {o.action}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {brief.focusTasks && brief.focusTasks.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">📌 Focus Tasks</h4>
                  <div className="space-y-1.5">
                    {brief.focusTasks.map((t: any, i: number) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className="text-brand-400 text-xs mt-0.5">→</span>
                        <div className="flex-1 min-w-0">
                          <span className="text-xs text-white">{t.task}</span>
                          {t.why && <span className="text-xs text-slate-600"> · {t.why}</span>}
                        </div>
                        {t.module && (
                          <button
                            onClick={() => navigate(`/${t.module}`)}
                            className="text-xs text-brand-400 hover:text-brand-300 flex-shrink-0 underline"
                          >
                            Open →
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {brief.quote && (
                <div className="border-t border-white/5 pt-3">
                  <p className="text-xs text-slate-600 italic">"{brief.quote}"</p>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>

      {/* Main content grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card-3d">
            <h2 className="text-base font-semibold text-white mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {quickActions.map((action, i) => (
                <motion.button
                  key={action.label}
                  onClick={() => navigate(action.page)}
                  className="card-hover text-left"
                  initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
                  whileInView={reducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06, duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                  whileHover={reducedMotion ? {} : { y: -2 }}
                >
                  <div className="text-2xl mb-2">{action.icon}</div>
                  <div className="text-sm font-semibold text-white">{action.label}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{action.desc}</div>
                </motion.button>
              ))}
            </div>
          </div>

          {data?.recent.ideas && data.recent.ideas.length > 0 && (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-white">Recent Ideas</h2>
                <button onClick={() => navigate('/ideas')} className="text-xs text-brand-400 hover:text-brand-300">View all →</button>
              </div>
              <div className="space-y-2">
                {data.recent.ideas.slice(0, 4).map((idea: any) => (
                  <div key={idea.id} className="flex items-center gap-3 p-3 rounded-lg bg-white/3 hover:bg-white/5 transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-brand-600/20 flex items-center justify-center text-sm flex-shrink-0">💡</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white truncate">{idea.title}</div>
                      <div className="text-xs text-slate-500">{idea.type} · {idea.difficulty && `Difficulty: ${idea.difficulty}/10`}</div>
                    </div>
                    <span className={`badge ${STATUS_COLORS[idea.status] || 'bg-slate-500/20 text-slate-400'}`}>
                      {idea.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          {data?.recent.tasks && data.recent.tasks.length > 0 && (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-white">Recent Tasks</h2>
                <button onClick={() => navigate('/projects')} className="text-xs text-brand-400 hover:text-brand-300">View all →</button>
              </div>
              <div className="space-y-2">
                {data.recent.tasks.slice(0, 5).map((task: any) => (
                  <div key={task.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/5 transition-colors">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${task.status === 'done' ? 'bg-green-400' : task.status === 'in_progress' ? 'bg-blue-400' : 'bg-slate-500'}`} />
                    <span className={`text-sm flex-1 truncate ${task.status === 'done' ? 'text-slate-500 line-through' : 'text-slate-300'}`}>
                      {task.title}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {data?.recent.leads && data.recent.leads.length > 0 && (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-white">Recent Leads</h2>
                <button onClick={() => navigate('/crm')} className="text-xs text-brand-400 hover:text-brand-300">View all →</button>
              </div>
              <div className="space-y-2">
                {data.recent.leads.slice(0, 5).map((lead: any) => (
                  <div key={lead.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/5 transition-colors">
                    <div className="w-7 h-7 rounded-full bg-brand-600/30 flex items-center justify-center text-xs font-bold text-brand-300 flex-shrink-0">
                      {lead.name[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-white truncate">{lead.name}</div>
                      <div className="text-xs text-slate-500 truncate">{lead.company || lead.email}</div>
                    </div>
                    <span className={`badge ${STATUS_COLORS[lead.status] || 'bg-slate-500/20 text-slate-400'}`}>
                      {lead.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <AIStatusWidget selectedModel={user?.selectedModel ?? undefined} />

          <div className="card bg-gradient-to-br from-brand-600/10 to-violet-600/10 border-brand-500/20">
            <div className="text-2xl mb-2">🤖</div>
            <h3 className="text-sm font-semibold text-white mb-1">Chat with your AI</h3>
            <p className="text-xs text-slate-400 mb-3">CEO Agent, Marketing, Sales — all ready to help.</p>
            <button onClick={() => navigate('/chat')} className="btn-primary text-sm py-1.5">
              Open AI Chat →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
