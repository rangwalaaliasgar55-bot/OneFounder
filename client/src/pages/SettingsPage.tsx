import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { api } from '../lib/api'
import { PageHeader } from '../components/ui/PageHeader'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'

interface FounderProfile {
  riskTolerance: string
  workStyle: string
  primaryGoal: string
  bio: string
  industry: string
  stage: string
}

export function SettingsPage() {
  const { user, signOut } = useAuth()
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

  useEffect(() => {
    api.get<any>('/ai/status').then(setAiStatus).catch(() => {})
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

  const MODULES = [
    { icon: '💡', label: 'Idea Lab', status: 'active', desc: 'AI-powered startup idea generation' },
    { icon: '🔍', label: 'Market Research', status: 'active', desc: 'Competitor & trend analysis' },
    { icon: '📋', label: 'Business Planner', status: 'active', desc: 'Full business plan generation' },
    { icon: '🎯', label: 'Project Management', status: 'active', desc: 'Kanban boards & task tracking' },
    { icon: '✍️', label: 'Content Studio', status: 'active', desc: 'AI content generation' },
    { icon: '👥', label: 'CRM', status: 'active', desc: 'Lead & customer management' },
    { icon: '🤖', label: 'AI Agents', status: 'active', desc: 'CEO, Marketing, Sales agents' },
    { icon: '📚', label: 'Knowledge Base', status: 'active', desc: 'Document management' },
    { icon: '🌐', label: 'Website Manager', status: 'active', desc: 'WordPress integration & SEO' },
    { icon: '📱', label: 'Social Media', status: 'active', desc: 'Schedule & manage posts' },
    { icon: '💰', label: 'Finance Tracker', status: 'active', desc: 'Revenue, expenses, burn rate' },
    { icon: '📊', label: 'Analytics', status: 'coming_soon', desc: 'Traffic, engagement, growth' },
    { icon: '⚡', label: 'Automations', status: 'coming_soon', desc: 'Workflow automation engine' },
    { icon: '🛒', label: 'Marketplace', status: 'coming_soon', desc: 'Templates & industry packs' },
    { icon: '📈', label: 'Investor Mode', status: 'coming_soon', desc: 'Pitch decks & KPI reports' },
  ]

  const providerLabel = aiStatus?.available
    ? `ONEFOUNDER AI — Ollama (${aiStatus.models?.join(', ') || 'connected'})`
    : 'Demo Mode (No AI)'

  const riskOptions = [
    { value: 'conservative', label: 'Conservative', desc: 'Low risk, steady growth' },
    { value: 'moderate', label: 'Moderate', desc: 'Balanced approach' },
    { value: 'aggressive', label: 'Aggressive', desc: 'High risk, high reward' },
  ]

  const workStyleOptions = [
    { value: 'builder', label: '🔨 Builder', desc: 'Focus on product & tech' },
    { value: 'marketer', label: '📣 Marketer', desc: 'Focus on growth & brand' },
    { value: 'operator', label: '⚙️ Operator', desc: 'Focus on systems & scale' },
  ]

  const goalOptions = [
    { value: 'get_first_customer', label: 'Get first customer' },
    { value: 'reach_10k_mrr', label: 'Reach $10k MRR' },
    { value: 'raise_funding', label: 'Raise funding' },
    { value: 'grow_team', label: 'Grow team' },
  ]

  const stageOptions = [
    { value: 'idea', label: 'Idea stage' },
    { value: 'mvp', label: 'Building MVP' },
    { value: 'launched', label: 'Launched' },
    { value: 'growing', label: 'Growing' },
    { value: 'scaling', label: 'Scaling' },
  ]

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <PageHeader
        icon="⚙️"
        title="Settings"
        description="Manage your OneFounder workspace and integrations"
      />

      <div className="space-y-6">
        <div className="card">
          <h2 className="text-base font-semibold text-white mb-4">Profile</h2>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-brand-600/30 flex items-center justify-center text-2xl font-bold text-brand-300">
              {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '?'}
            </div>
            <div>
              <div className="text-white font-semibold">{user?.name || 'Founder'}</div>
              <div className="text-slate-400 text-sm">{user?.email}</div>
              <div className="text-xs text-slate-600 mt-0.5">Free Plan</div>
            </div>
          </div>
        </div>

        {/* Founder Profile */}
        <div className="card">
          <h2 className="text-base font-semibold text-white mb-4">🧬 Founder Profile</h2>
          <p className="text-xs text-slate-500 mb-4">AI uses this context to personalise all responses to your goals and style.</p>

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
                <label className="text-xs font-medium text-slate-400 mb-2 block">Primary Goal</label>
                <select
                  className="input w-full"
                  value={profile.primaryGoal}
                  onChange={e => setProfile(p => ({ ...p, primaryGoal: e.target.value }))}
                >
                  {goalOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-400 mb-2 block">Current Stage</label>
                <select
                  className="input w-full"
                  value={profile.stage}
                  onChange={e => setProfile(p => ({ ...p, stage: e.target.value }))}
                >
                  {stageOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-slate-400 mb-2 block">Industry</label>
                <input
                  className="input w-full"
                  placeholder="e.g. SaaS, E-commerce, Fintech..."
                  value={profile.industry}
                  onChange={e => setProfile(p => ({ ...p, industry: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-400 mb-2 block">Bio / Context</label>
                <input
                  className="input w-full"
                  placeholder="Brief description of your business..."
                  value={profile.bio}
                  onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))}
                />
              </div>
            </div>

            <button onClick={saveProfile} disabled={profileSaving} className="btn-primary flex items-center gap-2">
              {profileSaving ? <LoadingSpinner size="sm" /> : profileSaved ? '✓ Saved!' : 'Save Profile'}
            </button>
          </div>
        </div>

        <div className="card">
          <h2 className="text-base font-semibold text-white mb-4">AI Provider</h2>
          <div className="space-y-4">
            <div className={`flex items-center gap-4 p-4 rounded-xl border ${
              aiStatus?.available
                ? 'border-green-500/20 bg-green-500/5'
                : 'border-yellow-500/20 bg-yellow-500/5'
            }`}>
              <div className={`w-3 h-3 rounded-full flex-shrink-0 ${aiStatus?.available ? 'bg-green-400' : 'bg-yellow-400'} animate-pulse`} />
              <div className="flex-1">
                <div className="text-sm font-medium text-white">{providerLabel}</div>
                <div className="text-xs text-slate-400 mt-0.5">
                  {aiStatus?.provider === 'ollama' && `Models: ${aiStatus.models?.join(', ') || 'none loaded'} · Local inference via Ollama`}
                  {!aiStatus?.available && 'Install Ollama and run: ollama serve && ollama pull llama3.2'}
                </div>
              </div>
            </div>

            {!aiStatus?.available && (
              <div className="glass rounded-xl p-4 text-sm text-slate-400 space-y-3">
                <p className="font-medium text-white">Enable ONEFOUNDER AI (Local · Free · Private)</p>
                <div className="space-y-2">
                  <p className="text-xs text-slate-400">1. Install Ollama: <a href="https://ollama.ai" target="_blank" rel="noreferrer" className="text-brand-400 underline">ollama.ai</a></p>
                  <p className="text-xs text-slate-400">2. Start the engine: <code className="bg-white/10 px-2 py-0.5 rounded text-xs font-mono">ollama serve</code></p>
                  <p className="text-xs text-slate-400">3. Pull a model: <code className="bg-white/10 px-2 py-0.5 rounded text-xs font-mono">ollama pull llama3.2</code></p>
                </div>
                <p className="text-xs text-slate-600">Recommended models: llama3.2, mistral, deepseek-r1, qwen2.5</p>
              </div>
            )}

            {aiStatus?.available && (
              <div className="glass rounded-xl p-4 text-sm text-slate-400 space-y-1">
                <p className="font-medium text-white mb-2">🧠 ONEFOUNDER AI Brain — Active</p>
                <p className="text-xs">Auto-routing: detects intent and routes to the right expert (Code · SEO · Security · Data · Research · Startup)</p>
                <p className="text-xs">Prompt enhancement: rewrites your question into expert-level prompts</p>
                <p className="text-xs">Web search: injects live news and trends into research queries</p>
                <p className="text-xs">Memory: learns your business context over time</p>
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <h2 className="text-base font-semibold text-white mb-4">Platform Modules</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {MODULES.map(mod => (
              <div key={mod.label} className={`glass rounded-xl p-3 border ${mod.status === 'active' ? 'border-green-500/20' : 'border-white/5 opacity-50'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{mod.icon}</span>
                  <span className="text-xs font-medium text-white truncate">{mod.label}</span>
                  {mod.status === 'coming_soon' && (
                    <span className="ml-auto text-xs bg-brand-500/20 text-brand-400 px-1.5 py-0.5 rounded-full flex-shrink-0">soon</span>
                  )}
                  {mod.status === 'active' && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />
                  )}
                </div>
                <p className="text-xs text-slate-500 line-clamp-1">{mod.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="card border border-red-500/10">
          <h2 className="text-base font-semibold text-white mb-4">Account</h2>
          <button onClick={signOut} className="btn-ghost text-red-400 hover:text-red-300 hover:bg-red-500/10">
            🚪 Sign out of OneFounder
          </button>
        </div>

        <div className="text-center text-xs text-slate-600 py-4">
          ONEFOUNDER v2.0 · The OS for Founders · Powered by Ollama AI · Neon PostgreSQL · Better Auth
        </div>
      </div>
    </div>
  )
}
