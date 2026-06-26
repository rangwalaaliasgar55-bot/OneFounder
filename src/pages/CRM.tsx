import { useState } from 'react';
import {
  Users,
  Plus,
  Search,
  Mail,
  Building,
  TrendingUp,
  DollarSign,
  Star,
  X,
  Calendar,
  Send,
} from 'lucide-react';
import { useTable } from '../hooks/useTable';
import Modal from '../components/Modal';
import { useToast } from '../components/useToast';

interface Lead {
  id: string;
  name: string;
  email: string;
  company: string;
  value: number;
  stage: 'lead' | 'qualified' | 'proposal' | 'negotiation' | 'won';
  source: string;
  notes?: string;
  activityLog?: { timestamp: string; action: string }[];
}

const initialLeads: Lead[] = [
  { id: '1', name: 'Sarah Johnson', email: 'sarah@techcorp.io', company: 'TechCorp', value: 24000, stage: 'negotiation', source: 'LinkedIn', notes: '', activityLog: [{ timestamp: new Date().toISOString(), action: 'Created lead' }] },
  { id: '2', name: 'Michael Chen', email: 'm.chen@startup.co', company: 'StartupCo', value: 18500, stage: 'proposal', source: 'Referral', notes: '', activityLog: [{ timestamp: new Date().toISOString(), action: 'Created lead' }] },
  { id: '3', name: 'Emily Davis', email: 'emily@enterprise.com', company: 'Enterprise Inc', value: 45000, stage: 'qualified', source: 'Website', notes: '', activityLog: [{ timestamp: new Date().toISOString(), action: 'Created lead' }] },
  { id: '4', name: 'James Wilson', email: 'j.wilson@agency.io', company: 'Digital Agency', value: 12000, stage: 'won', source: 'Cold outreach', notes: '', activityLog: [{ timestamp: new Date().toISOString(), action: 'Created lead' }] },
  { id: '5', name: 'Lisa Anderson', email: 'lisa@fintech.com', company: 'FinTech Solutions', value: 32000, stage: 'lead', source: 'Conference', notes: '', activityLog: [{ timestamp: new Date().toISOString(), action: 'Created lead' }] },
];

const stageColors: Record<string, { bg: string; text: string; border: string }> = {
  lead: { bg: 'bg-slate-500/20', text: 'text-slate-300', border: 'border-slate-500/30' },
  qualified: { bg: 'bg-cyan-500/20', text: 'text-cyan-400', border: 'border-cyan-500/30' },
  proposal: { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30' },
  negotiation: { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/30' },
  won: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30' },
};

const stages = ['lead', 'qualified', 'proposal', 'negotiation', 'won'] as const;

export default function CRM() {
  const toast = useToast();
  const { rows: leads, addRow, updateRow } = useTable<Lead>('leads', initialLeads);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [draggedLead, setDraggedLead] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);

  // Add form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    value: '',
    stage: 'lead' as Lead['stage'],
    source: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Drawer form state
  const [drawerNotes, setDrawerNotes] = useState('');
  const [drawerStage, setDrawerStage] = useState<Lead['stage']>('lead');

  const filteredLeads = leads.filter(
    (lead) =>
      lead.name.toLowerCase().includes(search.toLowerCase()) ||
      lead.company.toLowerCase().includes(search.toLowerCase()),
  );

  const totalValue = leads.reduce((sum, lead) => sum + lead.value, 0);
  const wonValue = leads.filter((l) => l.stage === 'won').reduce((sum, l) => sum + l.value, 0);
  const pipelineProgress = totalValue > 0 ? (wonValue / totalValue) * 100 : 0;

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Invalid email';
    if (!formData.company.trim()) newErrors.company = 'Company is required';
    if (!formData.value || isNaN(Number(formData.value)) || Number(formData.value) < 0)
      newErrors.value = 'Valid deal value required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddLead = async () => {
    if (!validateForm()) return;
    await addRow({
      name: formData.name,
      email: formData.email,
      company: formData.company,
      value: Number(formData.value),
      stage: formData.stage,
      source: formData.source || 'Direct',
      notes: '',
      activityLog: [{ timestamp: new Date().toISOString(), action: 'Created lead' }],
    });
    toast('Lead added successfully');
    setShowAddModal(false);
    setFormData({ name: '', email: '', company: '', value: '', stage: 'lead', source: '' });
    setErrors({});
  };

  const handleDragStart = (leadId: string) => setDraggedLead(leadId);
  const handleDragOver = (e: React.DragEvent, stage: string) => {
    e.preventDefault();
    setDragOverStage(stage);
  };
  const handleDrop = async (stage: string) => {
    if (!draggedLead) return;
    const lead = leads.find((l) => l.id === draggedLead);
    if (lead && lead.stage !== stage) {
      await updateRow(draggedLead, {
        stage: stage as Lead['stage'],
        activityLog: [...(lead.activityLog ?? []), { timestamp: new Date().toISOString(), action: `Moved to ${stage}` }],
      });
      toast(`Lead moved to ${stage}`);
    }
    setDraggedLead(null);
    setDragOverStage(null);
  };

  const openDrawer = (lead: Lead) => {
    setSelectedLead(lead);
    setDrawerNotes(lead.notes ?? '');
    setDrawerStage(lead.stage);
  };

  const saveDrawer = async () => {
    if (!selectedLead) return;
    await updateRow(selectedLead.id, {
      notes: drawerNotes,
      stage: drawerStage,
      activityLog: [...(selectedLead.activityLog ?? []), { timestamp: new Date().toISOString(), action: `Updated notes/stage` }],
    });
    toast('Lead updated');
    setSelectedLead(null);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">CRM</h1>
          <p className="text-slate-400 mt-1">Manage your leads and customers.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          Add Lead
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
          <p className="text-2xl font-bold text-white">{leads.length > 0 ? Math.round((leads.filter((l) => l.stage === 'won').length / leads.length) * 100) : 0}%</p>
          <p className="text-sm text-slate-400">Conversion Rate</p>
        </div>
      </div>

      {/* Pipeline Value Progress Bar */}
      <div className="rounded-2xl bg-slate-800/50 backdrop-blur-sm border border-white/10 p-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-white">Pipeline Value</h2>
          <span className="text-sm text-slate-400">
            ${wonValue.toLocaleString()} / ${totalValue.toLocaleString()}
          </span>
        </div>
        <div className="h-3 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full transition-all duration-500"
            style={{ width: `${pipelineProgress}%` }}
          />
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

      {/* Kanban Pipeline */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {stages.map((stage) => {
          const stageLeads = filteredLeads.filter((l) => l.stage === stage);
          const stageValue = stageLeads.reduce((sum, l) => sum + l.value, 0);
          return (
            <div
              key={stage}
              onDragOver={(e) => handleDragOver(e, stage)}
              onDragLeave={() => setDragOverStage(null)}
              onDrop={() => handleDrop(stage)}
              className={`rounded-xl bg-slate-800/30 border p-3 min-h-[200px] transition-colors ${
                dragOverStage === stage ? 'border-cyan-500/50 bg-cyan-500/5' : 'border-white/10'
              }`}
            >
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${stageColors[stage].bg.replace('/20', '')}`} />
                  <h3 className="font-semibold text-white text-sm capitalize">{stage}</h3>
                </div>
                <span className="text-xs text-slate-400">{stageLeads.length}</span>
              </div>
              <p className="text-xs text-slate-500 mb-3 px-1">${(stageValue / 1000).toFixed(0)}K total</p>
              <div className="space-y-2">
                {stageLeads.map((lead) => (
                  <div
                    key={lead.id}
                    draggable
                    onDragStart={() => handleDragStart(lead.id)}
                    onClick={() => openDrawer(lead)}
                    className="p-3 rounded-lg bg-slate-800 border border-white/10 hover:border-cyan-500/30 transition-all cursor-pointer group hover:scale-[1.02]"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                        {lead.name.split(' ').map((n) => n[0]).join('')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">{lead.name}</p>
                        <p className="text-xs text-slate-400 truncate">{lead.company}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-white text-sm font-semibold">${lead.value.toLocaleString()}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs ${stageColors[lead.stage].bg} ${stageColors[lead.stage].text} border ${stageColors[lead.stage].border}`}>
                        {lead.stage}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Lead Modal */}
      <Modal open={showAddModal} onClose={() => setShowAddModal(false)} title="Add New Lead">
        <div className="space-y-4">
          {[
            { key: 'name', label: 'Name', type: 'text', placeholder: 'John Doe' },
            { key: 'email', label: 'Email', type: 'email', placeholder: 'john@company.com' },
            { key: 'company', label: 'Company', type: 'text', placeholder: 'Acme Inc' },
            { key: 'value', label: 'Deal Value ($)', type: 'number', placeholder: '25000' },
            { key: 'source', label: 'Source', type: 'text', placeholder: 'LinkedIn' },
          ].map((field) => (
            <div key={field.key}>
              <label className="block text-sm text-slate-300 mb-1.5">{field.label}</label>
              <input
                type={field.type}
                value={(formData as Record<string, string>)[field.key]}
                onChange={(e) => setFormData((prev) => ({ ...prev, [field.key]: e.target.value }))}
                placeholder={field.placeholder}
                className={`w-full bg-white/5 border rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none transition-colors ${
                  errors[field.key] ? 'border-rose-500/50' : 'border-white/10 focus:border-cyan-500/50'
                }`}
              />
              {errors[field.key] && <p className="text-xs text-rose-400 mt-1">{errors[field.key]}</p>}
            </div>
          ))}
          <div>
            <label className="block text-sm text-slate-300 mb-1.5">Stage</label>
            <select
              value={formData.stage}
              onChange={(e) => setFormData((prev) => ({ ...prev, stage: e.target.value as Lead['stage'] }))}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500/50"
            >
              {stages.map((s) => (
                <option key={s} value={s} className="bg-slate-800 capitalize">{s}</option>
              ))}
            </select>
          </div>
          <button
            onClick={handleAddLead}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium hover:opacity-90 transition-opacity"
          >
            Add Lead
          </button>
        </div>
      </Modal>

      {/* Lead Detail Drawer */}
      {selectedLead && (
        <div className="fixed inset-0 z-[90] flex justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedLead(null)} />
          <div className="relative w-full max-w-[420px] bg-slate-800 border-l border-white/10 h-full overflow-y-auto animate-fade-in">
            <div className="flex items-center justify-between p-5 border-b border-white/10 sticky top-0 bg-slate-800 z-10">
              <h2 className="text-lg font-semibold text-white">Lead Details</h2>
              <button onClick={() => setSelectedLead(null)} className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-5">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white text-xl font-semibold">
                  {selectedLead.name.split(' ').map((n) => n[0]).join('')}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{selectedLead.name}</h3>
                  <p className="text-slate-400">{selectedLead.company}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                  <Mail className="w-4 h-4 text-cyan-400" />
                  <span className="text-slate-300 text-sm">{selectedLead.email}</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                  <Building className="w-4 h-4 text-cyan-400" />
                  <span className="text-slate-300 text-sm">{selectedLead.company}</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                  <span className="text-slate-300 text-sm">${selectedLead.value.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                  <TrendingUp className="w-4 h-4 text-amber-400" />
                  <span className="text-slate-300 text-sm">Source: {selectedLead.source}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm text-slate-300 mb-1.5">Stage</label>
                <select
                  value={drawerStage}
                  onChange={(e) => setDrawerStage(e.target.value as Lead['stage'])}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500/50"
                >
                  {stages.map((s) => (
                    <option key={s} value={s} className="bg-slate-800 capitalize">{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-slate-300 mb-1.5">Notes</label>
                <textarea
                  value={drawerNotes}
                  onChange={(e) => setDrawerNotes(e.target.value)}
                  rows={4}
                  placeholder="Add notes about this lead..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 resize-none"
                />
              </div>

              <div>
                <h4 className="text-sm font-semibold text-slate-300 mb-2">Activity Log</h4>
                <div className="space-y-2">
                  {(selectedLead.activityLog ?? []).map((log, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-slate-400">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(log.timestamp).toLocaleString()}</span>
                      <span className="text-slate-500">— {log.action}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <a
                  href={`mailto:${selectedLead.email}`}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 transition-colors text-sm"
                >
                  <Send className="w-4 h-4" />
                  Send Email
                </a>
                <button
                  onClick={saveDrawer}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium hover:opacity-90 transition-opacity text-sm"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
