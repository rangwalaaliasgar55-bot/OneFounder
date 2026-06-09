import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import { useAuth } from '../hooks/useAuth'
import { PageLoader } from '../components/ui/LoadingSpinner'

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

interface DashboardPageProps {
  navigate: (page: any) => void
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

export function DashboardPage({ navigate }: DashboardPageProps) {
  const { user } = useAuth()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [aiStatus, setAiStatus] = useState<{ available: boolean; provider: string; models?: string[] } | null>(null)

  useEffect(() => {
    Promise.all([
      api.get<DashboardData>('/dashboard/stats'),
      api.get<any>('/ai/status'),
    ]).then(([dashboard, ai]) => {
      setData(dashboard)
      setAiStatus(ai)
    }).catch(console.error).finally(() => setLoading(false))
  }, [])

  if (loading) return <PageLoader />

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 18) return 'Good afternoon'
    return 'Good evening'
  }

  const statCards = [
    { label: 'Business Ideas', value: data?.stats.ideas ?? 0, icon: '💡', page: 'ideas', color: 'from-brand-600/20 to-brand-800/10' },
    { label: 'Active Projects', value: data?.stats.projects ?? 0, icon: '🎯', page: 'projects', color: 'from-violet-600/20 to-violet-800/10' },
    { label: 'Open Tasks', value: data?.stats.tasks ?? 0, icon: '✅', page: 'projects', color: 'from-emerald-600/20 to-emerald-800/10' },
    { label: 'CRM Leads', value: data?.stats.leads ?? 0, icon: '👥', page: 'crm', color: 'from-orange-600/20 to-orange-800/10' },
    { label: 'Content Pieces', value: data?.stats.content ?? 0, icon: '✍️', page: 'content', color: 'from-pink-600/20 to-pink-800/10' },
    { label: 'Research Reports', value: data?.stats.reports ?? 0, icon: '🔍', page: 'research', color: 'from-cyan-600/20 to-cyan-800/10' },
    { label: 'Business Plans', value: data?.stats.plans ?? 0, icon: '📋', page: 'planner', color: 'from-amber-600/20 to-amber-800/10' },
  ]

  const quickActions = [
    { icon: '💡', label: 'Generate Ideas', desc: 'Discover startup opportunities', page: 'ideas' },
    { icon: '🔍', label: 'Research Market', desc: 'Analyze competitors & trends', page: 'research' },
    { icon: '📋', label: 'Create Business Plan', desc: 'Full plan with AI', page: 'planner' },
    { icon: '🤖', label: 'Chat with AI Agent', desc: 'CEO, Marketing, Sales agents', page: 'chat' },
    { icon: '✍️', label: 'Generate Content', desc: 'Blog, LinkedIn, newsletters', page: 'content' },
    { icon: '👥', label: 'Manage CRM', desc: 'Track leads & customers', page: 'crm' },
  ]

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">
              {greeting()}, {user?.name?.split(' ')[0] || 'Founder'} 👋
            </h1>
            <p className="text-slate-400 mt-1">Here's your business operating system overview.</p>
          </div>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
            aiStatus?.available
              ? 'bg-green-500/10 border border-green-500/20 text-green-400'
              : 'bg-yellow-500/10 border border-yellow-500/20 text-yellow-400'
          }`}>
            <div className={`w-1.5 h-1.5 rounded-full ${aiStatus?.available ? 'bg-green-400' : 'bg-yellow-400'} animate-pulse`} />
            {aiStatus?.available ? `Ollama (${aiStatus.models?.[0] || 'connected'})` : 'Demo Mode'}
          </div>
        </div>

        {!aiStatus?.available && (
          <div className="mt-4 glass border border-yellow-500/20 rounded-xl p-4 flex items-start gap-3">
            <span className="text-yellow-400 text-lg">⚠️</span>
            <div>
              <p className="text-yellow-400 text-sm font-medium">AI in Demo Mode</p>
              <p className="text-slate-400 text-xs mt-0.5">
                Install <a href="https://ollama.ai" target="_blank" rel="noreferrer" className="text-brand-400 underline">Ollama</a>{' '}
                and run <code className="bg-white/10 px-1 rounded text-xs">ollama pull llama3.2</code> to enable real AI responses.
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3 mb-8">
        {statCards.map(card => (
          <button
            key={card.label}
            onClick={() => navigate(card.page)}
            className={`glass-strong rounded-xl p-4 text-left hover:scale-105 transition-all duration-200 bg-gradient-to-br ${card.color} border border-white/10 hover:border-white/20`}
          >
            <div className="text-2xl mb-2">{card.icon}</div>
            <div className="text-2xl font-bold text-white">{card.value}</div>
            <div className="text-xs text-slate-400 mt-0.5">{card.label}</div>
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <h2 className="text-base font-semibold text-white mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {quickActions.map(action => (
                <button
                  key={action.label}
                  onClick={() => navigate(action.page)}
                  className="glass rounded-xl p-4 text-left hover:bg-white/10 hover:border-white/20 transition-all duration-200 border border-white/5"
                >
                  <div className="text-2xl mb-2">{action.icon}</div>
                  <div className="text-sm font-semibold text-white">{action.label}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{action.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {data?.recent.ideas && data.recent.ideas.length > 0 && (
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-white">Recent Ideas</h2>
                <button onClick={() => navigate('ideas')} className="text-xs text-brand-400 hover:text-brand-300">View all →</button>
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
                <button onClick={() => navigate('projects')} className="text-xs text-brand-400 hover:text-brand-300">View all →</button>
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
                <button onClick={() => navigate('crm')} className="text-xs text-brand-400 hover:text-brand-300">View all →</button>
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

          <div className="card bg-gradient-to-br from-brand-600/10 to-violet-600/10 border-brand-500/20">
            <div className="text-2xl mb-2">🤖</div>
            <h3 className="text-sm font-semibold text-white mb-1">Chat with your AI</h3>
            <p className="text-xs text-slate-400 mb-3">CEO Agent, Marketing, Sales — all ready to help.</p>
            <button onClick={() => navigate('chat')} className="btn-primary text-sm py-1.5">
              Open AI Chat →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
