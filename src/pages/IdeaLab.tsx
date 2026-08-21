import { useState } from 'react';
import {
  Lightbulb,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  DollarSign,
  ChevronRight,
  Plus,
  Filter,
} from 'lucide-react';

interface Idea {
  id: string;
  title: string;
  description: string;
  score: number;
  category: string;
  tags: string[];
  market: string;
}

const initialIdeas: Idea[] = [
  {
    id: '1',
    title: 'AI-Powered Meeting Summarizer',
    description: 'Automatic transcription and AI-powered summarization of meetings with action item extraction.',
    score: 87,
    category: 'SaaS',
    tags: ['AI', 'Productivity', 'B2B'],
    market: 'Large',
  },
  {
    id: '2',
    title: 'Subscription Analytics Dashboard',
    description: 'Real-time monitoring of subscription metrics with predictive churn analysis.',
    score: 72,
    category: 'Analytics',
    tags: ['Finance', 'SaaS', 'B2B'],
    market: 'Medium',
  },
  {
    id: '3',
    title: 'Remote Team Culture Platform',
    description: 'Tools for building and maintaining team culture in distributed teams.',
    score: 65,
    category: 'HR Tech',
    tags: ['Remote', 'Culture', 'HR'],
    market: 'Growing',
  },
];

export default function IdeaLab() {
  const [ideas, setIdeas] = useState<Idea[]>(initialIdeas);
  const [filter, setFilter] = useState('all');

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400';
    if (score >= 60) return 'text-amber-400';
    return 'text-slate-400';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'from-emerald-500/20 to-teal-600/20 border-emerald-500/30';
    if (score >= 60) return 'from-amber-500/20 to-orange-600/20 border-amber-500/30';
    return 'from-slate-500/20 to-slate-600/20 border-slate-500/30';
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Idea Lab</h1>
          <p className="text-slate-400 mt-1">Generate, validate, and organize your startup ideas.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium hover:opacity-90 transition-opacity">
          <Sparkles className="w-4 h-4" />
          Generate Ideas with AI
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Ideas', value: ideas.length.toString(), icon: <Lightbulb className="w-5 h-5" />, color: 'cyan' },
          { label: 'High Potential', value: ideas.filter(i => i.score >= 80).length.toString(), icon: <TrendingUp className="w-5 h-5" />, color: 'emerald' },
          { label: 'Categories', value: [...new Set(ideas.map(i => i.category))].length.toString(), icon: <Target className="w-5 h-5" />, color: 'amber' },
        ].map((stat, i) => (
          <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-slate-800/50 backdrop-blur-sm border border-white/10">
            <div className={`p-3 rounded-lg bg-${stat.color}-500/20 text-${stat.color}-400`}>
              {stat.icon}
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-sm text-slate-400">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <Filter className="w-4 h-4 text-slate-400" />
        {['all', 'SaaS', 'Analytics', 'HR Tech'].map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
              filter === cat
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {cat === 'all' ? 'All Ideas' : cat}
          </button>
        ))}
      </div>

      {/* Ideas Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {ideas
          .filter((idea) => filter === 'all' || idea.category === filter)
          .map((idea) => (
            <div
              key={idea.id}
              className={`group rounded-2xl bg-gradient-to-br ${getScoreBg(idea.score)} border backdrop-blur-sm p-5 hover:scale-[1.02] transition-transform cursor-pointer`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <span className="text-xs text-slate-400 uppercase tracking-wider">{idea.category}</span>
                  <h3 className="text-lg font-semibold text-white mt-1">{idea.title}</h3>
                </div>
                <div className={`text-2xl font-bold ${getScoreColor(idea.score)}`}>{idea.score}</div>
              </div>
              <p className="text-slate-300 text-sm mb-4">{idea.description}</p>
              <div className="flex items-center justify-between">
                <div className="flex flex-wrap gap-2">
                  {idea.tags.map((tag) => (
                    <span key={tag} className="px-2 py-1 rounded-md bg-white/10 text-xs text-slate-300">
                      {tag}
                    </span>
                  ))}
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-cyan-400 transition-colors" />
              </div>
            </div>
          ))}

        {/* Add New Idea Card */}
        <button className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-white/20 hover:border-cyan-500/50 p-8 text-slate-400 hover:text-white transition-all">
          <Plus className="w-8 h-8" />
          <span className="font-medium">Add New Idea</span>
        </button>
      </div>
    </div>
  );
}
