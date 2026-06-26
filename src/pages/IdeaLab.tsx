import { useState } from 'react';
import {
  Lightbulb,
  Sparkles,
  Target,
  TrendingUp,
  Plus,
  Filter,
  Trash2,
  Copy,
  Loader2,
} from 'lucide-react';
import { useTable } from '../hooks/useTable';
import { askAI } from '../lib/ai';
import Modal from '../components/Modal';
import { useToast } from '../components/Toast';

interface Idea {
  id: string;
  title: string;
  description: string;
  score: number;
  category: string;
  tags: string[];
  market: string;
  viability?: {
    marketSize: number;
    competition: number;
    execution: number;
    revenue: number;
  };
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
    viability: { marketSize: 85, competition: 60, execution: 70, revenue: 90 },
  },
  {
    id: '2',
    title: 'Subscription Analytics Dashboard',
    description: 'Real-time monitoring of subscription metrics with predictive churn analysis.',
    score: 72,
    category: 'Analytics',
    tags: ['Finance', 'SaaS', 'B2B'],
    market: 'Medium',
    viability: { marketSize: 70, competition: 75, execution: 65, revenue: 78 },
  },
  {
    id: '3',
    title: 'Remote Team Culture Platform',
    description: 'Tools for building and maintaining team culture in distributed teams.',
    score: 65,
    category: 'HR Tech',
    tags: ['Remote', 'Culture', 'HR'],
    market: 'Growing',
    viability: { marketSize: 60, competition: 55, execution: 80, revenue: 65 },
  },
];

const colorMap: Record<string, { bg: string; text: string }> = {
  cyan: { bg: 'bg-cyan-500/20', text: 'text-cyan-400' },
  emerald: { bg: 'bg-emerald-500/20', text: 'text-emerald-400' },
  amber: { bg: 'bg-amber-500/20', text: 'text-amber-400' },
};

const marketSizes = ['S', 'M', 'L', 'XL'];
const categories = ['SaaS', 'Analytics', 'HR Tech', 'Fintech', 'Marketplace', 'Other'];

type SortOption = 'score' | 'date' | 'category';

export default function IdeaLab() {
  const toast = useToast();
  const { rows: ideas, addRow, deleteRow } = useTable<Idea>('ideas', initialIdeas);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState<SortOption>('score');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generatedIdeas, setGeneratedIdeas] = useState<Idea[]>([]);

  // Add idea form
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'SaaS',
    tags: '',
    market: 'M',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Generate form
  const [genFormData, setGenFormData] = useState({
    problemSpace: '',
    targetMarket: '',
    budget: '0-10k',
  });

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

  const sortedAndFiltered = [...ideas]
    .filter((idea) => filter === 'all' || idea.category === filter)
    .sort((a, b) => {
      if (sortBy === 'score') return b.score - a.score;
      if (sortBy === 'category') return a.category.localeCompare(b.category);
      return 0;
    });

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddIdea = async () => {
    if (!validateForm()) return;
    const tags = formData.tags.split(',').map((t) => t.trim()).filter(Boolean);
    await addRow({
      title: formData.title,
      description: formData.description,
      score: 50,
      category: formData.category,
      tags,
      market: formData.market,
      viability: { marketSize: 50, competition: 50, execution: 50, revenue: 50 },
    });
    toast('Idea added successfully');
    setShowAddModal(false);
    setFormData({ title: '', description: '', category: 'SaaS', tags: '', market: 'M' });
    setErrors({});
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setGeneratedIdeas([]);
    const prompt = `Generate 3 startup ideas for problem space: "${genFormData.problemSpace || 'general'}", target market: "${genFormData.targetMarket || 'general'}", budget: "${genFormData.budget}". For each idea, provide: title, description, score (0-100), category, tags (array), market size (S/M/L/XL), and viability sub-scores (marketSize, competition, execution, revenue, each 0-100). Respond as JSON array only.`;
    try {
      const res = await askAI(
        [{ role: 'user', content: prompt }],
        'You are a startup idea generator. Respond with valid JSON array only. Each idea must have: title, description, score, category, tags (array of strings), market, viability (object with marketSize, competition, execution, revenue).',
      );
      const parsed = JSON.parse(res.text);
      if (Array.isArray(parsed)) {
        const mapped: Idea[] = parsed.map((item: Record<string, unknown>, i: number) => ({
          id: `gen-${Date.now()}-${i}`,
          title: String(item.title ?? 'Untitled'),
          description: String(item.description ?? ''),
          score: Number(item.score ?? 50),
          category: String(item.category ?? 'SaaS'),
          tags: Array.isArray(item.tags) ? item.tags.map(String) : [],
          market: String(item.market ?? 'M'),
          viability: {
            marketSize: Number((item.viability as Record<string, number>)?.marketSize ?? 50),
            competition: Number((item.viability as Record<string, number>)?.competition ?? 50),
            execution: Number((item.viability as Record<string, number>)?.execution ?? 50),
            revenue: Number((item.viability as Record<string, number>)?.revenue ?? 50),
          },
        }));
        setGeneratedIdeas(mapped);
        toast('Ideas generated successfully');
      }
    } catch {
      toast('Failed to generate ideas. Please try again.', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const saveGeneratedIdea = async (idea: Idea) => {
    await addRow({
      title: idea.title,
      description: idea.description,
      score: idea.score,
      category: idea.category,
      tags: idea.tags,
      market: idea.market,
      viability: idea.viability,
    });
    toast('Idea saved to your collection');
  };

  const handleDelete = async (id: string) => {
    await deleteRow(id);
    toast('Idea deleted');
    setShowDeleteConfirm(null);
  };

  const handleDuplicate = async (idea: Idea) => {
    await addRow({
      title: `${idea.title} (Copy)`,
      description: idea.description,
      score: idea.score,
      category: idea.category,
      tags: idea.tags,
      market: idea.market,
      viability: idea.viability,
    });
    toast('Idea duplicated');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Idea Lab</h1>
          <p className="text-slate-400 mt-1">Generate, validate, and organize your startup ideas.</p>
        </div>
        <button
          onClick={() => setShowGenerateModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium hover:opacity-90 transition-opacity"
        >
          <Sparkles className="w-4 h-4" />
          Generate Ideas with AI
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Ideas', value: ideas.length.toString(), icon: <Lightbulb className="w-5 h-5" />, color: 'cyan' },
          { label: 'High Potential', value: ideas.filter((i) => i.score >= 80).length.toString(), icon: <TrendingUp className="w-5 h-5" />, color: 'emerald' },
          { label: 'Categories', value: [...new Set(ideas.map((i) => i.category))].length.toString(), icon: <Target className="w-5 h-5" />, color: 'amber' },
        ].map((stat, i) => (
          <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-slate-800/50 backdrop-blur-sm border border-white/10">
            <div className={`p-3 rounded-lg ${colorMap[stat.color].bg} ${colorMap[stat.color].text}`}>
              {stat.icon}
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
              <p className="text-sm text-slate-400">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters + Sort */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Filter className="w-4 h-4 text-slate-400" />
          {['all', ...categories].map((cat) => (
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
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-400">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-cyan-500/50"
          >
            <option value="score" className="bg-slate-800">Score (High→Low)</option>
            <option value="date" className="bg-slate-800">Date Added</option>
            <option value="category" className="bg-slate-800">Category</option>
          </select>
        </div>
      </div>

      {/* Ideas Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sortedAndFiltered.map((idea) => (
          <div
            key={idea.id}
            className={`group rounded-2xl bg-gradient-to-br ${getScoreBg(idea.score)} border backdrop-blur-sm p-5 hover:scale-[1.02] transition-transform cursor-pointer relative`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <span className="text-xs text-slate-400 uppercase tracking-wider">{idea.category}</span>
                <h3 className="text-lg font-semibold text-white mt-1">{idea.title}</h3>
              </div>
              <div className="relative group/score">
                <div className={`text-2xl font-bold ${getScoreColor(idea.score)} cursor-help`}>{idea.score}</div>
                {idea.viability && (
                  <div className="absolute right-0 top-8 z-20 hidden group-hover/score:block bg-slate-900 border border-white/20 rounded-xl p-3 shadow-xl w-48">
                    <p className="text-xs font-semibold text-slate-300 mb-2">Viability Breakdown</p>
                    {[
                      { label: 'Market Size', value: idea.viability.marketSize },
                      { label: 'Competition', value: idea.viability.competition },
                      { label: 'Execution', value: idea.viability.execution },
                      { label: 'Revenue Potential', value: idea.viability.revenue },
                    ].map((v) => (
                      <div key={v.label} className="mb-1.5">
                        <div className="flex justify-between text-xs text-slate-400 mb-0.5">
                          <span>{v.label}</span>
                          <span>{v.value}</span>
                        </div>
                        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full bg-cyan-400 rounded-full" style={{ width: `${v.value}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
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
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDuplicate(idea);
                  }}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                  title="Duplicate"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDeleteConfirm(idea.id);
                  }}
                  className="p-1.5 rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* Add New Idea Card */}
        <button
          onClick={() => setShowAddModal(true)}
          className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-white/20 hover:border-cyan-500/50 p-8 text-slate-400 hover:text-white transition-all"
        >
          <Plus className="w-8 h-8" />
          <span className="font-medium">Add New Idea</span>
        </button>
      </div>

      {/* Add Idea Modal */}
      <Modal open={showAddModal} onClose={() => setShowAddModal(false)} title="Add New Idea">
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-slate-300 mb-1.5">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="Idea title"
              className={`w-full bg-white/5 border rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none transition-colors ${
                errors.title ? 'border-rose-500/50' : 'border-white/10 focus:border-cyan-500/50'
              }`}
            />
            {errors.title && <p className="text-xs text-rose-400 mt-1">{errors.title}</p>}
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1.5">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              rows={3}
              placeholder="Describe your idea..."
              className={`w-full bg-white/5 border rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none transition-colors resize-none ${
                errors.description ? 'border-rose-500/50' : 'border-white/10 focus:border-cyan-500/50'
              }`}
            />
            {errors.description && <p className="text-xs text-rose-400 mt-1">{errors.description}</p>}
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1.5">Category</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500/50"
            >
              {categories.map((c) => (
                <option key={c} value={c} className="bg-slate-800">{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1.5">Tags (comma-separated)</label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData((prev) => ({ ...prev, tags: e.target.value }))}
              placeholder="AI, B2B, SaaS"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
            />
            {formData.tags && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.tags.split(',').map((t) => t.trim()).filter(Boolean).map((tag) => (
                  <span key={tag} className="px-2 py-1 rounded-md bg-cyan-500/20 text-cyan-400 text-xs">{tag}</span>
                ))}
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1.5">Market Size</label>
            <div className="flex gap-2">
              {marketSizes.map((m) => (
                <button
                  key={m}
                  onClick={() => setFormData((prev) => ({ ...prev, market: m }))}
                  className={`flex-1 py-2 rounded-xl border text-sm transition-all ${
                    formData.market === m
                      ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
                      : 'border-white/10 text-slate-400 hover:text-white'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={handleAddIdea}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium hover:opacity-90 transition-opacity"
          >
            Add Idea
          </button>
        </div>
      </Modal>

      {/* Generate Ideas Modal */}
      <Modal open={showGenerateModal} onClose={() => { setShowGenerateModal(false); setGeneratedIdeas([]); }} title="Generate Ideas with AI" maxWidth="max-w-2xl">
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-slate-300 mb-1.5">Problem Space</label>
            <input
              type="text"
              value={genFormData.problemSpace}
              onChange={(e) => setGenFormData((prev) => ({ ...prev, problemSpace: e.target.value }))}
              placeholder="e.g. Remote work productivity"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1.5">Target Market</label>
            <input
              type="text"
              value={genFormData.targetMarket}
              onChange={(e) => setGenFormData((prev) => ({ ...prev, targetMarket: e.target.value }))}
              placeholder="e.g. Small businesses"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1.5">Budget Range</label>
            <select
              value={genFormData.budget}
              onChange={(e) => setGenFormData((prev) => ({ ...prev, budget: e.target.value }))}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500/50"
            >
              <option value="0-10k" className="bg-slate-800">$0 - $10K</option>
              <option value="10k-50k" className="bg-slate-800">$10K - $50K</option>
              <option value="50k-100k" className="bg-slate-800">$50K - $100K</option>
              <option value="100k+" className="bg-slate-800">$100K+</option>
            </select>
          </div>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate Ideas
              </>
            )}
          </button>

          {generatedIdeas.length > 0 && (
            <div className="space-y-3 pt-2">
              <h3 className="text-sm font-semibold text-slate-300">Generated Ideas:</h3>
              {generatedIdeas.map((idea) => (
                <div key={idea.id} className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-white">{idea.title}</h4>
                    <span className={`text-lg font-bold ${getScoreColor(idea.score)}`}>{idea.score}</span>
                  </div>
                  <p className="text-sm text-slate-300 mb-3">{idea.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-2">
                      {idea.tags.map((tag) => (
                        <span key={tag} className="px-2 py-0.5 rounded-md bg-white/10 text-xs text-slate-300">{tag}</span>
                      ))}
                    </div>
                    <button
                      onClick={() => saveGeneratedIdea(idea)}
                      className="px-3 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 text-sm hover:bg-cyan-500/30 transition-colors"
                    >
                      Save Idea
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <Modal open={Boolean(showDeleteConfirm)} onClose={() => setShowDeleteConfirm(null)} title="Delete Idea?" maxWidth="max-w-sm">
        <div className="space-y-4">
          <p className="text-slate-300">Are you sure you want to delete this idea? This action cannot be undone.</p>
          <div className="flex gap-3">
            <button
              onClick={() => setShowDeleteConfirm(null)}
              className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => showDeleteConfirm && handleDelete(showDeleteConfirm)}
              className="flex-1 py-2.5 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:bg-rose-500/30 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
