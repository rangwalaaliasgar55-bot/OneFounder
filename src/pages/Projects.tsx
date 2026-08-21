import { useState } from 'react';
import {
  FolderKanban,
  Plus,
  Clock,
  CheckCircle,
  AlertCircle,
  Calendar,
  MoreHorizontal,
  User,
} from 'lucide-react';

interface Task {
  id: string;
  title: string;
  assignee: string;
  dueDate: string;
  priority: 'high' | 'medium' | 'low';
  status: 'todo' | 'in-progress' | 'done';
}

const initialTasks: Task[] = [
  { id: '1', title: 'Design system documentation', assignee: 'Alex', dueDate: 'Jun 28', priority: 'high', status: 'todo' },
  { id: '2', title: 'API integration for payments', assignee: 'Sam', dueDate: 'Jun 30', priority: 'high', status: 'in-progress' },
  { id: '3', title: 'User onboarding flow', assignee: 'Jordan', dueDate: 'Jul 2', priority: 'medium', status: 'in-progress' },
  { id: '4', title: 'Analytics dashboard', assignee: 'Alex', dueDate: 'Jul 5', priority: 'medium', status: 'todo' },
  { id: '5', title: 'Email notification system', assignee: 'Sam', dueDate: 'Jul 8', priority: 'low', status: 'done' },
  { id: '6', title: 'Mobile responsive fixes', assignee: 'Taylor', dueDate: 'Jul 10', priority: 'low', status: 'done' },
];

const priorityColors = {
  high: 'bg-rose-500',
  medium: 'bg-amber-500',
  low: 'bg-cyan-500',
};

const statusConfig = {
  todo: { label: 'To Do', icon: Clock, color: 'text-slate-400' },
  'in-progress': { label: 'In Progress', icon: AlertCircle, color: 'text-amber-400' },
  done: { label: 'Done', icon: CheckCircle, color: 'text-emerald-400' },
};

export default function Projects() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);

  const columns = [
    { id: 'todo', title: 'To Do' },
    { id: 'in-progress', title: 'In Progress' },
    { id: 'done', title: 'Done' },
  ];

  const getTasksByStatus = (status: string) => tasks.filter((task) => task.status === status);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Projects</h1>
          <p className="text-slate-400 mt-1">Manage your tasks and track progress.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium hover:opacity-90 transition-opacity">
          <Plus className="w-4 h-4" />
          New Task
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Tasks', value: tasks.length, icon: FolderKanban },
          { label: 'To Do', value: tasks.filter((t) => t.status === 'todo').length, icon: Clock },
          { label: 'In Progress', value: tasks.filter((t) => t.status === 'in-progress').length, icon: AlertCircle },
          { label: 'Completed', value: tasks.filter((t) => t.status === 'done').length, icon: CheckCircle },
        ].map((stat, i) => (
          <div key={i} className="p-4 rounded-xl bg-slate-800/50 backdrop-blur-sm border border-white/10">
            <stat.icon className="w-5 h-5 text-cyan-400 mb-2" />
            <p className="text-2xl font-bold text-white">{stat.value}</p>
            <p className="text-sm text-slate-400">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {columns.map((column) => (
          <div key={column.id} className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                {(() => {
                  const config = statusConfig[column.id as keyof typeof statusConfig];
                  const Icon = config.icon;
                  return (
                    <>
                      <Icon className={`w-4 h-4 ${config.color}`} />
                      <h3 className="font-semibold text-white">{column.title}</h3>
                    </>
                  );
                })()}
                <span className="px-2 py-0.5 rounded-full bg-white/10 text-xs text-slate-400">
                  {getTasksByStatus(column.id).length}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              {getTasksByStatus(column.id).map((task) => (
                <div
                  key={task.id}
                  className="group p-4 rounded-xl bg-slate-800/50 backdrop-blur-sm border border-white/10 hover:border-cyan-500/30 transition-all cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="text-white font-medium">{task.title}</h4>
                    <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-white/10 rounded">
                      <MoreHorizontal className="w-4 h-4 text-slate-400" />
                    </button>
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

              {/* Add Task Button */}
              <button className="w-full p-3 rounded-xl border-2 border-dashed border-white/20 hover:border-cyan-500/50 text-slate-400 hover:text-white transition-all flex items-center justify-center gap-2">
                <Plus className="w-4 h-4" />
                Add Task
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
