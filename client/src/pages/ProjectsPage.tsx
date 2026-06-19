import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import { PageHeader } from '../components/ui/PageHeader'
import { EmptyStateAnimated } from '../components/ui/EmptyStateAnimated'
import { Modal } from '../components/ui/Modal'
import { PageLoader } from '../components/ui/LoadingSpinner'
import { MeshGradient } from '../components/ui/MeshGradient'

const TASK_STATUS = ['todo', 'in_progress', 'done']
const STATUS_LABELS: Record<string, string> = { todo: 'To Do', in_progress: 'In Progress', done: 'Done' }
const STATUS_COLORS: Record<string, string> = {
  todo: 'bg-slate-500/20 text-slate-400',
  in_progress: 'bg-blue-500/20 text-blue-400',
  done: 'bg-green-500/20 text-green-400',
  cancelled: 'bg-red-500/20 text-red-400',
}
const PRIORITY_COLORS: Record<string, string> = {
  low: 'text-green-400',
  medium: 'text-yellow-400',
  high: 'text-orange-400',
  urgent: 'text-red-400',
}

export function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([])
  const [selected, setSelected] = useState<any | null>(null)
  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showProjectModal, setShowProjectModal] = useState(false)
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [projectForm, setProjectForm] = useState({ name: '', description: '', emoji: '🚀', color: '#6366f1' })
  const [taskForm, setTaskForm] = useState({ title: '', description: '', priority: 'medium', status: 'todo' })

  useEffect(() => {
    api.get<any[]>('/projects').then(setProjects).finally(() => setLoading(false))
  }, [])

  const selectProject = async (project: any) => {
    setSelected(project)
    const data = await api.get<any>(`/projects/${project.id}`)
    setTasks(data.tasks || [])
  }

  const createProject = async () => {
    const project = await api.post<any>('/projects', projectForm)
    setProjects(prev => [project, ...prev])
    setShowProjectModal(false)
    setProjectForm({ name: '', description: '', emoji: '🚀', color: '#6366f1' })
  }

  const createTask = async () => {
    if (!selected) return
    const task = await api.post<any>(`/projects/${selected.id}/tasks`, taskForm)
    setTasks(prev => [task, ...prev])
    setShowTaskModal(false)
    setTaskForm({ title: '', description: '', priority: 'medium', status: 'todo' })
  }

  const updateTaskStatus = async (taskId: string, status: string) => {
    const updated = await api.patch<any>(`/projects/tasks/${taskId}`, { status, completedAt: status === 'done' ? new Date() : null })
    setTasks(prev => prev.map(t => t.id === taskId ? updated : t))
  }

  const deleteProject = async (id: string) => {
    await api.delete(`/projects/${id}`)
    setProjects(projects.filter(p => p.id !== id))
    if (selected?.id === id) { setSelected(null); setTasks([]) }
  }

  if (loading) return <PageLoader />

  const groupedTasks = TASK_STATUS.reduce((acc, status) => {
    acc[status] = tasks.filter(t => t.status === status)
    return acc
  }, {} as Record<string, any[]>)

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PageHeader
        icon="🎯"
        title="Projects"
        description="Manage projects, milestones, and tasks with Kanban boards"
        action={<button onClick={() => setShowProjectModal(true)} className="btn-primary">+ New Project</button>}
      />

      {projects.length === 0 ? (
        <EmptyStateAnimated
          icon="🎯"
          title="No projects yet"
          description="Create your first project to start tracking progress and managing tasks"
          action={{ label: 'Create Project', onClick: () => setShowProjectModal(true) }}
        />
      ) : (
        <div className="flex gap-6 h-[calc(100vh-200px)]">
          <div className="w-64 flex-shrink-0 space-y-2 overflow-y-auto pr-1">
            {projects.map(project => (
              <button
                key={project.id}
                onClick={() => selectProject(project)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all duration-200 ${
                  selected?.id === project.id
                    ? 'border-brand-500/40 bg-brand-600/15 text-white'
                    : 'border-white/5 glass text-slate-400 hover:text-white hover:bg-white/10'
                }`}
              >
                <span className="text-xl flex-shrink-0">{project.emoji || '🚀'}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{project.name}</div>
                  <div className="text-xs text-slate-500 truncate">{project.description}</div>
                </div>
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-hidden">
            {!selected ? (
              <div className="h-full flex items-center justify-center">
                <p className="text-slate-500">Select a project to view tasks</p>
              </div>
            ) : (
              <div className="h-full flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{selected.emoji}</span>
                    <div>
                      <h2 className="text-lg font-bold text-white">{selected.name}</h2>
                      {selected.description && <p className="text-sm text-slate-400">{selected.description}</p>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setShowTaskModal(true)} className="btn-primary text-sm py-1.5">+ Task</button>
                    <button onClick={() => deleteProject(selected.id)} className="btn-ghost text-red-400 hover:text-red-300 text-sm py-1.5">Delete</button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 flex-1 overflow-hidden">
                  {TASK_STATUS.map(status => (
                    <div key={status} className="flex flex-col glass rounded-xl p-3 overflow-hidden">
                      <div className="flex items-center gap-2 mb-3">
                        <span className={`badge ${STATUS_COLORS[status]}`}>{STATUS_LABELS[status]}</span>
                        <span className="text-xs text-slate-500">{groupedTasks[status]?.length || 0}</span>
                      </div>
                      <div className="flex-1 overflow-y-auto space-y-2">
                        {(groupedTasks[status] || []).map(task => (
                          <div key={task.id} className="glass rounded-lg p-3 hover:bg-white/10 transition-colors">
                            <div className="text-sm text-white mb-1">{task.title}</div>
                            {task.description && <p className="text-xs text-slate-500 mb-2 line-clamp-2">{task.description}</p>}
                            <div className="flex items-center justify-between">
                              <span className={`text-xs font-medium ${PRIORITY_COLORS[task.priority] || ''}`}>
                                {task.priority}
                              </span>
                              <div className="flex gap-1">
                                {TASK_STATUS.filter(s => s !== status).map(s => (
                                  <button
                                    key={s}
                                    onClick={() => updateTaskStatus(task.id, s)}
                                    className="text-xs glass px-2 py-0.5 rounded text-slate-400 hover:text-white transition-colors"
                                  >
                                    → {s.replace('_', ' ')}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        ))}
                        {(groupedTasks[status] || []).length === 0 && (
                          <div className="text-center text-xs text-slate-600 py-6">No {STATUS_LABELS[status]} tasks</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <Modal isOpen={showProjectModal} onClose={() => setShowProjectModal(false)} title="New Project">
        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="w-20">
              <label className="label">Emoji</label>
              <input className="input text-center text-2xl" value={projectForm.emoji} onChange={e => setProjectForm({ ...projectForm, emoji: e.target.value })} />
            </div>
            <div className="flex-1">
              <label className="label">Project Name</label>
              <input className="input" placeholder="My SaaS Project" value={projectForm.name} onChange={e => setProjectForm({ ...projectForm, name: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input resize-none h-20" placeholder="What is this project about?" value={projectForm.description} onChange={e => setProjectForm({ ...projectForm, description: e.target.value })} />
          </div>
          <div className="flex justify-end gap-3">
            <button className="btn-secondary" onClick={() => setShowProjectModal(false)}>Cancel</button>
            <button className="btn-primary" onClick={createProject} disabled={!projectForm.name.trim()}>Create Project</button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showTaskModal} onClose={() => setShowTaskModal(false)} title="Add Task">
        <div className="space-y-4">
          <div>
            <label className="label">Task Title</label>
            <input className="input" placeholder="Task description..." value={taskForm.title} onChange={e => setTaskForm({ ...taskForm, title: e.target.value })} />
          </div>
          <div>
            <label className="label">Description (optional)</label>
            <textarea className="input resize-none h-20" placeholder="More details..." value={taskForm.description} onChange={e => setTaskForm({ ...taskForm, description: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Priority</label>
              <select className="input" value={taskForm.priority} onChange={e => setTaskForm({ ...taskForm, priority: e.target.value })}>
                {['low', 'medium', 'high', 'urgent'].map(p => <option key={p} value={p} className="bg-surface-900 capitalize">{p}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Status</label>
              <select className="input" value={taskForm.status} onChange={e => setTaskForm({ ...taskForm, status: e.target.value })}>
                {TASK_STATUS.map(s => <option key={s} value={s} className="bg-surface-900">{STATUS_LABELS[s]}</option>)}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button className="btn-secondary" onClick={() => setShowTaskModal(false)}>Cancel</button>
            <button className="btn-primary" onClick={createTask} disabled={!taskForm.title.trim()}>Add Task</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
