import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { api } from '../lib/api'
import { PageHeader } from '../components/ui/PageHeader'

export function SettingsPage() {
  const { user, signOut } = useAuth()
  const [aiStatus, setAiStatus] = useState<any>(null)

  useEffect(() => {
    api.get<any>('/ai/status').then(setAiStatus).catch(() => {})
  }, [])

  const MODULES = [
    { icon: '💡', label: 'Idea Lab', status: 'active', desc: 'AI-powered startup idea generation' },
    { icon: '🔍', label: 'Market Research', status: 'active', desc: 'Competitor & trend analysis' },
    { icon: '📋', label: 'Business Planner', status: 'active', desc: 'Full business plan generation' },
    { icon: '🎯', label: 'Project Management', status: 'active', desc: 'Kanban boards & task tracking' },
    { icon: '✍️', label: 'Content Studio', status: 'active', desc: 'AI content generation' },
    { icon: '👥', label: 'CRM', status: 'active', desc: 'Lead & customer management' },
    { icon: '🤖', label: 'AI Agents', status: 'active', desc: 'CEO, Marketing, Sales agents' },
    { icon: '📚', label: 'Knowledge Base', status: 'active', desc: 'Document management' },
    { icon: '🌐', label: 'Website Manager', status: 'coming_soon', desc: 'WordPress, Webflow, Shopify' },
    { icon: '📱', label: 'Social Media', status: 'coming_soon', desc: 'LinkedIn, X, Instagram scheduler' },
    { icon: '💰', label: 'Finance Tracker', status: 'coming_soon', desc: 'Revenue, expenses, burn rate' },
    { icon: '📊', label: 'Analytics', status: 'coming_soon', desc: 'Traffic, engagement, growth' },
    { icon: '⚡', label: 'Automations', status: 'coming_soon', desc: 'Workflow automation engine' },
    { icon: '🛒', label: 'Marketplace', status: 'coming_soon', desc: 'Templates & industry packs' },
    { icon: '📈', label: 'Investor Mode', status: 'coming_soon', desc: 'Pitch decks & KPI reports' },
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
                <div className="text-sm font-medium text-white">
                  {aiStatus?.available ? 'Ollama Connected' : 'Demo Mode (No AI)'}
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  {aiStatus?.available
                    ? `Models: ${aiStatus.models?.join(', ') || 'none loaded'}`
                    : 'Install Ollama to enable real AI responses'
                  }
                </div>
              </div>
              {!aiStatus?.available && (
                <a
                  href="https://ollama.ai"
                  target="_blank"
                  rel="noreferrer"
                  className="btn-primary text-sm py-1.5"
                >
                  Install Ollama →
                </a>
              )}
            </div>

            {!aiStatus?.available && (
              <div className="glass rounded-xl p-4 text-sm text-slate-400 space-y-2">
                <p className="font-medium text-white">How to enable AI:</p>
                <ol className="list-decimal list-inside space-y-1 text-slate-400">
                  <li>Download and install <a href="https://ollama.ai" target="_blank" rel="noreferrer" className="text-brand-400 underline">Ollama</a></li>
                  <li>Open terminal and run: <code className="bg-white/10 px-2 py-0.5 rounded text-xs font-mono">ollama serve</code></li>
                  <li>Pull a model: <code className="bg-white/10 px-2 py-0.5 rounded text-xs font-mono">ollama pull llama3.2</code></li>
                  <li>Restart OneFounder</li>
                </ol>
                <p className="text-xs text-slate-500">Supported models: llama3.2, deepseek-r1, qwen2.5, mistral</p>
              </div>
            )}

            <div className="glass rounded-xl p-4 text-sm text-slate-400">
              <p className="font-medium text-white mb-2">Future AI Providers (Coming Soon)</p>
              <div className="flex flex-wrap gap-2">
                {['OpenAI (GPT-4)', 'Claude (Anthropic)', 'Gemini (Google)', 'Custom Models'].map(p => (
                  <span key={p} className="glass px-3 py-1 rounded-full text-xs text-slate-500">{p}</span>
                ))}
              </div>
            </div>
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
          OneFounder v1.0.0 · The OS for Founders · Built with Ollama, Neon PostgreSQL, Better Auth
        </div>
      </div>
    </div>
  )
}
