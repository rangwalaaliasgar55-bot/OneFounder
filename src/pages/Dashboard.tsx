import { useState, useEffect, useMemo } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import {
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
  X,
} from 'lucide-react';
import { askAI } from '../lib/ai';
import { SkeletonCard } from '../components/Skeleton';
import { useToast } from '../components/useToast';

interface MetricCardProps {
  title: string;
  value: string;
  change: number;
  icon: ReactNode;
  color: 'cyan' | 'emerald' | 'amber' | 'rose';
  onClick?: () => void;
}

const colorClasses = {
  cyan: 'from-cyan-500/20 to-blue-600/20 border-cyan-500/30 text-cyan-400',
  emerald: 'from-emerald-500/20 to-teal-600/20 border-emerald-500/30 text-emerald-400',
  amber: 'from-amber-500/20 to-orange-600/20 border-amber-500/30 text-amber-400',
  rose: 'from-rose-500/20 to-pink-600/20 border-rose-500/30 text-rose-400',
};

const iconTextColor = {
  cyan: 'text-cyan-400',
  emerald: 'text-emerald-400',
  amber: 'text-amber-400',
  rose: 'text-rose-400',
};

function MetricCard({ title, value, change, icon, color, onClick }: MetricCardProps) {
  return (
    <button
      onClick={onClick}
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${colorClasses[color]} border backdrop-blur-sm p-5 group hover:scale-[1.02] transition-transform duration-300 text-left w-full`}
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="relative">
        <div className="flex items-center justify-between mb-3">
          <span className="text-slate-300 text-sm font-medium">{title}</span>
          <div className={`p-2 rounded-lg bg-white/10 ${iconTextColor[color]}`}>
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
    </button>
  );
}

interface Insight {
  type: string;
  color: string;
  title: string;
  body: string;
}

const insightColorMap: Record<string, string> = {
  cyan: 'from-cyan-500/10 to-transparent border-cyan-500',
  emerald: 'from-emerald-500/10 to-transparent border-emerald-500',
  amber: 'from-amber-500/10 to-transparent border-amber-500',
  rose: 'from-rose-500/10 to-transparent border-rose-500',
};

const fallbackInsights: Insight[] = [
  { type: 'revenue', color: 'cyan', title: 'Revenue Opportunity', body: 'Your email open rates increased 23% this week. Consider sending a promotional campaign to capitalize on engagement.' },
  { type: 'growth', color: 'emerald', title: 'Growth Tip', body: "You're 15% away from your Q3 goal. Focus on converting the 12 warm leads in your pipeline." },
  { type: 'alert', color: 'amber', title: 'Alert', body: 'Your burn rate is trending 8% above target. Review subscriptions and operational costs.' },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const toast = useToast();
  const [greeting, setGreeting] = useState('Good morning');
  const [insights, setInsights] = useState<Insight[]>([]);
  const [insightsLoading, setInsightsLoading] = useState(true);
  const [showBanner, setShowBanner] = useState(false);
  const [tasks, setTasks] = useState([
    { id: '1', title: 'Review Q3 financial projections', completed: false, priority: 'high' as const },
    { id: '2', title: 'Follow up with enterprise leads', completed: false, priority: 'high' as const },
    { id: '3', title: 'Update landing page copy', completed: true, priority: 'medium' as const },
    { id: '4', title: 'Prepare investor pitch deck', completed: false, priority: 'medium' as const },
    { id: '5', title: 'Team sync meeting', completed: true, priority: 'low' as const },
  ]);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 12 && hour < 17) setGreeting('Good afternoon');
    else if (hour >= 17) setGreeting('Good evening');

    const dismissed = localStorage.getItem('onefounder_welcome_dismissed');
    if (!dismissed) setShowBanner(true);
  }, []);

  useEffect(() => {
    const prompt =
      'Give 3 brief, actionable insights for a SaaS founder with MRR $12,450 and 284 leads. JSON only: [{type, color, title, body}]. Colors: cyan, emerald, amber.';
    askAI([{ role: 'user', content: prompt }], 'You are a startup advisor. Respond with valid JSON only.')
      .then((res) => {
        try {
          const parsed = JSON.parse(res.text);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setInsights(parsed);
          } else {
            setInsights(fallbackInsights);
          }
        } catch {
          setInsights(fallbackInsights);
        }
      })
      .catch(() => setInsights(fallbackInsights))
      .finally(() => setInsightsLoading(false));
  }, []);

  const metrics: MetricCardProps[] = useMemo(() => [
    { title: 'Monthly Revenue', value: '$12,450', change: 12.5, icon: <DollarSign className="w-5 h-5" />, color: 'emerald', onClick: () => navigate('/finance') },
    { title: 'Total Leads', value: '284', change: 8.2, icon: <Users className="w-5 h-5" />, color: 'cyan', onClick: () => navigate('/crm') },
    { title: 'Conversion Rate', value: '3.2%', change: -2.1, icon: <Target className="w-5 h-5" />, color: 'amber', onClick: () => navigate('/crm') },
    { title: 'Active Projects', value: '7', change: 5.0, icon: <BarChart3 className="w-5 h-5" />, color: 'rose', onClick: () => navigate('/projects') },
  ], [navigate]);

  const toggleTask = (id: string) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));
  };

  const dismissBanner = () => {
    localStorage.setItem('onefounder_welcome_dismissed', 'true');
    setShowBanner(false);
    toast('Welcome banner dismissed', 'info');
  };

  const quickActions = [
    { label: 'New Project', icon: <Zap className="w-5 h-5" />, color: 'from-cyan-500 to-blue-600', action: () => navigate('/projects') },
    { label: 'Add Lead', icon: <Users className="w-5 h-5" />, color: 'from-emerald-500 to-teal-600', action: () => navigate('/crm') },
    { label: 'Log Expense', icon: <DollarSign className="w-5 h-5" />, color: 'from-amber-500 to-orange-600', action: () => navigate('/finance') },
    { label: 'AI Chat', icon: <Sparkles className="w-5 h-5" />, color: 'from-violet-500 to-purple-600', action: () => navigate('/chat') },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Welcome banner */}
      {showBanner && (
        <div className="rounded-2xl bg-gradient-to-r from-cyan-500/10 to-blue-600/10 border border-cyan-500/30 p-6 animate-slide-up">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Welcome to OneFounder</h2>
                <p className="text-sm text-slate-400">Complete these 3 steps to get started:</p>
              </div>
            </div>
            <button onClick={dismissBanner} className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { label: 'Add your first lead', path: '/crm' },
              { label: 'Start a project', path: '/projects' },
              { label: 'Try AI Chat', path: '/chat' },
            ].map((step, i) => (
              <button
                key={i}
                onClick={() => navigate(step.path)}
                className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-left"
              >
                <div className="w-7 h-7 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-sm font-semibold flex-shrink-0">
                  {i + 1}
                </div>
                <span className="text-sm text-slate-200">{step.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

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
          {insightsLoading ? (
            <div className="space-y-4">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : (
            <div className="space-y-4">
              {(insights.length > 0 ? insights : fallbackInsights).map((insight, i) => (
                <div
                  key={i}
                  className={`p-4 rounded-xl bg-gradient-to-r ${insightColorMap[insight.color] ?? insightColorMap.cyan} border-l-2`}
                >
                  <p className="text-slate-200 leading-relaxed">
                    <span className="font-semibold capitalize">{insight.title}:</span> {insight.body}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tasks */}
        <div className="rounded-2xl bg-slate-800/50 backdrop-blur-sm border border-white/10 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Today's Tasks</h2>
            <span className="text-sm text-slate-400">{tasks.filter((t) => t.completed).length}/{tasks.length}</span>
          </div>
          <div className="space-y-1">
            {tasks.map((task) => {
              const priorityColors = {
                high: 'bg-rose-500',
                medium: 'bg-amber-500',
                low: 'bg-cyan-500',
              };
              return (
                <button
                  key={task.id}
                  onClick={() => toggleTask(task.id)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors group text-left"
                >
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                      task.completed ? 'bg-emerald-500 border-emerald-500' : 'border-slate-600 group-hover:border-cyan-400'
                    }`}
                  >
                    {task.completed && <CheckCircle className="w-4 h-4 text-white" />}
                  </div>
                  <div className="flex-1">
                    <p
                      className={`text-sm transition-all ${
                        task.completed ? 'text-slate-500 line-through' : 'text-white'
                      }`}
                    >
                      {task.title}
                    </p>
                  </div>
                  <div className={`w-2 h-2 rounded-full ${priorityColors[task.priority]}`} />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {quickActions.map((action, i) => (
          <button
            key={i}
            onClick={action.action}
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
