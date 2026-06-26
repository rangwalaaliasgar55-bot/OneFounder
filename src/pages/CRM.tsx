import { useState } from 'react';
import {
  Users,
  Plus,
  Search,
  Mail,
  Phone,
  Building,
  TrendingUp,
  DollarSign,
  Star,
  MoreHorizontal,
} from 'lucide-react';

interface Lead {
  id: string;
  name: string;
  email: string;
  company: string;
  value: number;
  stage: 'lead' | 'qualified' | 'proposal' | 'negotiation' | 'won';
  source: string;
}

const initialLeads: Lead[] = [
  { id: '1', name: 'Sarah Johnson', email: 'sarah@techcorp.io', company: 'TechCorp', value: 24000, stage: 'negotiation', source: 'LinkedIn' },
  { id: '2', name: 'Michael Chen', email: 'm.chen@startup.co', company: 'StartupCo', value: 18500, stage: 'proposal', source: 'Referral' },
  { id: '3', name: 'Emily Davis', email: 'emily@enterprise.com', company: 'Enterprise Inc', value: 45000, stage: 'qualified', source: 'Website' },
  { id: '4', name: 'James Wilson', email: 'j.wilson@agency.io', company: 'Digital Agency', value: 12000, stage: 'won', source: 'Cold outreach' },
  { id: '5', name: 'Lisa Anderson', email: 'lisa@fintech.com', company: 'FinTech Solutions', value: 32000, stage: 'lead', source: 'Conference' },
];

const stageColors: Record<string, string> = {
  lead: 'bg-slate-500',
  qualified: 'bg-cyan-500',
  proposal: 'bg-amber-500',
  negotiation: 'bg-orange-500',
  won: 'bg-emerald-500',
};

const stages = ['lead', 'qualified', 'proposal', 'negotiation', 'won'];

export default function CRM() {
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [search, setSearch] = useState('');

  const filteredLeads = leads.filter(
    (lead) =>
      lead.name.toLowerCase().includes(search.toLowerCase()) ||
      lead.company.toLowerCase().includes(search.toLowerCase())
  );

  const totalValue = leads.reduce((sum, lead) => sum + lead.value, 0);
  const wonValue = leads.filter((l) => l.stage === 'won').reduce((sum, l) => sum + l.value, 0);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">CRM</h1>
          <p className="text-slate-400 mt-1">Manage your leads and customers.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium hover:opacity-90 transition-opacity">
          <Plus className="w-4 h-4" />
          Add Lead
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-800/50 backdrop-blur-sm border border-white/10">
          <Users className="w-5 h-5 text-cyan-400 mb-2" />
          <p className="text-2xl font-bold text-white">{leads.length}</p>
          <p className="text-sm text-slate-400">Total Leads</p>
        </div>
        <div className="p-4 rounded-xl bg-slate-800/50 backdrop-blur-sm border border-white/10">
          <DollarSign className="w-5 h-5 text-emerald-400 mb-2" />
          <p className="text-2xl font-bold text-white">${(totalValue / 1000).toFixed(0)}K</p>
          <p className="text-sm text-slate-400">Pipeline Value</p>
        </div>
        <div className="p-4 rounded-xl bg-slate-800/50 backdrop-blur-sm border border-white/10">
          <Star className="w-5 h-5 text-amber-400 mb-2" />
          <p className="text-2xl font-bold text-white">${(wonValue / 1000).toFixed(0)}K</p>
          <p className="text-sm text-slate-400">Won Deals</p>
        </div>
        <div className="p-4 rounded-xl bg-slate-800/50 backdrop-blur-sm border border-white/10">
          <TrendingUp className="w-5 h-5 text-violet-400 mb-2" />
          <p className="text-2xl font-bold text-white">27%</p>
          <p className="text-sm text-slate-400">Conversion Rate</p>
        </div>
      </div>

      {/* Pipeline Visualization */}
      <div className="rounded-2xl bg-slate-800/50 backdrop-blur-sm border border-white/10 p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Pipeline Stages</h2>
        <div className="flex gap-4">
          {stages.map((stage, index) => {
            const count = leads.filter((l) => l.stage === stage).length;
            const percentage = leads.length > 0 ? (count / leads.length) * 100 : 0;
            return (
              <div key={stage} className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-300 capitalize">{stage.replace('-', ' ')}</span>
                  <span className="text-sm text-slate-400">{count}</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${stageColors[stage]} rounded-full transition-all duration-500`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search leads..."
          className="w-full bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500/50"
        />
      </div>

      {/* Leads Table */}
      <div className="rounded-2xl bg-slate-800/50 backdrop-blur-sm border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left text-sm text-slate-400 font-medium px-6 py-4">Contact</th>
                <th className="text-left text-sm text-slate-400 font-medium px-6 py-4">Company</th>
                <th className="text-left text-sm text-slate-400 font-medium px-6 py-4">Value</th>
                <th className="text-left text-sm text-slate-400 font-medium px-6 py-4">Stage</th>
                <th className="text-left text-sm text-slate-400 font-medium px-6 py-4">Source</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody>
              {filteredLeads.map((lead) => (
                <tr key={lead.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white font-semibold">
                        {lead.name.split(' ').map((n) => n[0]).join('')}
                      </div>
                      <div>
                        <p className="text-white font-medium">{lead.name}</p>
                        <p className="text-sm text-slate-400 flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {lead.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Building className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-300">{lead.company}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-white font-medium">${lead.value.toLocaleString()}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs text-white ${stageColors[lead.stage]}`}>
                      {lead.stage.charAt(0).toUpperCase() + lead.stage.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-400 text-sm">{lead.source}</td>
                  <td className="px-6 py-4">
                    <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                      <MoreHorizontal className="w-4 h-4 text-slate-400" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
