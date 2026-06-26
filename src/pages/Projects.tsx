import { useState } from 'react';
import {
  FolderKanban,
  Plus,
  Clock,
  CheckCircle,
  AlertCircle,
  Calendar,
  User,
} from 'lucide-react';
import { useTable } from '../hooks/useTable';
import Modal from '../components/Modal';
import { useToast } from '../components/useToast';

interface Task {
  id: string;
  title: string;
  assignee: string;
  dueDate: string;
  priority: 'high' | 'medium' | 'low';
  status: 'todo' | 'in-progress' | 'done';
  description?: string;
}

const initialTasks: Task[] = [
  { id: '1', title: 'Design system documentation', assignee: 'Alex', dueDate: '2026-06-28', priority: 'high', status: 'todo', description: '' },
  { id: '2', title: 'API integration for payments', assignee: 'Sam', dueDate: '2026-06-30', priority: 'high', status: 'in-progress', description: '' },
  { id: '3', title: 'User onboarding flow', assignee: 'Jordan', dueDate: '2026-07-02', priority: 'medium', status: 'in-progress', description: '' },
  { id: '4', title: 'Analytics dashboard', assignee: 'Alex', dueDate: '2026-07-05', priority: 'medium', status: 'todo', description: '' },
  { id: '5', title: 'Email notification system', assignee: 'Sam', dueDate: '2026-07-08', priority: 'low', status: 'done', description: '' },
  { id: '6', title: 'Mobile responsive fixes', assignee: 'Taylor', dueDate: '2026-07-10', priority: 'low', status: 'done', description: '' },
];

const priorityColors: Record<string, string> = {
  high: 'bg-rose-500',
  medium: 'bg-amber-500',
  low: 'bg-cyan-500',
};

const priorityPillColors: Record<string, string> = {
  high: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
  medium: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  low: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
};

const statusConfig: Record<string, { label: string; icon: typeof Clock; color: string }> = {
  todo: { label: 'To Do', icon: Clock, color: 'text-slate-400' },
  'in-progress': { label: 'In Progress', icon: AlertCircle, color: 'text-amber-400' },
  done: { label: 'Done', icon: CheckCircle, color: 'text-emerald-400' },
};

const columns = ['todo', 'in-progress', 'done'] as const;
const assignees = ['Alex', 'Sam', 'Jordan', 'Taylor'];

export default function Projects() {
  const toast = useToast();
  const { rows: tasks, addRow, updateRow } = useTable<Task>('tasks', initialTasks);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [draggedTask, setDraggedTask] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  // Add form
  const [formData, setFormData] = useState({
    title: '',
    assignee: 'Alex',
    dueDate: '',
    priority: 'medium' as Task['priority'],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Expand modal form
  const [expandData, setExpandData] = useState({
    title: '',
    description: '',
    assignee: 'Alex',
    priority: 'medium' as Task['priority'],
    dueDate: '',
    status: 'todo' as Task['status'],
  });

  const getTasksByStatus = (status: string) => tasks.filter((task) => task.status === status);
  const doneCount = tasks.filter((t) => t.status === 'done').length;
  const totalCount = tasks.length;
  const progress = totalCount > 0 ? (doneCount / totalCount) * 100 : 0;

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.dueDate) newErrors.dueDate = 'Due date is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddTask = async () => {
    if (!validateForm()) return;
    await addRow({
      title: formData.title,
      assignee: formData.assignee,
      dueDate: formData.dueDate,
      priority: formData.priority,
      status: 'todo',
      description: '',
    });
    toast('Task added successfully');
    setShowAddModal(false);
    setFormData({ title: '', assignee: 'Alex', dueDate: '', priority: 'medium' });
    setErrors({});
  };

  const handleDragStart = (taskId: string) => setDraggedTask(taskId);
  const handleDragOver = (e: React.DragEvent, col: string) => {
    e.preventDefault();
    setDragOverCol(col);
  };
  const handleDrop = async (col: string) => {
    if (!draggedTask) return;
    const task = tasks.find((t) => t.id === draggedTask);
    if (task && task.status !== col) {
      await updateRow(draggedTask, { status: col as Task['status'] });
      toast(`Task moved to ${statusConfig[col].label}`);
    }
    setDraggedTask(null);
    setDragOverCol(null);
  };

  const openExpand = (task: Task) => {
    setSelectedTask(task);
    setExpandData({
      title: task.title,
      description: task.description ?? '',
      assignee: task.assignee,
      priority: task.priority,
      dueDate: task.dueDate,
      status: task.status,
    });
  };

  const saveExpand = async () => {
    if (!selectedTask) return;
    await updateRow(selectedTask.id, expandData);
    toast('Task updated');
    setSelectedTask(null);
  };

  const startInlineEdit = (task: Task) => {
    setEditingId(task.id);
    setEditValue(task.title);
  };

  const saveInlineEdit = async (taskId: string) => {
    if (editValue.trim()) {
      await updateRow(taskId, { title: editValue.trim() });
      toast('Task title updated');
    }
    setEditingId(null);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Projects</h1>
          <p className="text-slate-400 mt-1">Manage your tasks and track progress.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          New Task
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Tasks', value: tasks.length, icon: FolderKanban },
          { label: 'To Do', value: tasks.filter((t) => t.status === 'todo').length, icon: Clock },
          { label: 'In Progress', value: tasks.filter((t) => t.status === 'in-progress').length, icon: AlertCircle },
          { label: 'Completed', value: doneCount, icon: CheckCircle },
        ].map((stat, i) => (
          <div key={i} className="p-4 rounded-xl bg-slate-800/50 backdrop-blur-sm border border-white/10">
            <stat.icon className="w-5 h-5 text-cyan-400 mb-2" />
            <p className="text-2xl font-bold text-white">{stat.value}</p>
            <p className="text-sm text-slate-400">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Burndown mini-chart */}
      <div className="rounded-2xl bg-slate-800/50 backdrop-blur-sm border border-white/10 p-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-white">Progress</h2>
          <span className="text-sm text-slate-400">{doneCount}/{totalCount} done • {Math.round(progress)}%</span>
        </div>
        <div className="h-3 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {columns.map((column) => {
          const colTasks = getTasksByStatus(column);
          const config = statusConfig[column];
          const Icon = config.icon;
          return (
            <div
              key={column}
              onDragOver={(e) => handleDragOver(e, column)}
              onDragLeave={() => setDragOverCol(null)}
              onDrop={() => handleDrop(column)}
              className={`space-y-4 rounded-xl p-3 transition-colors ${
                dragOverCol === column ? 'bg-cyan-500/5 border border-cyan-500/30' : ''
              }`}
            >
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <Icon className={`w-4 h-4 ${config.color}`} />
                  <h3 className="font-semibold text-white">{config.label}</h3>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-white/10 text-xs text-slate-400">
                  {colTasks.length}
                </span>
              </div>

              <div className="space-y-3">
                {colTasks.map((task) => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={() => handleDragStart(task.id)}
                    onClick={() => openExpand(task)}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      startInlineEdit(task);
                    }}
                    className="group p-4 rounded-xl bg-slate-800/50 backdrop-blur-sm border border-white/10 hover:border-cyan-500/30 transition-all cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-3">
                      {editingId === task.id ? (
                        <input
                          autoFocus
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => saveInlineEdit(task.id)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveInlineEdit(task.id);
                            if (e.key === 'Escape') setEditingId(null);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="flex-1 bg-white/10 border border-cyan-500/50 rounded px-2 py-1 text-white text-sm focus:outline-none"
                        />
                      ) : (
                        <h4 className="text-white font-medium">{task.title}</h4>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center">
                          <User className="w-3 h-3 text-white" />
                        </div>
                        <span className="text-xs text-slate-400">{task.assignee}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${priorityColors[task.priority]}`} />
                        <div className="flex items-center gap-1 text-xs text-slate-400">
                          <Calendar className="w-3 h-3" />
                          {task.dueDate}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  onClick={() => {
                    setFormData({ title: '', assignee: 'Alex', dueDate: '', priority: 'medium' });
                    setShowAddModal(true);
                  }}
                  className="w-full p-3 rounded-xl border-2 border-dashed border-white/20 hover:border-cyan-500/50 text-slate-400 hover:text-white transition-all flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Task
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Task Modal */}
      <Modal open={showAddModal} onClose={() => setShowAddModal(false)} title="Add New Task">
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-slate-300 mb-1.5">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="Task title"
              className={`w-full bg-white/5 border rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none transition-colors ${
                errors.title ? 'border-rose-500/50' : 'border-white/10 focus:border-cyan-500/50'
              }`}
            />
            {errors.title && <p className="text-xs text-rose-400 mt-1">{errors.title}</p>}
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1.5">Assignee</label>
            <select
              value={formData.assignee}
              onChange={(e) => setFormData((prev) => ({ ...prev, assignee: e.target.value }))}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500/50"
            >
              {assignees.map((a) => (
                <option key={a} value={a} className="bg-slate-800">{a}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1.5">Due Date</label>
            <input
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData((prev) => ({ ...prev, dueDate: e.target.value }))}
              className={`w-full bg-white/5 border rounded-xl px-4 py-2.5 text-white focus:outline-none transition-colors ${
                errors.dueDate ? 'border-rose-500/50' : 'border-white/10 focus:border-cyan-500/50'
              }`}
            />
            {errors.dueDate && <p className="text-xs text-rose-400 mt-1">{errors.dueDate}</p>}
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1.5">Priority</label>
            <div className="flex gap-2">
              {(['high', 'medium', 'low'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setFormData((prev) => ({ ...prev, priority: p }))}
                  className={`flex-1 py-2 rounded-xl border text-sm capitalize transition-all ${
                    formData.priority === p
                      ? priorityPillColors[p]
                      : 'border-white/10 text-slate-400 hover:text-white'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={handleAddTask}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium hover:opacity-90 transition-opacity"
          >
            Add Task
          </button>
        </div>
      </Modal>

      {/* Task Expand Modal */}
      <Modal open={Boolean(selectedTask)} onClose={() => setSelectedTask(null)} title="Edit Task" maxWidth="max-w-xl">
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-slate-300 mb-1.5">Title</label>
            <input
              type="text"
              value={expandData.title}
              onChange={(e) => setExpandData((prev) => ({ ...prev, title: e.target.value }))}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500/50"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1.5">Description</label>
            <textarea
              value={expandData.description}
              onChange={(e) => setExpandData((prev) => ({ ...prev, description: e.target.value }))}
              rows={4}
              placeholder="Task description..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-300 mb-1.5">Assignee</label>
              <select
                value={expandData.assignee}
                onChange={(e) => setExpandData((prev) => ({ ...prev, assignee: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500/50"
              >
                {assignees.map((a) => (
                  <option key={a} value={a} className="bg-slate-800">{a}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1.5">Due Date</label>
              <input
                type="date"
                value={expandData.dueDate}
                onChange={(e) => setExpandData((prev) => ({ ...prev, dueDate: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500/50"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1.5">Priority</label>
            <div className="flex gap-2">
              {(['high', 'medium', 'low'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setExpandData((prev) => ({ ...prev, priority: p }))}
                  className={`flex-1 py-2 rounded-xl border text-sm capitalize transition-all ${
                    expandData.priority === p
                      ? priorityPillColors[p]
                      : 'border-white/10 text-slate-400 hover:text-white'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1.5">Status</label>
            <select
              value={expandData.status}
              onChange={(e) => setExpandData((prev) => ({ ...prev, status: e.target.value as Task['status'] }))}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500/50"
            >
              {columns.map((c) => (
                <option key={c} value={c} className="bg-slate-800">{statusConfig[c].label}</option>
              ))}
            </select>
          </div>
          <button
            onClick={saveExpand}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium hover:opacity-90 transition-opacity"
          >
            Save Changes
          </button>
        </div>
      </Modal>
    </div>
  );
}
