import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { api } from '../lib/api'
import { PageHeader } from '../components/ui/PageHeader'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'

/* ─── OG modules ─────────────────────────────────────────────────── */
const OG_MODULES = [
  { key: 'ideas',    icon: '💡', label: 'Idea Lab',          title: 'Startup Idea Lab',          description: 'AI-powered startup idea generation & validation' },
  { key: 'research', icon: '🔬', label: 'Market Research',   title: 'Market Research',            description: 'Competitor analysis & trend discovery in real-time' },
  { key: 'plans',    icon: '📋', label: 'Business Planner',  title: 'Business Planner',           description: 'Full AI-generated business plans in minutes' },
  { key: 'crm',      icon: '👥', label: 'CRM',               title: 'CRM Pipeline',               description: 'Manage leads, customers & deals in one place' },
  { key: 'content',  icon: '✍️', label: 'Content Studio',    title: 'Content Studio',             description: 'Blog posts, LinkedIn, newsletters & ad copy' },
  { key: 'seo',      icon: '🔍', label: 'SEO OS',            title: 'SEO OS',                     description: 'Keyword tracking, audits & AI content briefs' },
  { key: 'finance',  icon: '💰', label: 'Finance Tracker',   title: 'Finance Tracker',            description: 'MRR, revenue, expenses & profit tracking' },
  { key: 'chat',     icon: '🧠', label: 'AI Agents',         title: 'OneFounder AI Agents',       description: 'CEO, Marketing, Sales & Expert AI agents in one brain' },
]

const MODULES = [
  { icon: '💡', label: 'Idea Lab',         status: 'active',      desc: 'AI-powered startup idea generation' },
  { icon: '🔍', label: 'Market Research',  status: 'active',      desc: 'Competitor & trend analysis' },
  { icon: '📋', label: 'Business Planner', status: 'active',      desc: 'Full business plan generation' },
  { icon: '🎯', label: 'Projects',         status: 'active',      desc: 'Kanban boards & task tracking' },
  { icon: '✍️', label: 'Content Studio',   status: 'active',      desc: 'AI content generation' },
  { icon: '👥', label: 'CRM',              status: 'active',      desc: 'Lead & customer management' },
  { icon: '🤖', label: 'AI Agents',        status: 'active',      desc: 'CEO, Marketing, Sales agents' },
  { icon: '📚', label: 'Knowledge Base',   status: 'active',      desc: 'Document management' },
  { icon: '🌐', label: 'Website Manager',  status: 'active',      desc: 'WordPress integration & SEO' },
  { icon: '📱', label: 'Social Media',     status: 'active',      desc: 'Schedule & manage posts' },
  { icon: '💰', label: 'Finance Tracker',  status: 'active',      desc: 'Revenue, expenses, burn rate' },
  { icon: '📊', label: 'Analytics',        status: 'coming_soon', desc: 'Traffic, engagement, growth' },
  { icon: '⚡', label: 'Automations',      status: 'coming_soon', desc: 'Workflow automation engine' },
  { icon: '🛒', label: 'Marketplace',      status: 'coming_soon', desc: 'Templates & industry packs' },
  { icon: '📈', label: 'Investor Mode',    status: 'coming_soon', desc: 'Pitch decks & KPI reports' },
]

const AI_DOMAINS = [
  { key: 'code',     icon: '💻', label: 'Web Dev & Coding',     desc: 'Full-stack, APIs, architecture' },
  { key: 'seo',      icon: '🔍', label: 'SEO & Search',         desc: 'Rankings, keywords, content' },
  { key: 'security', icon: '🔒', label: 'Cybersecurity',        desc: 'OWASP, pen-test, hardening' },
  { key: 'startup',  icon: '🚀', label: 'Startup Strategy',     desc: 'GTM, fundraising, PMF' },
  { key: 'data',     icon: '📊', label: 'Data & Analytics',     desc: 'Metrics, SQL, insights' },
  { key: 'research', icon: '🔬', label: 'Market Research',      desc: 'Competitors, trends, sizing' },
  { key: 'founder',  icon: '🧠', label: 'Founder Coaching',     desc: 'Mindset, decisions, growth' },
]

const PERSONALITY_OPTIONS = [
  { value: 'tactical',   icon: '⚡', label: 'Tactical',   desc: 'Direct answers, no fluff, prioritised actions' },
  { value: 'strategic',  icon: '🎯', label: 'Strategic',  desc: 'Big-picture thinking, long-term framing' },
  { value: 'technical',  icon: '🔧', label: 'Technical',  desc: 'Deep technical detail, code-first' },
  { value: 'balanced',   icon: '⚖️', label: 'Balanced',   desc: 'Mix of strategy, data, and execution' },
]

function buildOgUrl(module: string, title: string, description: string): string {
  const base = typeof window !== 'undefined' ? window.location.origin : ''
  return `${base}/api/og?module=${encodeURIComponent(module)}&title=${encodeURIComponent(title)}&description=${encodeURIComponent(description)}`
}

type Tab = 'profile' | 'my-ai' | 'modules' | 'social' | 'account'

interface FounderProfile {
  riskTolerance: string
  workStyle: string
  primaryGoal: string
  bio: string
  industry: string
  stage: string
}

interface AIConfig {
  companyName: string
  aiPersonality: string
  activeDomains: string[]
  defaultModel: string
  promptPreviewOpen: boolean
}

const FREE_PROVIDERS_DEFAULT = [
  { id: 'ollama',     name: 'Ollama (Local)',  available: false, active: false, envKeySet: true,  note: 'Free forever. Runs models on your machine. No API key needed.',       freeSignupUrl: 'https://ollama.ai' },
  { id: 'deepseek',   name: 'DeepSeek',        available: false, active: false, envKeySet: false, note: 'Limited free quota then pay-per-token. Best reasoning. Set DEEPSEEK_API_KEY.', freeSignupUrl: 'https://platform.deepseek.com', envKey: 'DEEPSEEK_API_KEY' },
  { id: 'groq',       name: 'Groq',            available: false, active: false, envKeySet: false, note: 'Always free. Rate-limited, never charged. Llama 3.3 70B. Set GROQ_API_KEY.', freeSignupUrl: 'https://console.groq.com',      envKey: 'GROQ_API_KEY' },
  { id: 'openrouter', name: 'OpenRouter',      available: false, active: false, envKeySet: false, note: 'Free :free models — rate-limited, never charged. Set OPENROUTER_API_KEY.', freeSignupUrl: 'https://openrouter.ai',         envKey: 'OPENROUTER_API_KEY' },
]

const LS_KEY = 'onefoundr_ai_config'

function loadAIConfig(): AIConfig {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (raw) return { ...defaultAIConfig(), ...JSON.parse(raw) }
  } catch {}
  return defaultAIConfig()
}

function defaultAIConfig(): AIConfig {
  return {
    companyName: '',
    aiPersonality: 'tactical',
    activeDomains: ['code', 'seo', 'security', 'startup', 'data', 'research', 'founder'],
    defaultModel: 'llama3.2',
    promptPreviewOpen: false,
  }
}

/* ─── Main Component ──────────────────────────────────────────────── */
export function SettingsPage() {
  const { user, signOut } = useAuth()
  const [tab, setTab] = useState<Tab>('my-ai')
  const [aiStatus, setAiStatus] = useState<any>(null)
  const [profile, setProfile] = useState<FounderProfile>({
    riskTolerance: 'moderate',
    workStyle: 'builder',
    primaryGoal: 'get_first_customer',
    bio: '',
    industry: '',
    stage: 'idea',
  })
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileSaved, setProfileSaved] = useState(false)
  const [aiConfig, setAIConfig] = useState<AIConfig>(loadAIConfig())
  const [aiSaved, setAISaved] = useState(false)
  const [copiedOgKey, setCopiedOgKey] = useState<string | null>(null)
  const [activeOgModule, setActiveOgModule] = useState(OG_MODULES[0])

  const [tokenInfo, setTokenInfo] = useState<{ tokenBalance: number; tokenUsed: number; isAdmin: boolean } | null>(null)

  useEffect(() => {
    api.get<any>('/ai/status').then(setAiStatus).catch(() => {})
    api.get<any>('/ai/tokens').then(setTokenInfo).catch(() => {})
    api.get<FounderProfile | null>('/founder-profile').then(p => {
      if (p) setProfile(p)
    }).catch(() => {})
  }, [])

  const saveProfile = async () => {
    setProfileSaving(true)
    try {
      await api.put('/founder-profile', profile)
      setProfileSaved(true)
      setTimeout(() => setProfileSaved(false), 2000)
    } catch {} finally { setProfileSaving(false) }
  }

  const saveAIConfig = () => {
    const cfg = { ...aiConfig, promptPreviewOpen: false }
    localStorage.setItem(LS_KEY, JSON.stringify(cfg))
    // Also persist companyName/industry into founder profile
    if (aiConfig.companyName || profile.industry) {
      api.put('/founder-profile', {
        ...profile,
        industry: profile.industry,
        bio: aiConfig.companyName
          ? `${aiConfig.companyName}${profile.bio ? ` — ${profile.bio}` : ''}`
          : profile.bio,
      }).catch(() => {})
    }
    setAISaved(true)
    setTimeout(() => setAISaved(false), 2000)
  }

  const updateDomain = (key: string, on: boolean) => {
    setAIConfig(c => ({
      ...c,
      activeDomains: on ? [...c.activeDomains, key] : c.activeDomains.filter(d => d !== key),
    }))
  }

  const copyOgUrl = (mod: typeof OG_MODULES[0]) => {
    const url = buildOgUrl(mod.key, mod.title, mod.description)
    navigator.clipboard.writeText(url)
    setCopiedOgKey(mod.key)
    setTimeout(() => setCopiedOgKey(null), 2000)
  }

  const TABS: { id: Tab; label: string; icon: string }[] = [
    { id: 'my-ai',   label: 'My AI',    icon: '🧠' },
    { id: 'profile', label: 'Profile',  icon: '🧬' },
    { id: 'modules', label: 'Modules',  icon: '🧩' },
    { id: 'social',  label: 'Social',   icon: '🖼️' },
    { id: 'account', label: 'Account',  icon: '👤' },
  ]

  const models = aiStatus?.models || []
  const isOnline = !!aiStatus?.available

  /* ── MASTER PROMPT PREVIEW (trimmed) ────────────────────────────── */
  const promptPreview = `You are ONEFOUNDER AI — a powerful, multi-domain AI built for founders.

ACTIVE DOMAINS: ${aiConfig.activeDomains.map(d => AI_DOMAINS.find(x => x.key === d)?.label).filter(Boolean).join(' · ')}

PERSONALITY: ${PERSONALITY_OPTIONS.find(p => p.value === aiConfig.aiPersonality)?.label} — ${PERSONALITY_OPTIONS.find(p => p.value === aiConfig.aiPersonality)?.desc}

BUSINESS CONTEXT:
Company: ${aiConfig.companyName || '(not set)'}
Industry: ${profile.industry || '(not set)'}
Stage: ${profile.stage} | Goal: ${profile.primaryGoal}
${profile.bio ? `Bio: ${profile.bio}` : ''}

CORE RULES:
1. Be direct — no filler phrases or padding
2. Be specific — names, numbers, real examples, working code
3. Be opinionated — pick the best option and defend it
4. Prioritise — tell the founder what to do FIRST
5. Challenge bad ideas with clear reasoning
6. Think like an owner, not a consultant

...and 300+ lines of deep expertise across all active domains.`

  const riskOptions = [
    { value: 'conservative', label: 'Conservative', desc: 'Low risk, steady growth' },
    { value: 'moderate',     label: 'Moderate',     desc: 'Balanced approach' },
    { value: 'aggressive',   label: 'Aggressive',   desc: 'High risk, high reward' },
  ]
  const workStyleOptions = [
    { value: 'builder',   label: '🔨 Builder',   desc: 'Product & tech' },
    { value: 'marketer',  label: '📣 Marketer',  desc: 'Growth & brand' },
    { value: 'operator',  label: '⚙️ Operator',  desc: 'Systems & scale' },
  ]
  const goalOptions = [
    { value: 'get_first_customer', label: 'Get first customer' },
    { value: 'reach_10k_mrr',      label: 'Reach $10k MRR' },
    { value: 'raise_funding',      label: 'Raise funding' },
    { value: 'grow_team',          label: 'Grow team' },
  ]
  const stageOptions = [
    { value: 'idea',    label: 'Idea stage' },
    { value: 'mvp',     label: 'Building MVP' },
    { value: 'launched',label: 'Launched' },
    { value: 'growing', label: 'Growing' },
    { value: 'scaling', label: 'Scaling' },
  ]

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <PageHeader icon="⚙️" title="Settings" description="Configure your OneFounder workspace and AI" />

      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 glass rounded-xl w-fit">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
              tab === t.id
                ? 'bg-brand-600/30 text-white border border-brand-500/30'
                : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
            }`}
          >
            <span>{t.icon}</span>
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {/* ── MY AI TAB ──────────────────────────────────────────────── */}
      {tab === 'my-ai' && (
        <div className="space-y-5 animate-slide-up">

          {/* Status banner */}
          <div className={`rounded-2xl p-5 border ${isOnline
            ? 'bg-gradient-to-br from-brand-600/10 to-violet-600/5 border-brand-500/20'
            : 'bg-gradient-to-br from-yellow-600/8 to-amber-600/5 border-yellow-500/20'}`}>
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${
                isOnline ? 'bg-brand-600/20 animate-pulse-glow' : 'bg-yellow-500/10'}`}>
                🧠
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <h2 className="text-base font-bold text-white">OneFounder AI</h2>
                  <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${
                    isOnline
                      ? 'bg-green-500/15 text-green-400 border border-green-500/20'
                      : 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/20'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-green-400' : 'bg-yellow-400'} animate-pulse`} />
                    {isOnline ? 'Online' : 'Demo mode'}
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  {isOnline
                    ? `Active: ${aiStatus?.provider || 'AI'} · ${models.length > 0 ? `${models.length} model${models.length !== 1 ? 's' : ''} loaded` : 'Ready'}`
                    : 'Add a free API key below or install Ollama to enable AI'}
                </p>
                {isOnline && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {['Auto-routing', 'Prompt enhancement', 'Web search', 'Memory', 'Founder context'].map(f => (
                      <span key={f} className="text-xs bg-white/5 border border-white/8 text-slate-400 px-2 py-0.5 rounded-full">{f}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Token Balance */}
          {tokenInfo && (
            <div className={`rounded-2xl p-4 border flex items-center gap-4 ${
              tokenInfo.isAdmin
                ? 'bg-amber-500/5 border-amber-500/15'
                : tokenInfo.tokenBalance <= 0
                  ? 'bg-red-500/8 border-red-500/20'
                  : tokenInfo.tokenBalance <= 20
                    ? 'bg-yellow-500/8 border-yellow-500/20'
                    : 'bg-white/[0.03] border-white/[0.06]'
            }`}>
              <div className="text-2xl flex-shrink-0">🪙</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-white">AI Tokens</span>
                  {tokenInfo.isAdmin && (
                    <span className="text-xs bg-amber-500/15 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded-full">Admin — unlimited</span>
                  )}
                  {!tokenInfo.isAdmin && tokenInfo.tokenBalance <= 0 && (
                    <span className="text-xs bg-red-500/15 text-red-400 px-1.5 py-0.5 rounded-full">Out of tokens</span>
                  )}
                  {!tokenInfo.isAdmin && tokenInfo.tokenBalance > 0 && tokenInfo.tokenBalance <= 20 && (
                    <span className="text-xs bg-yellow-500/15 text-yellow-400 px-1.5 py-0.5 rounded-full">Running low</span>
                  )}
                </div>
                {!tokenInfo.isAdmin && (
                  <p className="text-xs text-slate-500 mt-0.5">
                    <span className={`font-mono font-bold text-sm mr-1 ${
                      tokenInfo.tokenBalance <= 0 ? 'text-red-400' : tokenInfo.tokenBalance <= 20 ? 'text-yellow-400' : 'text-green-400'
                    }`}>{tokenInfo.tokenBalance}</span>
                    remaining · <span className="text-slate-600">{tokenInfo.tokenUsed} used total</span>
                    {tokenInfo.tokenBalance <= 20 && tokenInfo.tokenBalance > 0 && ' · Contact admin for more'}
                    {tokenInfo.tokenBalance <= 0 && ' · Contact admin to get more tokens'}
                  </p>
                )}
                {tokenInfo.isAdmin && (
                  <p className="text-xs text-slate-500 mt-0.5">Admins have unlimited AI access. Manage user tokens in the <a href="/admin" className="text-amber-400 hover:underline">Admin Panel</a>.</p>
                )}
              </div>
            </div>
          )}

          {/* Free AI Providers */}
          <div className="card">
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-white">🤖 Free AI Providers</h3>
              <p className="text-xs text-slate-500 mt-0.5">All free. OneFounder tries them in order: Ollama → DeepSeek → Groq → Together AI → OpenRouter. First available wins.</p>
            </div>
            <div className="space-y-2">
              {(aiStatus?.providers || FREE_PROVIDERS_DEFAULT).map((p: any) => {
                const isActive = p.active && p.available
                const isAvail = p.available
                const hasKey = p.envKeySet
                return (
                  <div key={p.id} className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${
                    isActive ? 'border-brand-500/30 bg-brand-600/8' : isAvail ? 'border-green-500/20 bg-green-500/5' : 'border-white/5 bg-white/2'
                  }`}>
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm flex-shrink-0 mt-0.5 ${
                      isActive ? 'bg-brand-500/20' : isAvail ? 'bg-green-500/15' : 'bg-white/5'
                    }`}>
                      {isActive ? '⚡' : isAvail ? '✓' : p.id === 'ollama' ? '💻' : '🔑'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold text-white">{p.name}</span>
                        {isActive && <span className="text-xs bg-brand-500/20 text-brand-400 border border-brand-500/20 px-1.5 py-0.5 rounded-full">Active</span>}
                        {!isActive && isAvail && <span className="text-xs bg-green-500/15 text-green-400 px-1.5 py-0.5 rounded-full">Ready</span>}
                        {!isAvail && hasKey && <span className="text-xs bg-red-500/15 text-red-400 px-1.5 py-0.5 rounded-full">Unreachable</span>}
                        {!isAvail && !hasKey && p.id !== 'ollama' && <span className="text-xs bg-white/5 text-slate-500 px-1.5 py-0.5 rounded-full">No key set</span>}
                        {!isAvail && p.id === 'ollama' && <span className="text-xs bg-white/5 text-slate-500 px-1.5 py-0.5 rounded-full">Not running</span>}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{p.note}</p>
                      {p.envKey && p.id !== 'ollama' && (
                        <code className="text-xs font-mono text-slate-600 mt-1 block">{p.envKey}</code>
                      )}
                    </div>
                    {p.freeSignupUrl && !isAvail && (
                      <a
                        href={p.freeSignupUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-shrink-0 text-xs px-2.5 py-1.5 rounded-lg bg-brand-600/15 border border-brand-500/20 text-brand-400 hover:bg-brand-600/25 transition-all"
                      >
                        Get free →
                      </a>
                    )}
                  </div>
                )
              })}
            </div>
            <p className="text-xs text-slate-600 mt-3">
              Add API keys to your Replit Secrets or <code className="bg-white/5 px-1 rounded">.env</code> file. Restart the server after adding a key.
            </p>
          </div>

          {/* Business Identity */}
          <div className="card">
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-white">🏢 Business Identity</h3>
              <p className="text-xs text-slate-500 mt-0.5">Your AI uses this to personalise every response to your actual business.</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-slate-400 mb-1.5 block">Company / Project Name</label>
                <input
                  className="input"
                  placeholder="e.g. Acme Inc., My SaaS..."
                  value={aiConfig.companyName}
                  onChange={e => setAIConfig(c => ({ ...c, companyName: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-400 mb-1.5 block">Industry</label>
                <input
                  className="input"
                  placeholder="e.g. SaaS, E-commerce, Fintech..."
                  value={profile.industry}
                  onChange={e => setProfile(p => ({ ...p, industry: e.target.value }))}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs font-medium text-slate-400 mb-1.5 block">What does your business do? (elevator pitch)</label>
                <textarea
                  className="input resize-none"
                  rows={2}
                  placeholder="e.g. We build AI tools for solo founders to automate their marketing..."
                  value={profile.bio}
                  onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))}
                />
              </div>
            </div>
          </div>

          {/* AI Personality */}
          <div className="card">
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-white">🎭 AI Personality</h3>
              <p className="text-xs text-slate-500 mt-0.5">Controls the tone and style of every response.</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {PERSONALITY_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setAIConfig(c => ({ ...c, aiPersonality: opt.value }))}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    aiConfig.aiPersonality === opt.value
                      ? 'border-brand-500/40 bg-brand-600/15 text-white shadow-[0_0_12px_rgba(99,102,241,0.15)]'
                      : 'border-white/5 text-slate-400 hover:border-white/10 hover:text-slate-300'
                  }`}
                >
                  <div className="text-xl mb-1.5">{opt.icon}</div>
                  <div className="text-xs font-semibold">{opt.label}</div>
                  <div className="text-xs text-slate-500 mt-0.5 leading-relaxed">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Active Domains */}
          <div className="card">
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-white">🧩 Active AI Domains</h3>
              <p className="text-xs text-slate-500 mt-0.5">Your AI has deep expertise in all of these. Toggle to emphasise the ones most relevant to your work.</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {AI_DOMAINS.map(domain => {
                const on = aiConfig.activeDomains.includes(domain.key)
                return (
                  <button
                    key={domain.key}
                    onClick={() => updateDomain(domain.key, !on)}
                    className={`flex items-start gap-2.5 p-3 rounded-xl border text-left transition-all ${
                      on
                        ? 'border-brand-500/30 bg-brand-600/10 text-white'
                        : 'border-white/5 text-slate-600 hover:border-white/10 opacity-50'
                    }`}
                  >
                    <span className="text-lg leading-none flex-shrink-0 mt-0.5">{domain.icon}</span>
                    <div>
                      <div className="text-xs font-semibold">{domain.label}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{domain.desc}</div>
                    </div>
                    <div className={`ml-auto flex-shrink-0 w-3 h-3 rounded-full mt-0.5 ${on ? 'bg-brand-500' : 'bg-white/10'}`} />
                  </button>
                )
              })}
            </div>
          </div>

          {/* Default Model */}
          {isOnline && models.length > 0 && (
            <div className="card">
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-white">⚙️ Default Model</h3>
                <p className="text-xs text-slate-500 mt-0.5">Which Ollama model powers your AI by default. You can also switch per-conversation in the chat.</p>
              </div>
              <div className="grid sm:grid-cols-2 gap-2">
                {models.map((m: string) => (
                  <button
                    key={m}
                    onClick={() => setAIConfig(c => ({ ...c, defaultModel: m }))}
                    className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                      aiConfig.defaultModel === m
                        ? 'border-brand-500/40 bg-brand-600/15 text-white'
                        : 'border-white/5 text-slate-400 hover:border-white/10 hover:text-slate-300'
                    }`}
                  >
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${aiConfig.defaultModel === m ? 'bg-brand-400' : 'bg-white/20'}`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-mono font-medium truncate">{m}</div>
                    </div>
                    {aiConfig.defaultModel === m && <span className="text-xs text-brand-400 flex-shrink-0">Active</span>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* System Prompt Preview */}
          <div className="card">
            <button
              onClick={() => setAIConfig(c => ({ ...c, promptPreviewOpen: !c.promptPreviewOpen }))}
              className="w-full flex items-center justify-between text-left"
            >
              <div>
                <h3 className="text-sm font-semibold text-white">📜 System Prompt Preview</h3>
                <p className="text-xs text-slate-500 mt-0.5">See exactly what your OneFounder AI is instructed to do.</p>
              </div>
              <svg className={`w-4 h-4 text-slate-500 transition-transform ${aiConfig.promptPreviewOpen ? 'rotate-180' : ''}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {aiConfig.promptPreviewOpen && (
              <div className="mt-4 animate-slide-up">
                <pre className="text-xs text-slate-400 bg-black/30 border border-white/5 rounded-xl p-4 overflow-x-auto whitespace-pre-wrap leading-relaxed font-mono max-h-64 overflow-y-auto">
                  {promptPreview}
                </pre>
                <p className="text-xs text-slate-600 mt-2">
                  This is a condensed preview. The full master prompt is ~400 lines covering all active domains.
                </p>
              </div>
            )}
          </div>

          {/* Save */}
          <div className="flex items-center gap-3">
            <button onClick={saveAIConfig} className="btn-primary">
              {aiSaved ? '✓ AI Config Saved!' : '💾 Save AI Configuration'}
            </button>
            <p className="text-xs text-slate-600">Changes take effect on the next conversation.</p>
          </div>

          {!isOnline && (
            <div className="glass rounded-xl p-5 border border-yellow-500/15 space-y-4">
              <p className="text-sm font-semibold text-white">⚡ Enable AI — pick any free option</p>
              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-lg bg-white/3 border border-white/5">
                  <p className="font-semibold text-white mb-1.5">Option A — Ollama (local, no internet needed)</p>
                  <div className="space-y-1 text-slate-400">
                    <p>1. Install from <a href="https://ollama.ai" target="_blank" rel="noreferrer" className="text-brand-400 underline">ollama.ai</a></p>
                    <p>2. <code className="bg-white/10 px-1.5 py-0.5 rounded font-mono">ollama serve</code></p>
                    <p>3. <code className="bg-white/10 px-1.5 py-0.5 rounded font-mono">ollama pull llama3.2</code> (or deepseek-r1, qwen2.5, mistral)</p>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-white/3 border border-white/5">
                  <p className="font-semibold text-white mb-1.5">Option B — Free API key (works on Vercel too)</p>
                  <div className="space-y-1 text-slate-400">
                    <p>Pick one: <a href="https://console.groq.com" target="_blank" rel="noreferrer" className="text-brand-400 underline">Groq</a> (always free) · <a href="https://platform.deepseek.com" target="_blank" rel="noreferrer" className="text-brand-400 underline">DeepSeek</a> · <a href="https://openrouter.ai" target="_blank" rel="noreferrer" className="text-brand-400 underline">OpenRouter</a></p>
                    <p>Sign up → copy your API key → add it to Replit Secrets as <code className="bg-white/10 px-1 rounded font-mono">GROQ_API_KEY</code> (or the relevant key name shown above)</p>
                    <p>Restart the server — AI activates automatically.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── PROFILE TAB ────────────────────────────────────────────── */}
      {tab === 'profile' && (
        <div className="space-y-5 animate-slide-up">
          <div className="card">
            <div className="flex items-center gap-4 mb-5 pb-5 border-b border-white/5">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-brand-500/30 to-violet-600/20 flex items-center justify-center text-2xl font-bold text-brand-300">
                {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '?'}
              </div>
              <div>
                <div className="text-white font-semibold">{user?.name || 'Founder'}</div>
                <div className="text-slate-400 text-sm">{user?.email}</div>
                <div className="text-xs text-slate-600 mt-0.5">Free Plan</div>
              </div>
            </div>

            <h3 className="text-sm font-semibold text-white mb-1">🧬 Founder Profile</h3>
            <p className="text-xs text-slate-500 mb-4">AI uses this to personalise all responses to your goals and style.</p>

            <div className="space-y-5">
              <div>
                <label className="text-xs font-medium text-slate-400 mb-2 block">Risk Tolerance</label>
                <div className="grid grid-cols-3 gap-2">
                  {riskOptions.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setProfile(p => ({ ...p, riskTolerance: opt.value }))}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        profile.riskTolerance === opt.value
                          ? 'border-brand-500/40 bg-brand-600/20 text-white'
                          : 'border-white/5 text-slate-400 hover:border-white/10 hover:text-white'
                      }`}
                    >
                      <div className="text-xs font-semibold">{opt.label}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{opt.desc}</div>
                    </button>
                  ))}
                </div>
                <div className="mt-2 h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 via-amber-500 to-red-500 rounded-full transition-all duration-500"
                    style={{ width: profile.riskTolerance === 'conservative' ? '33%' : profile.riskTolerance === 'moderate' ? '66%' : '100%' }}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-400 mb-2 block">Work Style</label>
                <div className="grid grid-cols-3 gap-2">
                  {workStyleOptions.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setProfile(p => ({ ...p, workStyle: opt.value }))}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        profile.workStyle === opt.value
                          ? 'border-brand-500/40 bg-brand-600/20 text-white'
                          : 'border-white/5 text-slate-400 hover:border-white/10 hover:text-white'
                      }`}
                    >
                      <div className="text-xs font-semibold">{opt.label}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{opt.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-slate-400 mb-1.5 block">Primary Goal</label>
                  <select className="input" value={profile.primaryGoal} onChange={e => setProfile(p => ({ ...p, primaryGoal: e.target.value }))}>
                    {goalOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-400 mb-1.5 block">Current Stage</label>
                  <select className="input" value={profile.stage} onChange={e => setProfile(p => ({ ...p, stage: e.target.value }))}>
                    {stageOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              </div>

              <button onClick={saveProfile} disabled={profileSaving} className="btn-primary">
                {profileSaving ? <LoadingSpinner size="sm" /> : profileSaved ? '✓ Saved!' : 'Save Profile'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODULES TAB ────────────────────────────────────────────── */}
      {tab === 'modules' && (
        <div className="animate-slide-up">
          <div className="card">
            <h2 className="text-sm font-semibold text-white mb-4">🧩 Platform Modules</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {MODULES.map(mod => (
                <div key={mod.label} className={`glass rounded-xl p-3 border ${mod.status === 'active' ? 'border-green-500/15' : 'border-white/5 opacity-40'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{mod.icon}</span>
                    <span className="text-xs font-medium text-white truncate flex-1">{mod.label}</span>
                    {mod.status === 'coming_soon'
                      ? <span className="text-xs bg-brand-500/20 text-brand-400 px-1.5 py-0.5 rounded-full flex-shrink-0">soon</span>
                      : <span className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />}
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-1">{mod.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── SOCIAL TAB ─────────────────────────────────────────────── */}
      {tab === 'social' && (
        <div className="animate-slide-up">
          <div className="card">
            <h2 className="text-sm font-semibold text-white mb-1">🖼️ Social Preview Cards</h2>
            <p className="text-xs text-slate-500 mb-4">
              Copy these URLs as your <code className="bg-white/10 px-1 rounded">og:image</code> meta tags — LinkedIn and Twitter render branded cards when your links are shared.
            </p>
            <div className="flex gap-2 flex-wrap mb-4">
              {OG_MODULES.map(mod => (
                <button
                  key={mod.key}
                  onClick={() => setActiveOgModule(mod)}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                    activeOgModule.key === mod.key
                      ? 'bg-brand-600/20 border-brand-500/30 text-white'
                      : 'border-white/5 text-slate-400 hover:text-white hover:border-white/10'
                  }`}
                >
                  {mod.icon} {mod.label}
                </button>
              ))}
            </div>
            <div className="rounded-xl overflow-hidden border border-white/10 mb-3 bg-black/20">
              <img
                key={activeOgModule.key}
                src={buildOgUrl(activeOgModule.key, activeOgModule.title, activeOgModule.description)}
                alt={`OG preview for ${activeOgModule.label}`}
                className="w-full"
                style={{ aspectRatio: '1200/630' }}
              />
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-xs bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-slate-400 truncate font-mono">
                {buildOgUrl(activeOgModule.key, activeOgModule.title, activeOgModule.description)}
              </code>
              <button
                onClick={() => copyOgUrl(activeOgModule)}
                className={`flex-shrink-0 text-xs px-3 py-2 rounded-lg border transition-all ${
                  copiedOgKey === activeOgModule.key
                    ? 'bg-green-500/20 border-green-500/30 text-green-400'
                    : 'bg-white/5 border-white/10 text-slate-300 hover:text-white hover:bg-white/10'
                }`}
              >
                {copiedOgKey === activeOgModule.key ? '✓ Copied!' : 'Copy URL'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── ACCOUNT TAB ────────────────────────────────────────────── */}
      {tab === 'account' && (
        <div className="space-y-4 animate-slide-up">
          <div className="card">
            <h2 className="text-sm font-semibold text-white mb-4">👤 Account</h2>
            <div className="flex items-center gap-4 p-4 glass rounded-xl border border-white/5 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-500/30 to-violet-600/20 flex items-center justify-center text-xl font-bold text-brand-300 flex-shrink-0">
                {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '?'}
              </div>
              <div>
                <div className="text-sm font-semibold text-white">{user?.name || 'Founder'}</div>
                <div className="text-xs text-slate-400">{user?.email}</div>
                <div className="mt-1 text-xs bg-brand-500/20 text-brand-400 px-2 py-0.5 rounded-full inline-block">Free Plan</div>
              </div>
            </div>
            <button onClick={signOut} className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300 px-3 py-2 rounded-lg hover:bg-red-500/10 transition-all">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign out of OneFounder
            </button>
          </div>
          <div className="text-center text-xs text-slate-700 py-2">
            OneFounder v2.0 · The OS for Founders · Powered by Ollama AI · Neon PostgreSQL · Better Auth
          </div>
        </div>
      )}
    </div>
  )
}
