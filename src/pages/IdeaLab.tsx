import { useMemo, useState } from 'react';
import {
  ChevronRight,
  Filter,
  Lightbulb,
  Plus,
  Search,
  Sparkles,
  Target,
  TrendingUp,
} from 'lucide-react';
import Modal from '../components/Modal';
import StatCard from '../components/StatCard';
import { calculateIdeaScore, formatShortDate } from '../lib/workspace';
import type { Idea, MarketSize } from '../types';

interface IdeaLabProps {
  ideas: Idea[];
  onAddIdea: (idea: Omit<Idea, 'id' | 'createdAt'> & { score: number }) => void;
}

interface IdeaFormState {
  title: string;
  description: string;
  category: string;
  market: MarketSize;
  tags: string;
}

const emptyForm: IdeaFormState = {
  title: '',
  description: '',
  category: 'SaaS',
  market: 'Growing',
  tags: 'AI, Productivity',
};

const generatorBlueprints = [
  { category: 'SaaS', suffix: 'copilot', angle: 'workflow automation for lean teams' },
  { category: 'Analytics', suffix: 'dashboard', angle: 'decision support with founder-friendly metrics' },
  { category: 'Marketplace', suffix: 'platform', angle: 'matching supply and demand with less friction' },
  { category: 'FinTech', suffix: 'assistant', angle: 'finance operations without spreadsheet chaos' },
];

function normalizeTags(tags: string) {
  return tags
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function buildIdeaDraft(form: IdeaFormState) {
  const tags = normalizeTags(form.tags);
  return {
    title: form.title.trim(),
    description: form.description.trim(),
    category: form.category.trim(),
    market: form.market,
    tags,
    score: calculateIdeaScore({
      title: form.title,
      category: form.category,
      market: form.market,
      tags,
    }),
  };
}

export default function IdeaLab({ ideas, onAddIdea }: IdeaLabProps) {
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'score' | 'recent' | 'market'>('score');
  const [search, setSearch] = useState('');
  const [generatorPrompt, setGeneratorPrompt] = useState('Founder onboarding automation for B2B teams');
  const [generatedIdeas, setGeneratedIdeas] = useState<Array<Omit<Idea, 'id' | 'createdAt'>>> ([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formState, setFormState] = useState<IdeaFormState>(emptyForm);

  const categories = useMemo(() => ['all', ...new Set(ideas.map((idea) => idea.category))], [ideas]);

  const filteredIdeas = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return [...ideas]
      .filter((idea) => filter === 'all' || idea.category === filter)
      .filter((idea) => {
        if (!normalizedSearch) {
          return true;
        }

        return [idea.title, idea.description, idea.category, idea.tags.join(' ')].some((value) =>
          value.toLowerCase().includes(normalizedSearch)
        );
      })
      .sort((left, right) => {
        if (sortBy === 'recent') {
          return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
        }
        if (sortBy === 'market') {
          return left.market.localeCompare(right.market);
        }
        return right.score - left.score;
      });
  }, [filter, ideas, search, sortBy]);

  const topIdea = useMemo(() => [...ideas].sort((left, right) => right.score - left.score)[0], [ideas]);

  const generateIdeas = () => {
    const prompt = generatorPrompt.trim();
    if (!prompt) {
      return;
    }

    const keywords = prompt
      .split(/\s+/)
      .map((word) => word.replace(/[^a-zA-Z0-9-]/g, '').trim())
      .filter((word) => word.length > 2);

    const selectedIdeas = generatorBlueprints.map((blueprint, index) => {
      const tags = ['AI', 'Automation', ...keywords.slice(0, 3)].filter(Boolean);
      const titleStart = keywords.slice(0, 2).join(' ') || 'Founder workflow';
      const title = `${titleStart.replace(/\b\w/g, (match) => match.toUpperCase())} ${blueprint.suffix}`;
      const description = `A ${blueprint.category.toLowerCase()} ${blueprint.suffix} focused on ${blueprint.angle}, designed around “${prompt}”.`;
      const market = (['Growing', 'Large', 'Medium'] as MarketSize[])[index % 3];

      return {
        title,
        description,
        category: blueprint.category,
        tags,
        market,
        score: calculateIdeaScore({ title, category: blueprint.category, market, tags }),
      };
    });

    setGeneratedIdeas(selectedIdeas);
  };

  const submitIdea = () => {
    const draft = buildIdeaDraft(formState);
    if (!draft.title || !draft.description || !draft.category || draft.tags.length === 0) {
      return;
    }

    onAddIdea(draft);
    setFormState(emptyForm);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-white/10 bg-slate-900/60 p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-cyan-300">Idea pipeline</p>
            <h1 className="mt-2 text-3xl font-semibold text-white">Score, search, and grow better startup ideas</h1>
            <p className="mt-3 max-w-2xl text-slate-400">
              I upgraded the original board into a mini opportunity lab with smarter filtering, quick idea generation,
              and persistent storage so your best concepts are not lost on refresh.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-slate-200 transition-colors hover:border-white/20 hover:text-white"
            >
              <Plus className="h-4 w-4" />
              Add idea manually
            </button>
            <button
              type="button"
              onClick={generateIdeas}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90"
            >
              <Sparkles className="h-4 w-4" />
              Generate ideas
            </button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total ideas"
          value={String(ideas.length)}
          subtitle="Saved and searchable"
          icon={<Lightbulb className="h-5 w-5 text-cyan-300" />}
          tone="cyan"
        />
        <StatCard
          title="High conviction"
          value={String(ideas.filter((idea) => idea.score >= 80).length)}
          subtitle="Ideas scoring 80+"
          icon={<TrendingUp className="h-5 w-5 text-emerald-300" />}
          tone="emerald"
        />
        <StatCard
          title="Categories"
          value={String(new Set(ideas.map((idea) => idea.category)).size)}
          subtitle="Portfolio diversity"
          icon={<Target className="h-5 w-5 text-amber-300" />}
          tone="amber"
        />
        <StatCard
          title="Best score"
          value={topIdea ? `${topIdea.score}/100` : '—'}
          subtitle={topIdea ? topIdea.title : 'Create your first idea'}
          icon={<Sparkles className="h-5 w-5 text-violet-300" />}
          tone="violet"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-cyan-500/10 p-3 text-cyan-300">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Idea generator</h2>
              <p className="text-sm text-slate-400">Describe a market or pain point and get draft concepts you can save.</p>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            <textarea
              value={generatorPrompt}
              onChange={(event) => setGeneratorPrompt(event.target.value)}
              rows={3}
              placeholder="Describe a customer problem, niche, or opportunity..."
              className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white placeholder-slate-500 focus:border-cyan-500/30 focus:outline-none"
            />
            <div className="grid gap-3 md:grid-cols-3">
              {generatedIdeas.length ? (
                generatedIdeas.map((idea) => (
                  <div key={idea.title} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{idea.category}</p>
                        <h3 className="mt-1 font-semibold text-white">{idea.title}</h3>
                      </div>
                      <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-300">
                        {idea.score}/100
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-400">{idea.description}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {idea.tags.map((tag) => (
                        <span key={tag} className="rounded-full border border-white/10 bg-slate-950/60 px-2.5 py-1 text-xs text-slate-300">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => onAddIdea(idea)}
                      className="mt-4 inline-flex items-center gap-2 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-sm text-cyan-300 transition-colors hover:bg-cyan-500/20"
                    >
                      Save idea
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                ))
              ) : (
                <div className="md:col-span-3 rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-5 text-sm text-slate-400">
                  Use the generator to quickly create a few new angles you can validate.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-amber-500/10 p-3 text-amber-300">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Validation notes</h2>
              <p className="text-sm text-slate-400">Use this checklist before you start building.</p>
            </div>
          </div>
          <div className="mt-5 space-y-3 text-sm text-slate-300">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">Interview at least 5 ideal users before writing production code.</div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">Pick one success metric per idea: revenue, usage, or time saved.</div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">Draft a landing page before building the product to validate positioning.</div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">Only keep ideas above 75 if they have a clear buyer and painful workflow.</div>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-slate-900/60 p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-white">Idea board</h2>
            <p className="mt-1 text-sm text-slate-400">Filter by category, search by tag, and sort by score or recency.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search ideas"
                className="w-full rounded-2xl border border-white/10 bg-slate-950/50 py-3 pl-11 pr-4 text-sm text-white placeholder-slate-500 focus:border-cyan-500/30 focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-950/50 px-4">
              <Filter className="h-4 w-4 text-slate-500" />
              <select
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
                className="w-full bg-transparent py-3 text-sm text-white focus:outline-none"
              >
                {categories.map((category) => (
                  <option key={category} value={category} className="bg-slate-900">
                    {category === 'all' ? 'All categories' : category}
                  </option>
                ))}
              </select>
            </div>
            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value as 'score' | 'recent' | 'market')}
              className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-white focus:border-cyan-500/30 focus:outline-none"
            >
              <option value="score">Sort by score</option>
              <option value="recent">Sort by newest</option>
              <option value="market">Sort by market</option>
            </select>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredIdeas.map((idea) => (
            <div
              key={idea.id}
              className="group rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] p-5 transition-all hover:border-cyan-500/30 hover:bg-white/[0.07]"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-slate-500">{idea.category}</p>
                  <h3 className="mt-2 text-lg font-semibold text-white">{idea.title}</h3>
                </div>
                <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-300">
                  {idea.score}/100
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-400">{idea.description}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {idea.tags.map((tag) => (
                  <span key={tag} className="rounded-full border border-white/10 bg-slate-950/60 px-2.5 py-1 text-xs text-slate-300">
                    {tag}
                  </span>
                ))}
              </div>
              <div className="mt-5 flex items-center justify-between text-sm text-slate-400">
                <span>{idea.market} market</span>
                <span>{formatShortDate(idea.createdAt)}</span>
              </div>
            </div>
          ))}
          {!filteredIdeas.length ? (
            <div className="md:col-span-2 xl:col-span-3 rounded-3xl border border-dashed border-white/10 bg-white/[0.03] p-8 text-center text-slate-400">
              No ideas matched your current filters. Try a different search or create a new idea.
            </div>
          ) : null}
        </div>
      </section>

      <Modal
        open={isModalOpen}
        title="Add a new startup idea"
        description="Give the idea a clear problem statement, market, and tags. A score will be computed automatically."
        onClose={() => setIsModalOpen(false)}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2 md:col-span-2">
            <span className="text-sm text-slate-300">Idea title</span>
            <input
              value={formState.title}
              onChange={(event) => setFormState((current) => ({ ...current, title: event.target.value }))}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white focus:border-cyan-500/30 focus:outline-none"
              placeholder="AI workflow copilot for founders"
            />
          </label>
          <label className="space-y-2 md:col-span-2">
            <span className="text-sm text-slate-300">Description</span>
            <textarea
              value={formState.description}
              onChange={(event) => setFormState((current) => ({ ...current, description: event.target.value }))}
              rows={4}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white focus:border-cyan-500/30 focus:outline-none"
              placeholder="What painful workflow does this fix?"
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm text-slate-300">Category</span>
            <input
              value={formState.category}
              onChange={(event) => setFormState((current) => ({ ...current, category: event.target.value }))}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white focus:border-cyan-500/30 focus:outline-none"
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm text-slate-300">Market size</span>
            <select
              value={formState.market}
              onChange={(event) => setFormState((current) => ({ ...current, market: event.target.value as MarketSize }))}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white focus:border-cyan-500/30 focus:outline-none"
            >
              <option value="Niche">Niche</option>
              <option value="Growing">Growing</option>
              <option value="Medium">Medium</option>
              <option value="Large">Large</option>
            </select>
          </label>
          <label className="space-y-2 md:col-span-2">
            <span className="text-sm text-slate-300">Tags</span>
            <input
              value={formState.tags}
              onChange={(event) => setFormState((current) => ({ ...current, tags: event.target.value }))}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white focus:border-cyan-500/30 focus:outline-none"
              placeholder="AI, B2B, Workflow"
            />
          </label>
        </div>

        <div className="mt-6 flex items-center justify-between gap-3">
          <p className="text-sm text-slate-400">
            Estimated score: <span className="font-medium text-cyan-300">{buildIdeaDraft(formState).score}/100</span>
          </p>
          <button
            type="button"
            onClick={submitIdea}
            className="rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-3 font-medium text-white transition-opacity hover:opacity-90"
          >
            Save idea
          </button>
        </div>
      </Modal>
    </div>
  );
}
