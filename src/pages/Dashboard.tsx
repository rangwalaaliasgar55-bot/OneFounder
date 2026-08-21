import { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Target,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  Zap,
  Calendar,
  CheckCircle,
} from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string;
  change: number;
  icon: React.ReactNode;
  color: 'cyan' | 'emerald' | 'amber' | 'rose';
}

function MetricCard({ title, value, change, icon, color }: MetricCardProps) {
  const colorClasses = {
    cyan: 'from-cyan-500/20 to-blue-600/20 border-cyan-500/30 text-cyan-400',
    emerald: 'from-emerald-500/20 to-teal-600/20 border-emerald-500/30 text-emerald-400',
    amber: 'from-amber-500/20 to-orange-600/20 border-amber-500/30 text-amber-400',
    rose: 'from-rose-500/20 to-pink-600/20 border-rose-500/30 text-rose-400',
  };

  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${colorClasses[color]} border backdrop-blur-sm p-5 group hover:scale-[1.02] transition-transform duration-300`}
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="relative">
        <div className="flex items-center justify-between mb-3">
          <span className="text-slate-300 text-sm font-medium">{title}</span>
          <div className={`p-2 rounded-lg bg-white/10 ${colorClasses[color].split(' ').pop()}`}>
            {icon}
          </div>
        </div>
        <div className="flex items-end justify-between">
          <p className="text-3xl font-bold text-white">{value}</p>
          <div
            className={`flex items-center gap-1 text-sm ${
              change >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {change >= 0 ? (
              <ArrowUpRight className="w-4 h-4" />
            ) : (
              <ArrowDownRight className="w-4 h-4" />
            )}
            <span>{Math.abs(change)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function TaskItem({ title, completed, priority }: { title: string; completed: boolean; priority: 'high' | 'medium' | 'low' }) {
  const priorityColors = {
    high: 'bg-rose-500',
    medium: 'bg-amber-500',
    low: 'bg-cyan-500',
  };

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors group">
      <div
        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
          completed ? 'bg-emerald-500 border-emerald-500' : 'border-slate-600'
        }`}
      >
        {completed && <CheckCircle className="w-4 h-4 text-white" />}
      </div>
      <div className="flex-1">
        <p className={`text-sm ${completed ? 'text-slate-500 line-through' : 'text-white'}`}>
          {title}
        </p>
      </div>
      <div className={`w-2 h-2 rounded-full ${priorityColors[priority]}`} />
    </div>
  );
}

export default function Dashboard() {
  const [greeting, setGreeting] = useState('Good morning');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 12 && hour < 17) setGreeting('Good afternoon');
    else if (hour >= 17) setGreeting('Good evening');
  }, []);

  const metrics: MetricCardProps[] = [
    { title: 'Monthly Revenue', value: '$12,450', change: 12.5, icon: <DollarSign className="w-5 h-5" />, color: 'emerald' },
    { title: 'Total Leads', value: '284', change: 8.2, icon: <Users className="w-5 h-5" />, color: 'cyan' },
    { title: 'Conversion Rate', value: '3.2%', change: -2.1, icon: <Target className="w-5 h-5" />, color: 'amber' },
    { title: 'Active Projects', value: '7', change: 5.0, icon: <BarChart3 className="w-5 h-5" />, color: 'rose' },
  ];

  const tasks = [
    { title: 'Review Q3 financial projections', completed: false, priority: 'high' as const },
    { title: 'Follow up with enterprise leads', completed: false, priority: 'high' as const },
    { title: 'Update landing page copy', completed: true, priority: 'medium' as const },
    { title: 'Prepare investor pitch deck', completed: false, priority: 'medium' as const },
    { title: 'Team sync meeting', completed: true, priority: 'low' as const },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">
            {greeting}, Founder
          </h1>
          <p className="text-slate-400 mt-1">Here's what's happening with your business today.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10">
          <Calendar className="w-4 h-4 text-cyan-400" />
          <span className="text-sm text-slate-300">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </span>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric) => (
          <MetricCard key={metric.title} {...metric} />
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* AI Insights */}
        <div className="lg:col-span-2 rounded-2xl bg-slate-800/50 backdrop-blur-sm border border-white/10 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-lg font-semibold text-white">AI Insights</h2>
          </div>
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-500/10 to-transparent border-l-2 border-cyan-500">
              <p className="text-slate-200 leading-relaxed">
                <span className="text-cyan-400 font-semibold">Revenue Opportunity:</span> Your email open rates increased 23% this week. Consider sending a promotional campaign to capitalize on engagement.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 to-transparent border-l-2 border-emerald-500">
              <p className="text-slate-200 leading-relaxed">
                <span className="text-emerald-400 font-semibold">Growth Tip:</span> You're 15% away from your Q3 goal. Focus on converting the 12 warm leads in your pipeline.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 to-transparent border-l-2 border-amber-500">
              <p className="text-slate-200 leading-relaxed">
                <span className="text-amber-400 font-semibold">Alert:</span> Your burn rate is trending 8% above target. Review subscriptions and operational costs.
              </p>
            </div>
          </div>
        </div>

        {/* Tasks */}
        <div className="rounded-2xl bg-slate-800/50 backdrop-blur-sm border border-white/10 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Today's Tasks</h2>
            <span className="text-sm text-slate-400">{tasks.filter(t => t.completed).length}/{tasks.length}</span>
          </div>
          <div className="space-y-1">
            {tasks.map((task, i) => (
              <TaskItem key={i} {...task} />
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'New Project', icon: <Zap className="w-5 h-5" />, color: 'from-cyan-500 to-blue-600' },
          { label: 'Add Lead', icon: <Users className="w-5 h-5" />, color: 'from-emerald-500 to-teal-600' },
          { label: 'Log Expense', icon: <DollarSign className="w-5 h-5" />, color: 'from-amber-500 to-orange-600' },
          { label: 'AI Chat', icon: <Sparkles className="w-5 h-5" />, color: 'from-violet-500 to-purple-600' },
        ].map((action, i) => (
          <button
            key={i}
            className={`flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r ${action.color} hover:opacity-90 transition-opacity`}
          >
            <div className="p-2 rounded-lg bg-white/20">{action.icon}</div>
            <span className="font-medium text-white">{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
