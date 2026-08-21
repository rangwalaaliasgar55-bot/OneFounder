import { useMemo, useState } from 'react';
import {
  Building,
  DollarSign,
  Mail,
  Plus,
  Search,
  Star,
  TrendingUp,
  Users,
} from 'lucide-react';
import Modal from '../components/Modal';
import StatCard from '../components/StatCard';
import { formatCompactCurrency, formatCurrency, formatShortDate, getDaysSince, getStageLabel } from '../lib/workspace';
import type { Lead, LeadStage } from '../types';

interface CRMProps {
  leads: Lead[];
  onAddLead: (lead: Omit<Lead, 'id' | 'lastContacted'>) => void;
  onUpdateLead: (leadId: string, updates: Partial<Lead>) => void;
}

interface LeadFormState {
  name: string;
  email: string;
  company: string;
  value: string;
  stage: LeadStage;
  source: string;
}

const emptyLeadForm: LeadFormState = {
  name: '',
  email: '',
  company: '',
  value: '',
  stage: 'lead',
  source: 'Website',
};

const stageColors: Record<LeadStage, string> = {
  lead: 'bg-slate-600/80 text-slate-100',
  qualified: 'bg-cyan-500/20 text-cyan-300',
  proposal: 'bg-amber-500/20 text-amber-300',
  negotiation: 'bg-orange-500/20 text-orange-300',
  won: 'bg-emerald-500/20 text-emerald-300',
};

const stageOrder: LeadStage[] = ['lead', 'qualified', 'proposal', 'negotiation', 'won'];

export default function CRM({ leads, onAddLead, onUpdateLead }: CRMProps) {
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState<'all' | LeadStage>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formState, setFormState] = useState<LeadFormState>(emptyLeadForm);

  const filteredLeads = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return leads
      .filter((lead) => stageFilter === 'all' || lead.stage === stageFilter)
      .filter((lead) => {
        if (!normalizedSearch) {
          return true;
        }
        return [lead.name, lead.company, lead.email, lead.source]
          .join(' ')
          .toLowerCase()
          .includes(normalizedSearch);
      })
      .sort((left, right) => right.value - left.value);
  }, [leads, search, stageFilter]);

  const totalValue = leads.reduce((sum, lead) => sum + lead.value, 0);
  const wonValue = leads.filter((lead) => lead.stage === 'won').reduce((sum, lead) => sum + lead.value, 0);
  const conversionRate = leads.length ? Math.round((leads.filter((lead) => lead.stage === 'won').length / leads.length) * 100) : 0;
  const staleLeads = leads.filter((lead) => lead.stage !== 'won' && getDaysSince(lead.lastContacted) >= 7);

  const advanceLead = (lead: Lead) => {
    const nextStage = stageOrder[stageOrder.indexOf(lead.stage) + 1];
    if (!nextStage) {
      return;
    }
    onUpdateLead(lead.id, { stage: nextStage, lastContacted: new Date().toISOString() });
  };

  const submitLead = () => {
    const value = Number(formState.value);
    if (!formState.name.trim() || !formState.email.trim() || !formState.company.trim() || !value) {
      return;
    }

    onAddLead({
      name: formState.name.trim(),
      email: formState.email.trim(),
      company: formState.company.trim(),
      value,
      stage: formState.stage,
      source: formState.source.trim() || 'Website',
    });

    setFormState(emptyLeadForm);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-white/10 bg-slate-900/60 p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-cyan-300">Revenue engine</p>
            <h1 className="mt-2 text-3xl font-semibold text-white">Turn pipeline management into a daily system</h1>
            <p className="mt-3 max-w-2xl text-slate-400">
              The CRM is now searchable, filterable, and persistent. You can add leads, advance stages quickly,
              and see which conversations are going stale before deals cool off.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            Add lead
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total leads"
          value={String(leads.length)}
          subtitle="Tracked across the funnel"
          icon={<Users className="h-5 w-5 text-cyan-300" />}
          tone="cyan"
        />
        <StatCard
          title="Pipeline value"
          value={formatCompactCurrency(totalValue)}
          subtitle="Open and closed opportunities"
          icon={<DollarSign className="h-5 w-5 text-emerald-300" />}
          tone="emerald"
        />
        <StatCard
          title="Won deals"
          value={formatCompactCurrency(wonValue)}
          subtitle="Closed revenue"
          icon={<Star className="h-5 w-5 text-amber-300" />}
          tone="amber"
        />
        <StatCard
          title="Conversion rate"
          value={`${conversionRate}%`}
          subtitle={`${staleLeads.length} stale follow-up(s)`}
          icon={<TrendingUp className="h-5 w-5 text-violet-300" />}
          tone="violet"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-6">
          <h2 className="text-xl font-semibold text-white">Follow-up automation</h2>
          <p className="mt-2 text-sm text-slate-400">These are the conversations that most likely deserve your next outbound touch.</p>
          <div className="mt-5 space-y-3">
            {staleLeads.length ? (
              staleLeads.slice(0, 4).map((lead) => (
                <div key={lead.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium text-white">{lead.name}</p>
                      <p className="mt-1 text-sm text-slate-400">
                        {lead.company} · {formatCompactCurrency(lead.value)} · {getDaysSince(lead.lastContacted)} days since reply
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onUpdateLead(lead.id, { lastContacted: new Date().toISOString() })}
                      className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-sm text-cyan-300 transition-colors hover:bg-cyan-500/20"
                    >
                      Mark contacted
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] p-4 text-sm text-slate-400">
                No stale leads right now. The pipeline is being maintained well.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-slate-900/60 p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">Lead explorer</h2>
              <p className="mt-1 text-sm text-slate-400">Search contacts and narrow the view by stage.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="relative block">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search leads"
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/50 py-3 pl-11 pr-4 text-sm text-white placeholder-slate-500 focus:border-cyan-500/30 focus:outline-none"
                />
              </label>
              <select
                value={stageFilter}
                onChange={(event) => setStageFilter(event.target.value as 'all' | LeadStage)}
                className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-white focus:border-cyan-500/30 focus:outline-none"
              >
                <option value="all">All stages</option>
                {stageOrder.map((stage) => (
                  <option key={stage} value={stage}>
                    {getStageLabel(stage)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-5">
            {stageOrder.map((stage) => {
              const count = leads.filter((lead) => lead.stage === stage).length;
              const percentage = leads.length ? Math.round((count / leads.length) * 100) : 0;

              return (
                <div key={stage} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm font-medium text-white">{getStageLabel(stage)}</p>
                  <p className="mt-2 text-2xl font-semibold text-white">{count}</p>
                  <p className="text-sm text-slate-400">{percentage}% of pipeline</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-slate-900/60 p-6">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px]">
            <thead>
              <tr className="border-b border-white/10 text-left text-sm text-slate-400">
                <th className="px-4 py-4 font-medium">Contact</th>
                <th className="px-4 py-4 font-medium">Company</th>
                <th className="px-4 py-4 font-medium">Value</th>
                <th className="px-4 py-4 font-medium">Stage</th>
                <th className="px-4 py-4 font-medium">Last contacted</th>
                <th className="px-4 py-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.map((lead) => (
                <tr key={lead.id} className="border-b border-white/5 text-sm text-slate-300 transition-colors hover:bg-white/5">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 font-semibold text-white">
                        {lead.name.split(' ').map((part) => part[0]).join('')}
                      </div>
                      <div>
                        <p className="font-medium text-white">{lead.name}</p>
                        <p className="mt-1 flex items-center gap-1 text-xs text-slate-400">
                          <Mail className="h-3 w-3" />
                          {lead.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-slate-500" />
                      <span>{lead.company}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 font-medium text-white">{formatCurrency(lead.value)}</td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${stageColors[lead.stage]}`}>
                      {getStageLabel(lead.stage)}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-slate-400">
                    {formatShortDate(lead.lastContacted)} · {getDaysSince(lead.lastContacted)} day{getDaysSince(lead.lastContacted) === 1 ? '' : 's'} ago
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => onUpdateLead(lead.id, { lastContacted: new Date().toISOString() })}
                        className="rounded-xl border border-white/10 px-3 py-2 text-xs text-slate-300 transition-colors hover:border-white/20 hover:text-white"
                      >
                        Contacted today
                      </button>
                      <button
                        type="button"
                        onClick={() => advanceLead(lead)}
                        disabled={lead.stage === 'won'}
                        className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-300 transition-colors hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Advance stage
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!filteredLeads.length ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-400">
                    No leads matched your current search or stage filter.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <Modal
        open={isModalOpen}
        title="Add a new lead"
        description="Capture the core deal details now so follow-ups and pipeline visibility stay accurate."
        onClose={() => setIsModalOpen(false)}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm text-slate-300">Full name</span>
            <input
              value={formState.name}
              onChange={(event) => setFormState((current) => ({ ...current, name: event.target.value }))}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white focus:border-cyan-500/30 focus:outline-none"
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm text-slate-300">Email</span>
            <input
              type="email"
              value={formState.email}
              onChange={(event) => setFormState((current) => ({ ...current, email: event.target.value }))}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white focus:border-cyan-500/30 focus:outline-none"
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm text-slate-300">Company</span>
            <input
              value={formState.company}
              onChange={(event) => setFormState((current) => ({ ...current, company: event.target.value }))}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white focus:border-cyan-500/30 focus:outline-none"
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm text-slate-300">Deal value (USD)</span>
            <input
              type="number"
              min="0"
              value={formState.value}
              onChange={(event) => setFormState((current) => ({ ...current, value: event.target.value }))}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white focus:border-cyan-500/30 focus:outline-none"
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm text-slate-300">Stage</span>
            <select
              value={formState.stage}
              onChange={(event) => setFormState((current) => ({ ...current, stage: event.target.value as LeadStage }))}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white focus:border-cyan-500/30 focus:outline-none"
            >
              {stageOrder.map((stage) => (
                <option key={stage} value={stage}>
                  {getStageLabel(stage)}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-sm text-slate-300">Source</span>
            <input
              value={formState.source}
              onChange={(event) => setFormState((current) => ({ ...current, source: event.target.value }))}
              className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white focus:border-cyan-500/30 focus:outline-none"
            />
          </label>
        </div>
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={submitLead}
            className="rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 px-5 py-3 font-medium text-white transition-opacity hover:opacity-90"
          >
            Save lead
          </button>
        </div>
      </Modal>
    </div>
  );
}
