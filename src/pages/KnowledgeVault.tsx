import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  BookOpen,
  Plus,
  Search,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import Modal from '../components/Modal';
import StatCard from '../components/StatCard';
import {
  formatShortDate,
  getRiskTone,
  getSensitivityTone,
} from '../lib/workspace';
import type {
  DataSensitivity,
  KnowledgeKind,
  KnowledgeSource,
  KnowledgeStatus,
  ShadowAIEntry,
  ShadowToolStatus,
} from '../types';

interface KnowledgeVaultProps {
  knowledgeSources: KnowledgeSource[];
  shadowAIEntries: ShadowAIEntry[];
  onAddKnowledgeSource: (source: Omit<KnowledgeSource, 'id'>) => void;
  onUpdateKnowledgeSource: (sourceId: string, updates: Partial<KnowledgeSource>) => void;
  onAddShadowAIEntry: (entry: Omit<ShadowAIEntry, 'id'>) => void;
  onUpdateShadowAIEntry: (entryId: string, updates: Partial<ShadowAIEntry>) => void;
}

interface KnowledgeFormState {
  title: string;
  owner: string;
  kind: KnowledgeKind;
  status: KnowledgeStatus;
  summary: string;
  citations: string;
  freshnessScore: string;
  usageCount: string;
  sensitivity: DataSensitivity;
}

interface ShadowFormState {
  toolName: string;
  team: string;
  owner: string;
  status: ShadowToolStatus;
  riskLevel: ShadowAIEntry['riskLevel'];
  notes: string;
  dataTypes: string;
}

const emptyKnowledgeForm: KnowledgeFormState = {
  title: '',
  owner: 'Founder',
  kind: 'policy',
  status: 'needs-review',
  summary: '',
  citations: '',
  freshnessScore: '80',
  usageCount: '0',
  sensitivity: 'internal',
};

const emptyShadowForm: ShadowFormState = {
  toolName: '',
  team: 'Growth',
  owner: 'Founder',
  status: 'unapproved',
  riskLevel: 'medium',
  notes: '',
  dataTypes: 'Source code, Strategy notes',
};

export default function KnowledgeVault({
  knowledgeSources,
  shadowAIEntries,
  onAddKnowledgeSource,
  onUpdateKnowledgeSource,
  onAddShadowAIEntry,
  onUpdateShadowAIEntry,
}: KnowledgeVaultProps) {
  const [search, setSearch] = useState('');
  const [knowledgeModalOpen, setKnowledgeModalOpen] = useState(false);
  const [shadowModalOpen, setShadowModalOpen] = useState(false);
  const [knowledgeForm, setKnowledgeForm] = useState<KnowledgeFormState>(emptyKnowledgeForm);
  const [shadowForm, setShadowForm] = useState<ShadowFormState>(emptyShadowForm);

  const filteredKnowledge = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    if (!normalized) return knowledgeSources;
    return knowledgeSources.filter((source) =>
      [source.title, source.owner, source.summary, source.kind, source.status, source.citations.join(' ')]
        .join(' ')
        .toLowerCase()
        .includes(normalized)
    );
  }, [knowledgeSources, search]);

  const filteredShadowAI = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    if (!normalized) return shadowAIEntries;
    return shadowAIEntries.filter((entry) =>
      [entry.toolName, entry.team, entry.owner, entry.notes, entry.dataTypes.join(' ')]
        .join(' ')
        .toLowerCase()
        .includes(normalized)
    );
  }, [shadowAIEntries, search]);

  const submitKnowledge = () => {
    if (!knowledgeForm.title.trim() || !knowledgeForm.summary.trim()) return;
    onAddKnowledgeSource({
      title: knowledgeForm.title.trim(),
      owner: knowledgeForm.owner.trim() || 'Founder',
      kind: knowledgeForm.kind,
      status: knowledgeForm.status,
      summary: knowledgeForm.summary.trim(),
      citations: knowledgeForm.citations.split(',').map((item) => item.trim()).filter(Boolean),
      lastReviewed: new Date().toISOString(),
      freshnessScore: Number(knowledgeForm.freshnessScore) || 60,
      usageCount: Number(knowledgeForm.usageCount) || 0,
      sensitivity: knowledgeForm.sensitivity,
    });
    setKnowledgeForm(emptyKnowledgeForm);
    setKnowledgeModalOpen(false);
  };

  const submitShadowTool = () => {
    if (!shadowForm.toolName.trim()) return;
    onAddShadowAIEntry({
      toolName: shadowForm.toolName.trim(),
      team: shadowForm.team.trim() || 'Unknown',
      owner: shadowForm.owner.trim() || 'Founder',
      status: shadowForm.status,
      riskLevel: shadowForm.riskLevel,
      lastSeen: new Date().toISOString(),
      notes: shadowForm.notes.trim(),
      dataTypes: shadowForm.dataTypes.split(',').map((item) => item.trim()).filter(Boolean),
    });
    setShadowForm(emptyShadowForm);
    setShadowModalOpen(false);
  };

  const canonicalCount = knowledgeSources.filter((source) => source.status === 'canonical').length;
  const staleCount = knowledgeSources.filter((source) => source.status === 'stale').length;
  const averageFreshness = knowledgeSources.length
    ? Math.round(knowledgeSources.reduce((sum, source) => sum + source.freshnessScore, 0) / knowledgeSources.length)
    : 0;
  const riskyShadowCount = shadowAIEntries.filter(
    (entry) => entry.status !== 'approved' && (entry.riskLevel === 'high' || entry.riskLevel === 'critical')
  ).length;

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-white/10 bg-slate-900/60 p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-cyan-300">Knowledge vault</p>
            <h1 className="mt-2 text-3xl font-semibold text-white">Fix the data and source-of-truth layer behind AI decisions</h1>
            <p className="mt-3 max-w-3xl text-slate-400">
              In the current AI world, many failures start before the model answers anything: stale documents,
              contradictory references, and shadow AI tool usage create drift, false confidence, and governance blind spots.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setKnowledgeModalOpen(true)}
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200 transition-colors hover:border-white/20 hover:text-white"
            >
              <Plus className="mr-2 inline h-4 w-4" />
              Add source
            </button>
            <button
              type="button"
              onClick={() => setShadowModalOpen(true)}
              className="rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90"
            >
              <Plus className="mr-2 inline h-4 w-4" />
              Add AI tool
            </button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Canonical sources"
          value={String(canonicalCount)}
          subtitle="Approved source-of-truth entries"
          icon={<BookOpen className="h-5 w-5 text-cyan-300" />}
          tone="cyan"
        />
        <StatCard
          title="Stale knowledge"
          value={String(staleCount)}
          subtitle="Needs urgent review"
          icon={<AlertTriangle className="h-5 w-5 text-amber-300" />}
          tone="amber"
        />
        <StatCard
          title="Freshness score"
          value={`${averageFreshness}/100`}
          subtitle="Average source freshness"
          icon={<Sparkles className="h-5 w-5 text-emerald-300" />}
          tone="emerald"
        />
        <StatCard
          title="Risky shadow AI"
          value={String(riskyShadowCount)}
          subtitle="Unapproved or restricted tools"
          icon={<ShieldAlert className="h-5 w-5 text-rose-300" />}
          tone="rose"
        />
      </section>

      <section className="rounded-3xl border border-white/10 bg-slate-900/60 p-6">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search sources and AI tools..."
            className="w-full rounded-2xl border border-white/10 bg-slate-950/50 py-3 pl-11 pr-4 text-sm text-white placeholder-slate-500 focus:border-cyan-500/30 focus:outline-none"
          />
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-6">
          <h2 className="text-2xl font-semibold text-white">Source registry</h2>
          <p className="mt-1 text-sm text-slate-400">This is the source layer your AI should trust before it trusts itself.</p>
          <div className="mt-6 space-y-3">
            {filteredKnowledge.map((source) => (
              <div key={source.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <span className={`rounded-full px-3 py-1 text-xs font-medium ${source.status === 'canonical' ? 'bg-emerald-500/15 text-emerald-300' : source.status === 'needs-review' ? 'bg-cyan-500/15 text-cyan-300' : 'bg-amber-500/15 text-amber-300'}`}>
                        {source.status}
                      </span>
                      <span className={`rounded-full px-3 py-1 text-xs font-medium ${getSensitivityTone(source.sensitivity)}`}>
                        {source.sensitivity}
                      </span>
                      <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">{source.kind}</span>
                    </div>
                    <p className="mt-3 text-lg font-semibold text-white">{source.title}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-400">{source.summary}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {source.citations.map((citation) => (
                        <span key={citation} className="rounded-full border border-white/10 bg-slate-950/40 px-2.5 py-1 text-xs text-slate-300">
                          {citation}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-right">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Freshness</p>
                    <p className="mt-1 text-2xl font-semibold text-white">{source.freshnessScore}</p>
                    <p className="mt-1 text-xs text-slate-500">Last reviewed {formatShortDate(source.lastReviewed)}</p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-400">
                  <span>Owner: {source.owner}</span>
                  <span>Usage count: {source.usageCount}</span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {source.status !== 'canonical' ? (
                    <button
                      type="button"
                      onClick={() => onUpdateKnowledgeSource(source.id, { status: 'canonical', lastReviewed: new Date().toISOString(), freshnessScore: Math.min(100, source.freshnessScore + 12) })}
                      className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300 transition-colors hover:bg-emerald-500/20"
                    >
                      Mark canonical
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => onUpdateKnowledgeSource(source.id, { status: 'needs-review', lastReviewed: new Date().toISOString(), freshnessScore: Math.min(100, source.freshnessScore + 8) })}
                    className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-sm text-cyan-300 transition-colors hover:bg-cyan-500/20"
                  >
                    Review now
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-6">
          <h2 className="text-2xl font-semibold text-white">Shadow AI inventory</h2>
          <p className="mt-1 text-sm text-slate-400">You cannot govern what you do not know exists.</p>
          <div className="mt-6 space-y-3">
            {filteredShadowAI.map((entry) => (
              <div key={entry.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <span className={`rounded-full px-3 py-1 text-xs font-medium ${entry.status === 'approved' ? 'bg-emerald-500/15 text-emerald-300' : entry.status === 'restricted' ? 'bg-rose-500/15 text-rose-300' : 'bg-amber-500/15 text-amber-300'}`}>
                        {entry.status}
                      </span>
                      <span className={`rounded-full px-3 py-1 text-xs font-medium ${getRiskTone(entry.riskLevel)}`}>
                        {entry.riskLevel} risk
                      </span>
                    </div>
                    <p className="mt-3 text-lg font-semibold text-white">{entry.toolName}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-400">{entry.notes}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {entry.dataTypes.map((item) => (
                        <span key={item} className="rounded-full border border-white/10 bg-slate-950/40 px-2.5 py-1 text-xs text-slate-300">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-right text-sm text-slate-300">
                    <p>{entry.team}</p>
                    <p className="mt-1 text-slate-400">Owner: {entry.owner}</p>
                    <p className="mt-1 text-slate-500">Last seen {formatShortDate(entry.lastSeen)}</p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {entry.status !== 'approved' ? (
                    <button
                      type="button"
                      onClick={() => onUpdateShadowAIEntry(entry.id, { status: 'approved', lastSeen: new Date().toISOString() })}
                      className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300 transition-colors hover:bg-emerald-500/20"
                    >
                      Approve tool
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => onUpdateShadowAIEntry(entry.id, { status: 'restricted', riskLevel: 'critical', lastSeen: new Date().toISOString() })}
                    className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300 transition-colors hover:bg-rose-500/20"
                  >
                    Restrict use
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Modal
        open={knowledgeModalOpen}
        title="Add knowledge source"
        description="Capture the canonical or risky source material your AI and teams depend on."
        onClose={() => setKnowledgeModalOpen(false)}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2 md:col-span-2">
            <span className="text-sm text-slate-300">Title</span>
            <input value={knowledgeForm.title} onChange={(event) => setKnowledgeForm((current) => ({ ...current, title: event.target.value }))} className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white focus:border-cyan-500/30 focus:outline-none" />
          </label>
          <label className="space-y-2">
            <span className="text-sm text-slate-300">Owner</span>
            <input value={knowledgeForm.owner} onChange={(event) => setKnowledgeForm((current) => ({ ...current, owner: event.target.value }))} className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white focus:border-cyan-500/30 focus:outline-none" />
          </label>
          <label className="space-y-2">
            <span className="text-sm text-slate-300">Kind</span>
            <select value={knowledgeForm.kind} onChange={(event) => setKnowledgeForm((current) => ({ ...current, kind: event.target.value as KnowledgeKind }))} className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white focus:border-cyan-500/30 focus:outline-none">
              <option value="policy">Policy</option>
              <option value="playbook">Playbook</option>
              <option value="product">Product</option>
              <option value="market">Market</option>
              <option value="support">Support</option>
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-sm text-slate-300">Status</span>
            <select value={knowledgeForm.status} onChange={(event) => setKnowledgeForm((current) => ({ ...current, status: event.target.value as KnowledgeStatus }))} className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white focus:border-cyan-500/30 focus:outline-none">
              <option value="canonical">Canonical</option>
              <option value="needs-review">Needs review</option>
              <option value="stale">Stale</option>
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-sm text-slate-300">Sensitivity</span>
            <select value={knowledgeForm.sensitivity} onChange={(event) => setKnowledgeForm((current) => ({ ...current, sensitivity: event.target.value as DataSensitivity }))} className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white focus:border-cyan-500/30 focus:outline-none">
              <option value="public">Public</option>
              <option value="internal">Internal</option>
              <option value="confidential">Confidential</option>
              <option value="restricted">Restricted</option>
            </select>
          </label>
          <label className="space-y-2 md:col-span-2">
            <span className="text-sm text-slate-300">Summary</span>
            <textarea value={knowledgeForm.summary} onChange={(event) => setKnowledgeForm((current) => ({ ...current, summary: event.target.value }))} rows={4} className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white focus:border-cyan-500/30 focus:outline-none" />
          </label>
          <label className="space-y-2 md:col-span-2">
            <span className="text-sm text-slate-300">Citations</span>
            <input value={knowledgeForm.citations} onChange={(event) => setKnowledgeForm((current) => ({ ...current, citations: event.target.value }))} placeholder="Doc A, SOP B" className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white focus:border-cyan-500/30 focus:outline-none" />
          </label>
          <label className="space-y-2">
            <span className="text-sm text-slate-300">Freshness score</span>
            <input type="number" min="0" max="100" value={knowledgeForm.freshnessScore} onChange={(event) => setKnowledgeForm((current) => ({ ...current, freshnessScore: event.target.value }))} className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white focus:border-cyan-500/30 focus:outline-none" />
          </label>
          <label className="space-y-2">
            <span className="text-sm text-slate-300">Usage count</span>
            <input type="number" min="0" value={knowledgeForm.usageCount} onChange={(event) => setKnowledgeForm((current) => ({ ...current, usageCount: event.target.value }))} className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white focus:border-cyan-500/30 focus:outline-none" />
          </label>
        </div>
        <div className="mt-6 flex justify-end">
          <button type="button" onClick={submitKnowledge} className="rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-3 font-medium text-white transition-opacity hover:opacity-90">Save source</button>
        </div>
      </Modal>

      <Modal
        open={shadowModalOpen}
        title="Add AI tool usage"
        description="Track unapproved or approved AI usage so governance can catch up to reality."
        onClose={() => setShadowModalOpen(false)}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2 md:col-span-2">
            <span className="text-sm text-slate-300">Tool name</span>
            <input value={shadowForm.toolName} onChange={(event) => setShadowForm((current) => ({ ...current, toolName: event.target.value }))} className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white focus:border-cyan-500/30 focus:outline-none" />
          </label>
          <label className="space-y-2">
            <span className="text-sm text-slate-300">Team</span>
            <input value={shadowForm.team} onChange={(event) => setShadowForm((current) => ({ ...current, team: event.target.value }))} className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white focus:border-cyan-500/30 focus:outline-none" />
          </label>
          <label className="space-y-2">
            <span className="text-sm text-slate-300">Owner</span>
            <input value={shadowForm.owner} onChange={(event) => setShadowForm((current) => ({ ...current, owner: event.target.value }))} className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white focus:border-cyan-500/30 focus:outline-none" />
          </label>
          <label className="space-y-2">
            <span className="text-sm text-slate-300">Status</span>
            <select value={shadowForm.status} onChange={(event) => setShadowForm((current) => ({ ...current, status: event.target.value as ShadowToolStatus }))} className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white focus:border-cyan-500/30 focus:outline-none">
              <option value="approved">Approved</option>
              <option value="unapproved">Unapproved</option>
              <option value="restricted">Restricted</option>
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-sm text-slate-300">Risk level</span>
            <select value={shadowForm.riskLevel} onChange={(event) => setShadowForm((current) => ({ ...current, riskLevel: event.target.value as ShadowAIEntry['riskLevel'] }))} className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white focus:border-cyan-500/30 focus:outline-none">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </label>
          <label className="space-y-2 md:col-span-2">
            <span className="text-sm text-slate-300">Notes</span>
            <textarea value={shadowForm.notes} onChange={(event) => setShadowForm((current) => ({ ...current, notes: event.target.value }))} rows={3} className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white focus:border-cyan-500/30 focus:outline-none" />
          </label>
          <label className="space-y-2 md:col-span-2">
            <span className="text-sm text-slate-300">Data types</span>
            <input value={shadowForm.dataTypes} onChange={(event) => setShadowForm((current) => ({ ...current, dataTypes: event.target.value }))} className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white focus:border-cyan-500/30 focus:outline-none" />
          </label>
        </div>
        <div className="mt-6 flex justify-end">
          <button type="button" onClick={submitShadowTool} className="rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-3 font-medium text-white transition-opacity hover:opacity-90">Save AI tool</button>
        </div>
      </Modal>
    </div>
  );
}
