import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import { MeshGradient } from '../components/ui/MeshGradient'

interface Task {
  id: string
  title: string
  description: string | null
  status: string
  priority: string
  dueDate: string | null
  completedAt: string | null
  createdAt: string
}

interface PlannedTask {
  title: string
  description: string
  priority: string
  estimatedTime: string
  category: string
  dependencies: string[]
  successCriteria: string
}

interface TaskPlan {
  goal: string
  timeframe: string
  tasks: PlannedTask[]
  reasoning: string
}

const PRIORITY_CONFIG: Record<string, { color: string; label: string }> = {
  high: { color: 'text-red-400 bg-red-500/10 border-red-500/20', label: 'High' },
  medium: { color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20', label: 'Medium' },
  low: { color: 'text-slate-400 bg-slate-500/10 border-slate-500/10', label: 'Low' },
}

const STATUS_CONFIG: Record<string, { color: string; label: string; icon: string }> = {
  todo: { color: 'text-slate-400', label: 'To Do', icon: '○' },
  in_progress: { color: 'text-blue-400', label: 'In Progress', icon: '◑' },
  done: { color: 'text-green-400', label: 'Done', icon: '●' },
  cancelled: { color: 'text-red-400', label: 'Cancelled', icon: '✕' },
}

const TIMEFRAME_OPTIONS = [
  { value: '24h', label: 'Next 24 Hours' },
  { value: '7d', label: 'Next 7 Days' },
  { value: '30d', label: 'Next 30 Days' },
  { value: 'sprint', label: '2-Week Sprint' },
]

const PLAN_TYPES = [
  { id: 'goal', icon: '🎯', label: 'Goal Plan', desc: 'Plan tasks around a specific goal' },
  { id: 'sprint', icon: '🏃', label: 'Sprint Plan', desc: 'AI-generated 2-week sprint' },
  { id: 'launch', icon: '🚀', label: 'Launch Checklist', desc: 'Full product launch checklist' },
]

function TaskCard({ task, onStatusChange, onDelete }: {
  task: Task
  onStatusChange: (id: string, status: string) => void
  onDelete: (id: string) => void
}) {
  const priority = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium
  const status = STATUS_CONFIG[task.status] || STATUS_CONFIG.todo
  const [expanded, setExpanded] = useState(false)

  return (
    <div className={`glass rounded-xl p-4 border transition-all ${task.status === 'done' ? 'opacity-60 border-transparent' : 'border-transparent hover:border-white/8'}`}>
      <div className="flex items-start gap-3">
        <button
          onClick={() => onStatusChange(task.id, task.status === 'done' ? 'todo' : 'done')}
          className={`text-lg flex-shrink-0 mt-0.5 transition-colors hover:scale-110 ${status.color}`}
        >
          {status.icon}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 flex-wrap">
            <span className={`text-sm font-medium ${task.status === 'done' ? 'line-through text-slate-500' : 'text-white'}`}>
              {task.title}
            </span>
            <span className={`text-xs px-1.5 py-0.5 rounded border flex-shrink-0 ${priority.color}`}>
              {priority.label}
            </span>
          </div>
          {task.description && !expanded && (
            <p className="text-xs text-slate-500 mt-1 line-clamp-1">{task.description}</p>
          )}
          {task.description && expanded && (
            <p className="text-xs text-slate-400 mt-2 leading-relaxed whitespace-pre-wrap">{task.description}</p>
          )}
          {task.description && (
            <button
              onClick={() => setExpanded(v => !v)}
              className="text-xs text-slate-600 hover:text-slate-400 mt-1 transition-colors"
            >
              {expanded ? 'Less ↑' : 'More ↓'}
            </button>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <select
            value={task.status}
            onChange={e => onStatusChange(task.id, e.target.value)}
            className="text-xs bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-slate-400 focus:outline-none focus:border-brand-500/50"
          >
            {Object.entries(STATUS_CONFIG).map(([v, cfg]) => (
              <option key={v} value={v}>{cfg.label}</option>
            ))}
          </select>
          <button
            onClick={() => onDelete(task.id)}
            className="text-slate-700 hover:text-red-400 transition-colors text-xs px-1.5"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  )
}

export function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('all')
  const [showPlanner, setShowPlanner] = useState(false)
  const [planType, setPlanType] = useState<'goal' | 'sprint' | 'launch'>('goal')
  const [planGoal, setPlanGoal] = useState('')
  const [planTimeframe, setPlanTimeframe] = useState('7d')
  const [generating, setGenerating] = useState(false)
  const [generatedPlan, setGeneratedPlan] = useState<TaskPlan | null>(null)
  const [saving, setSaving] = useState(false)
  const [briefing, setBriefing] = useState<string | null>(null)
  const [loadingBriefing, setLoadingBriefing] = useState(false)

  async function loadTasks() {
    setLoading(true)
    try {
      const res = await api.get<{ tasks: Task[] }>('/tasks')
      setTasks(res.tasks || [])
    } catch {}
    setLoading(false)
  }

  useEffect(() => { loadTasks() }, [])

  async function handleStatusChange(id: string, status: string) {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status } : t))
    try {
      await api.patch(`/tasks/${id}`, { status })
    } catch {}
  }

  async function handleDelete(id: string) {
    setTasks(prev => prev.filter(t => t.id !== id))
    try {
      await api.delete(`/tasks/${id}`)
    } catch {}
  }

  async function generatePlan() {
    if (!planGoal.trim()) return
    setGenerating(true)
    setGeneratedPlan(null)
    try {
      const endpoint = planType === 'sprint' ? '/tasks/sprint'
        : planType === 'launch' ? '/tasks/launch-checklist'
        : '/tasks/plan'
      const body = planType === 'launch'
        ? { productName: planGoal }
        : { goal: planGoal, timeframe: planTimeframe }
      const res = await api.post<{ plan: TaskPlan }>(endpoint, body)
      setGeneratedPlan(res.plan)
    } catch {}
    setGenerating(false)
  }

  async function savePlan() {
    if (!generatedPlan) return
    setSaving(true)
    try {
      const endpoint = planType === 'sprint' ? '/tasks/sprint'
        : planType === 'launch' ? '/tasks/launch-checklist'
        : '/tasks/plan'
      const body = planType === 'launch'
        ? { productName: planGoal, save: true }
        : { goal: planGoal, timeframe: planTimeframe, save: true }
      await api.post(endpoint, body)
      setGeneratedPlan(null)
      setShowPlanner(false)
      setPlanGoal('')
      loadTasks()
    } catch {}
    setSaving(false)
  }

  async function loadBriefing() {
    setLoadingBriefing(true)
    try {
      const res = await api.get<{ briefing: string }>('/tasks/briefing')
      setBriefing(res.briefing)
    } catch {}
    setLoadingBriefing(false)
  }

  const filtered = tasks.filter(t => {
    if (filterStatus === 'all') return true
    if (filterStatus === 'active') return t.status === 'todo' || t.status === 'in_progress'
    return t.status === filterStatus
  })

  const stats = {
    total: tasks.length,
    todo: tasks.filter(t => t.status === 'todo').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    done: tasks.filter(t => t.status === 'done').length,
  }

  return (
    <div className="p-6 max-w-5xl mx-auto relative">
      <MeshGradient />
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            ✅ Task Center
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            AI-generated task plans, sprint management, and execution tracking
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadBriefing}
            disabled={loadingBriefing}
            className="btn-ghost text-sm px-4 py-2"
          >
            {loadingBriefing ? '...' : '⚡ Daily Brief'}
          </button>
          <button
            onClick={() => setShowPlanner(true)}
            className="btn-primary text-sm px-4 py-2"
          >
            + AI Plan
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total', value: stats.total, color: 'text-white' },
          { label: 'To Do', value: stats.todo, color: 'text-slate-400' },
          { label: 'In Progress', value: stats.inProgress, color: 'text-blue-400' },
          { label: 'Done', value: stats.done, color: 'text-green-400' },
        ].map(s => (
          <div key={s.label} className="glass rounded-xl p-4 text-center">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-slate-600 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Daily Briefing */}
      {briefing && (
        <div className="glass rounded-2xl border border-brand-500/20 p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              ⚡ OneFounder Supreme Daily Brief
            </h3>
            <button onClick={() => setBriefing(null)} className="text-slate-600 hover:text-slate-400 text-xs">✕</button>
          </div>
          <div className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">{briefing}</div>
        </div>
      )}

      {/* Planner Modal */}
      {showPlanner && (
        <div className="glass rounded-2xl border border-white/10 p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">AI Task Planner</h3>
            <button onClick={() => { setShowPlanner(false); setGeneratedPlan(null) }} className="text-slate-600 hover:text-slate-400 text-xs">✕</button>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-4">
            {PLAN_TYPES.map(pt => (
              <button
                key={pt.id}
                onClick={() => setPlanType(pt.id as any)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  planType === pt.id
                    ? 'bg-brand-600/20 border-brand-500/30 text-white'
                    : 'border-white/5 text-slate-400 hover:border-white/15 hover:text-white'
                }`}
              >
                <div className="text-lg mb-1">{pt.icon}</div>
                <div className="text-xs font-medium">{pt.label}</div>
                <div className="text-xs text-slate-600 mt-0.5">{pt.desc}</div>
              </button>
            ))}
          </div>

          <div className="space-y-3">
            <input
              value={planGoal}
              onChange={e => setPlanGoal(e.target.value)}
              placeholder={
                planType === 'launch' ? 'Product name (e.g., "OneFounder SaaS")' :
                planType === 'sprint' ? 'Sprint goal (e.g., "Get first 10 paying customers")' :
                'What do you want to achieve?'
              }
              className="input-field w-full text-sm"
            />

            {planType === 'goal' && (
              <div className="flex gap-2">
                {TIMEFRAME_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setPlanTimeframe(opt.value)}
                    className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                      planTimeframe === opt.value
                        ? 'bg-brand-600/20 border-brand-500/30 text-brand-300'
                        : 'border-white/10 text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}

            <button
              onClick={generatePlan}
              disabled={generating || !planGoal.trim()}
              className="btn-primary text-sm px-4 py-2 w-full"
            >
              {generating ? '⚡ Generating AI Plan...' : '⚡ Generate Plan'}
            </button>
          </div>

          {/* Generated Plan Preview */}
          {generatedPlan && (
            <div className="mt-5 border-t border-white/5 pt-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-white">Generated Plan</h4>
                <button
                  onClick={savePlan}
                  disabled={saving}
                  className="btn-primary text-xs px-3 py-1.5"
                >
                  {saving ? 'Saving...' : `Save ${generatedPlan.tasks.length} Tasks`}
                </button>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed mb-3">{generatedPlan.reasoning}</p>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {generatedPlan.tasks.map((task, i) => {
                  const p = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium
                  return (
                    <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg bg-white/3">
                      <span className={`text-xs px-1.5 py-0.5 rounded border flex-shrink-0 ${p.color}`}>{task.priority}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-white">{task.title}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{task.estimatedTime} · {task.category}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-2 mb-4">
        {['all', 'active', 'todo', 'in_progress', 'done'].map(s => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
              filterStatus === s
                ? 'bg-brand-600/20 border-brand-500/30 text-brand-300'
                : 'border-white/10 text-slate-500 hover:text-slate-300'
            }`}
          >
            {s === 'all' ? 'All' : s === 'in_progress' ? 'In Progress' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* Task List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-slate-500 text-sm">Loading tasks...</div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="text-5xl mb-4">✅</div>
          <h3 className="text-lg font-semibold text-white mb-2">No tasks yet</h3>
          <p className="text-slate-500 text-sm max-w-xs">
            Use the AI Planner to generate tasks from your goals, or create a sprint plan.
          </p>
          <button onClick={() => setShowPlanner(true)} className="btn-primary text-sm px-4 py-2 mt-4">
            + Create AI Plan
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              onStatusChange={handleStatusChange}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}
