import { useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Calendar,
  CheckCircle,
  Clock,
  FolderKanban,
  Plus,
  Search,
  User,
} from 'lucide-react';
import Modal from '../components/Modal';
import StatCard from '../components/StatCard';
import { formatShortDate, getDaysUntil, getStatusLabel, isOverdue } from '../lib/workspace';
import type { Task, TaskPriority, TaskStatus } from '../types';

interface ProjectsProps {
  tasks: Task[];
  onAddTask: (task: Omit<Task, 'id'>) => void;
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
}

interface TaskFormState {
  title: string;
  assignee: string;
  dueDate: string;
  priority: TaskPriority;
  status: TaskStatus;
}

const emptyTaskForm: TaskFormState = {
  title: '',
  assignee: 'Founder',
  dueDate: new Date().toISOString().slice(0, 10),
  priority: 'medium',
  status: 'todo',
};

const statusOrder: TaskStatus[] = ['todo', 'in-progress', 'done'];

const statusConfig: Record<TaskStatus, { label: string; icon: typeof Clock; tone: string }> = {
  todo: { label: 'To do', icon: Clock, tone: 'text-slate-300' },
  'in-progress': { label: 'In progress', icon: AlertCircle, tone: 'text-amber-300' },
  done: { label: 'Done', icon: CheckCircle, tone: 'text-emerald-300' },
};

export default function Projects({ tasks, onAddTask, onUpdateTask }: ProjectsProps) {
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formState, setFormState] = useState<TaskFormState>(emptyTaskForm);

  const filteredTasks = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    if (!normalizedSearch) {
      return tasks;
    }

    return tasks.filter((task) =>
      [task.title, task.assignee, task.priority, getStatusLabel(task.status)]
        .join(' ')
        .toLowerCase()
        .includes(normalizedSearch)
    );
  }, [search, tasks]);

  const overdueTasks = tasks.filter((task) => task.status !== 'done' && isOverdue(task.dueDate));
  const upcomingTasks = tasks.filter((task) => task.status !== 'done' && getDaysUntil(task.dueDate) >= 0 && getDaysUntil(task.dueDate) <= 3);
  const completionRate = tasks.length ? Math.round((tasks.filter((task) => task.status === 'done').length / tasks.length) * 100) : 0;

  const tasksByStatus = (status: TaskStatus) =>
    filteredTasks
      .filter((task) => task.status === status)
      .sort((left, right) => new Date(left.dueDate).getTime() - new Date(right.dueDate).getTime());

  const moveTask = (task: Task, direction: -1 | 1) => {
    const currentIndex = statusOrder.indexOf(task.status);
    const nextStatus = statusOrder[currentIndex + direction];
    if (!nextStatus) {
      return;
    }
    onUpdateTask(task.id, { status: nextStatus });
  };

  const submitTask = () => {
    if (!formState.title.trim() || !formState.assignee.trim() || !formState.dueDate) {
      return;
    }

    onAddTask({
      title: formState.title.trim(),
      assignee: formState.assignee.trim(),
      dueDate: new Date(formState.dueDate).toISOString(),
      priority: formState.priority,
      status: formState.status,
    });

    setFormState(emptyTaskForm);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-white/10 bg-slate-900/60 p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-cyan-300">Execution hub</p>
            <h1 className="mt-2 text-3xl font-semibold text-white">Manage tasks with clearer priorities and faster status updates</h1>
            <p className="mt-3 max-w-2xl text-slate-400">
              This board is now searchable, persistent, and more actionable. You can add tasks, move them between stages,
              and quickly spot overdue work before it becomes invisible debt.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            New task
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total tasks"
          value={String(tasks.length)}
          subtitle="Across all delivery stages"
          icon={<FolderKanban className="h-5 w-5 text-cyan-300" />}
          tone="cyan"
        />
        <StatCard
          title="Completion rate"
          value={`${completionRate}%`}
          subtitle={`${tasks.filter((task) => task.status === 'done').length} task(s) shipped`}
          icon={<CheckCircle className="h-5 w-5 text-emerald-300" />}
          tone="emerald"
        />
        <StatCard
          title="Overdue"
          value={String(overdueTasks.length)}
          subtitle="Need immediate attention"
          icon={<AlertCircle className="h-5 w-5 text-rose-300" />}
          tone="rose"
        />
        <StatCard
          title="Due soon"
          value={String(upcomingTasks.length)}
          subtitle="Within the next 3 days"
          icon={<Calendar className="h-5 w-5 text-amber-300" />}
          tone="amber"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-6">
          <h2 className="text-xl font-semibold text-white">Execution autopilot</h2>
          <p className="mt-2 text-sm text-slate-400">A short checklist for keeping the team focused and delivery healthy.</p>
          <div className="mt-5 space-y-3 text-sm text-slate-300">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">Clear overdue tasks before you pull more work into progress.</div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">Keep only the highest-priority work in “In progress” to avoid scattered execution.</div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">Assign every task to a real owner so the board does not become a wish list.</div>
          </div>

          <div className="mt-6">
            <label className="relative block">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by task, assignee, or status"
                className="w-full rounded-2xl border border-white/10 bg-slate-950/50 py-3 pl-11 pr-4 text-sm text-white placeholder-slate-500 focus:border-cyan-500/30 focus:outline-none"
              />
            </label>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-6">
          <h2 className="text-xl font-semibold text-white">Today’s hotspots</h2>
          <div className="mt-4 space-y-3">
            {[...overdueTasks, ...upcomingTasks.filter((task) => !overdueTasks.some((overdue) => overdue.id === task.id))]
              .slice(0, 4)
              .map((task) => (
                <div key={task.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium text-white">{task.title}</p>
                      <p className="mt-1 text-sm text-slate-400">{task.assignee} · {task.priority} priority</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-medium ${isOverdue(task.dueDate) ? 'bg-rose-500/15 text-rose-300' : 'bg-cyan-500/15 text-cyan-300'}`}>
                      {isOverdue(task.dueDate)
                        ? `${Math.abs(getDaysUntil(task.dueDate))} day${Math.abs(getDaysUntil(task.dueDate)) === 1 ? '' : 's'} overdue`
                        : `Due in ${getDaysUntil(task.dueDate)} day${getDaysUntil(task.dueDate) === 1 ? '' : 's'}`}
                    </span>
                  </div>
                </div>
              ))}
            {!overdueTasks.length && !upcomingTasks.length ? (
              <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-4 text-sm text-slate-400">
                Nothing urgent right now. Add a task or pull the next priority into motion.
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        {statusOrder.map((status) => {
          const columnTasks = tasksByStatus(status);
          const config = statusConfig[status];
          const StatusIcon = config.icon;

          return (
            <div key={status} className="rounded-3xl border border-white/10 bg-slate-900/60 p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-white/5 p-3">
                    <StatusIcon className={`h-5 w-5 ${config.tone}`} />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white">{config.label}</h2>
                    <p className="text-sm text-slate-400">{columnTasks.length} task(s)</p>
                  </div>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {columnTasks.map((task) => (
                  <div key={task.id} className="rounded-3xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-white">{task.title}</p>
                        <p className="mt-2 text-sm text-slate-400">{task.priority} priority · due {formatShortDate(task.dueDate)}</p>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs font-medium ${isOverdue(task.dueDate) && task.status !== 'done' ? 'bg-rose-500/15 text-rose-300' : 'bg-slate-800 text-slate-300'}`}>
                        {isOverdue(task.dueDate) && task.status !== 'done' ? 'Overdue' : config.label}
                      </span>
                    </div>
                    <div className="mt-4 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-sm text-slate-300">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 text-white">
                          <User className="h-4 w-4" />
                        </div>
                        {task.assignee}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => moveTask(task, -1)}
                          disabled={task.status === 'todo'}
                          className="rounded-xl border border-white/10 p-2 text-slate-300 transition-colors hover:border-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                          aria-label="Move task left"
                        >
                          <ArrowLeft className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveTask(task, 1)}
                          disabled={task.status === 'done'}
                          className="rounded-xl border border-white/10 p-2 text-slate-300 transition-colors hover:border-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                          aria-label="Move task right"
                        >
                          <ArrowRight className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {!columnTasks.length ? (
                  <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.03] p-4 text-sm text-slate-400">
                    No tasks in this column yet.
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </section>

      <Modal
        open={isModalOpen}
        title="Create a new task"
        description="Add the task, assign an owner, and place it in the right stage so it becomes actionable immediately."
        onClose={() => setIsModalOpen(false)}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2 md:col-span-2">
            <span className="text-sm text-slate-300">Task title</span>
            <input
              value={formState.title}
              onChange={(event) => setFormState((current) => ({ ...current, title: event.target.value }))}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white focus:border-cyan-500/30 focus:outline-none"
              placeholder="Ship onboarding checklist"
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm text-slate-300">Assignee</span>
            <input
              value={formState.assignee}
              onChange={(event) => setFormState((current) => ({ ...current, assignee: event.target.value }))}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white focus:border-cyan-500/30 focus:outline-none"
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm text-slate-300">Due date</span>
            <input
              type="date"
              value={formState.dueDate}
              onChange={(event) => setFormState((current) => ({ ...current, dueDate: event.target.value }))}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white focus:border-cyan-500/30 focus:outline-none"
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm text-slate-300">Priority</span>
            <select
              value={formState.priority}
              onChange={(event) => setFormState((current) => ({ ...current, priority: event.target.value as TaskPriority }))}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white focus:border-cyan-500/30 focus:outline-none"
            >
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-sm text-slate-300">Starting status</span>
            <select
              value={formState.status}
              onChange={(event) => setFormState((current) => ({ ...current, status: event.target.value as TaskStatus }))}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white focus:border-cyan-500/30 focus:outline-none"
            >
              <option value="todo">To do</option>
              <option value="in-progress">In progress</option>
              <option value="done">Done</option>
            </select>
          </label>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={submitTask}
            className="rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-3 font-medium text-white transition-opacity hover:opacity-90"
          >
            Save task
          </button>
        </div>
      </Modal>
    </div>
  );
}
