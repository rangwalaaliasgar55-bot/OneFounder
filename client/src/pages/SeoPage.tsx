import { useState, useEffect, useRef } from 'react'
import { api } from '../lib/api'
import { PageHeader } from '../components/ui/PageHeader'
import { EmptyState } from '../components/ui/EmptyState'
import { Modal } from '../components/ui/Modal'
import { LoadingSpinner, PageLoader } from '../components/ui/LoadingSpinner'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const diffColor = (d: number | null) => !d && d !== 0 ? 'text-slate-500' : d < 30 ? 'text-green-400' : d < 60 ? 'text-amber-400' : 'text-red-400'
const diffBg = (d: number | null) => !d && d !== 0 ? 'bg-white/10' : d < 30 ? 'bg-green-400' : d < 60 ? 'bg-amber-400' : 'bg-red-400'
const diffLabel = (d: number | null) => !d && d !== 0 ? '—' : d < 30 ? 'Easy' : d < 60 ? 'Med' : 'Hard'
const fmtVol = (v: number | null) => !v ? '—' : v >= 10000 ? `${(v/1000).toFixed(0)}K` : v >= 1000 ? `${(v/1000).toFixed(1)}K` : String(v)

const rankBadge = (r: number | null) => {
  if (!r) return { cls: 'bg-slate-500/20 text-slate-500', label: '—' }
  if (r <= 3) return { cls: 'bg-yellow-500/20 text-yellow-400', label: `#${r}` }
  if (r <= 10) return { cls: 'bg-green-500/20 text-green-400', label: `#${r}` }
  if (r <= 30) return { cls: 'bg-blue-500/20 text-blue-400', label: `#${r}` }
  return { cls: 'bg-slate-500/20 text-slate-400', label: `#${r}` }
}

const intentColor: Record<string, string> = {
  informational: 'bg-blue-500/15 text-blue-400',
  commercial: 'bg-brand-500/15 text-brand-400',
  transactional: 'bg-green-500/15 text-green-400',
  navigational: 'bg-orange-500/15 text-orange-400',
}
const priorityDot: Record<string, string> = { high: 'bg-red-400', medium: 'bg-amber-400', low: 'bg-slate-500' }
const daColor = (da: number | null) => !da ? 'text-slate-500' : da >= 70 ? 'text-green-400' : da >= 40 ? 'text-amber-400' : 'text-red-400'

// ─── Mini Sparkline ──────────────────────────────────────────────────────────

function Sparkline({ history }: { history: { date: string; rank: number }[] }) {
  if (!history || history.length < 2) return <span className="text-slate-600 text-xs">—</span>
  const ranks = history.map(h => h.rank)
  const min = Math.min(...ranks), max = Math.max(...ranks), range = max - min || 1
  const w = 64, h = 24, pad = 3
  const pts = history.map((p, i) => `${pad + (i/(history.length-1))*(w-pad*2)},${pad + ((p.rank-min)/range)*(h-pad*2)}`)
  const last = ranks[ranks.length-1], first = ranks[0], improved = last < first
  return (
    <div className="flex items-center gap-1.5">
      <svg width={w} height={h} className="overflow-visible">
        <polyline points={pts.join(' ')} fill="none" stroke={improved ? '#34d399' : '#f87171'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={pts[pts.length-1].split(',')[0]} cy={pts[pts.length-1].split(',')[1]} r="2.5" fill={improved ? '#34d399' : '#f87171'} />
      </svg>
      <span className={`text-xs ${improved ? 'text-green-400' : 'text-red-400'}`}>{improved ? '↑' : '↓'}{Math.abs(last-first)}</span>
    </div>
  )
}

// ─── Score Ring ──────────────────────────────────────────────────────────────

function ScoreRing({ score, size = 48 }: { score: number; size?: number }) {
  const r = size/2 - 4, circ = 2*Math.PI*r, dash = (score/100)*circ
  const color = score >= 80 ? '#34d399' : score >= 60 ? '#fbbf24' : '#f87171'
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="3" strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-bold" style={{ color }}>{score}</span>
      </div>
    </div>
  )
}

function GradeBadge({ grade, score }: { grade: string; score: number }) {
  const cls = score >= 80 ? 'text-green-400 border-green-500/30 bg-green-500/10' : score >= 60 ? 'text-amber-400 border-amber-500/30 bg-amber-500/10' : 'text-red-400 border-red-500/30 bg-red-500/10'
  return <span className={`inline-flex items-center justify-center w-10 h-10 rounded-xl border text-lg font-bold ${cls}`}>{grade}</span>
}

function LoadingBanner({ icon, text, color }: { icon: string; text: string; color?: string }) {
  const border = color === 'violet' ? 'border-violet-500/20' : color === 'orange' ? 'border-orange-500/20' : color === 'green' ? 'border-green-500/20' : 'border-brand-500/20'
  return (
    <div className={`card border ${border} mb-5 flex items-center gap-4`}>
      <LoadingSpinner />
      <div>
        <div className="text-white font-medium">{icon} {text}</div>
        <div className="text-slate-400 text-sm">This may take a few seconds...</div>
      </div>
    </div>
  )
}

// ─── SERP Preview ────────────────────────────────────────────────────────────

function SerpPreview({ title, url, description, date }: { title: string; url: string; description: string; date?: string }) {
  const displayUrl = url.replace(/^https?:\/\//, '')
  return (
    <div className="rounded-xl border border-white/10 bg-[#1e1e2e] p-5 max-w-[600px]">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-5 h-5 rounded-full bg-brand-500/30 flex items-center justify-center text-xs">🔗</div>
        <div>
          <div className="text-xs text-slate-400">{displayUrl || 'yoursite.com › blog › page'}</div>
        </div>
      </div>
      <div className={`text-lg font-medium leading-snug mb-1 ${title.length > 60 ? 'text-amber-400' : 'text-[#8ab4f8]'}`}>
        {title || <span className="italic text-slate-600">Page title will appear here</span>}
      </div>
      {date && <div className="text-xs text-slate-500 mb-1">{date} — </div>}
      <div className={`text-sm leading-relaxed ${description.length > 160 ? 'text-amber-300/80' : 'text-slate-400'}`}>
        {description || <span className="italic text-slate-600">Your meta description will appear here. Keep it between 120-160 characters for best results.</span>}
      </div>
      <div className="mt-3 flex gap-4 text-xs">
        <span className={title.length > 60 ? 'text-amber-400' : 'text-green-400'}>{title.length}/60 title chars</span>
        <span className={description.length > 160 ? 'text-amber-400' : description.length < 120 ? 'text-slate-500' : 'text-green-400'}>{description.length}/160 desc chars</span>
      </div>
    </div>
  )
}

// ─── Types ───────────────────────────────────────────────────────────────────

interface Keyword { id: string; keyword: string; volume: number|null; difficulty: number|null; currentRank: number|null; targetRank: number|null; intent: string|null; cluster: string|null; priority: string; status: string; rankHistory: {date:string;rank:number}[]; notes: string|null; targetUrl: string|null; createdAt: string }
interface Brief { id: string; keyword: string; targetAudience: string|null; titles: string[]; metaDescription: string; outline: any[]; wordCount: number; keyPoints: string[]; relatedKeywords: string[]; faqSection: any[]; createdAt: string }
interface Audit { id: string; url: string; score: number; issues: any[]; recommendations: any[]; metadata: any; createdAt: string }
interface Backlink { id: string; sourceUrl: string; sourceDomain: string|null; targetUrl: string; anchorText: string|null; type: string; status: string; domainAuthority: number|null; category: string|null; notes: string|null; createdAt: string }

const TABS = ['Keywords', 'Clusters', 'Briefs', 'Audit', 'Backlinks', 'Tools'] as const
type Tab = typeof TABS[number]

// ─── Main Page ────────────────────────────────────────────────────────────────

export function SeoPage() {
  const [tab, setTab] = useState<Tab>('Keywords')
  const [keywords, setKeywords] = useState<Keyword[]>([])
  const [briefs, setBriefs] = useState<Brief[]>([])
  const [audits, setAudits] = useState<Audit[]>([])
  const [backlinkList, setBacklinkList] = useState<Backlink[]>([])
  const [loading, setLoading] = useState(true)

  // Async states
  const [suggesting, setSuggesting] = useState(false)
  const [clustering, setClustering] = useState(false)
  const [briefLoading, setBriefLoading] = useState(false)
  const [auditLoading, setAuditLoading] = useState(false)
  const [competitorLoading, setCompetitorLoading] = useState(false)
  const [reportLoading, setReportLoading] = useState(false)
  const [schemaLoading, setSchemaLoading] = useState(false)
  const [canniLoading, setCanniLoading] = useState(false)
  const [blFindLoading, setBlFindLoading] = useState(false)

  // Results
  const [clusterResult, setClusterResult] = useState<any>(null)
  const [competitorResult, setCompetitorResult] = useState<any>(null)
  const [competitorUrl, setCompetitorUrl] = useState('')
  const [report, setReport] = useState<any>(null)
  const [schemaResult, setSchemaResult] = useState<any>(null)
  const [canniResult, setCanniResult] = useState<any>(null)
  const [blOpportunities, setBlOpportunities] = useState<any[]>([])

  // Modal states
  const [showAdd, setShowAdd] = useState(false)
  const [showSuggest, setShowSuggest] = useState(false)
  const [showBriefModal, setShowBriefModal] = useState(false)
  const [showAuditModal, setShowAuditModal] = useState(false)
  const [showCompetitor, setShowCompetitor] = useState(false)
  const [showAddBacklink, setShowAddBacklink] = useState(false)
  const [selectedBrief, setSelectedBrief] = useState<Brief|null>(null)
  const [selectedAudit, setSelectedAudit] = useState<Audit|null>(null)
  const [editingRank, setEditingRank] = useState<string|null>(null)
  const [rankInput, setRankInput] = useState('')

  // Filters / sort
  const [filterCluster, setFilterCluster] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterPriority, setFilterPriority] = useState('all')
  const [filterBlStatus, setFilterBlStatus] = useState('all')
  const [sortBy, setSortBy] = useState<'volume'|'difficulty'|'rank'|'date'>('date')

  // Forms
  const [addForm, setAddForm] = useState({ keyword:'', targetUrl:'', volume:'', difficulty:'', currentRank:'', targetRank:'', intent:'', cluster:'', priority:'medium', status:'tracking', notes:'' })
  const [suggestForm, setSuggestForm] = useState({ niche:'', seedKeyword:'', count:'10' })
  const [briefForm, setBriefForm] = useState({ keyword:'', targetAudience:'', businessContext:'' })
  const [auditForm, setAuditForm] = useState({ url:'', pageTitle:'', metaDescription:'', h1:'', wordCount:'', internalLinks:'', externalLinks:'', pageContent:'' })
  const [competitorForm, setCompetitorForm] = useState({ competitorUrl:'', niche:'' })
  const [blForm, setBlForm] = useState({ sourceUrl:'', targetUrl:'', anchorText:'', type:'dofollow', status:'active', domainAuthority:'', category:'editorial', notes:'' })
  const [reportForm, setReportForm] = useState({ period:'', websiteUrl:'', goals:'' })
  const [schemaForm, setSchemaForm] = useState({ schemaType:'Article', data:'{}' })
  const [canniPages, setCanniPages] = useState('')
  const [blFindForm, setBlFindForm] = useState({ websiteUrl:'', niche:'' })

  // SERP Preview state (in Tools tab)
  const [serpTitle, setSerpTitle] = useState('')
  const [serpUrl, setSerpUrl] = useState('')
  const [serpDesc, setSerpDesc] = useState('')

  useEffect(() => {
    Promise.all([
      api.get<Keyword[]>('/seo'),
      api.get<Brief[]>('/seo/briefs'),
      api.get<Audit[]>('/seo/audits'),
      api.get<Backlink[]>('/seo/backlinks'),
    ]).then(([kw,br,au,bl]) => { setKeywords(kw); setBriefs(br); setAudits(au); setBacklinkList(bl) })
      .finally(() => setLoading(false))
  }, [])

  // ─── Keyword actions ──────────────────────────────────────────────────────
  const addKeyword = async () => {
    const kw = await api.post<Keyword>('/seo', addForm)
    setKeywords(p => [kw, ...p])
    setShowAdd(false)
    setAddForm({ keyword:'', targetUrl:'', volume:'', difficulty:'', currentRank:'', targetRank:'', intent:'', cluster:'', priority:'medium', status:'tracking', notes:'' })
  }

  const updateKeyword = async (id: string, updates: any) => {
    const updated = await api.patch<Keyword>(`/seo/${id}`, updates)
    setKeywords(p => p.map(k => k.id === id ? updated : k))
  }

  const saveRank = async (id: string) => {
    if (!rankInput.trim()) { setEditingRank(null); return }
    await updateKeyword(id, { currentRank: parseInt(rankInput) })
    setEditingRank(null); setRankInput('')
  }

  const deleteKeyword = async (id: string) => {
    await api.delete(`/seo/${id}`)
    setKeywords(p => p.filter(k => k.id !== id))
  }

  // ─── AI actions ───────────────────────────────────────────────────────────
  const suggestKeywords = async () => {
    setSuggesting(true); setShowSuggest(false)
    try { const kws = await api.post<Keyword[]>('/seo/suggest', suggestForm); setKeywords(p => [...kws, ...p]) }
    catch (e: any) { alert(e.message) } finally { setSuggesting(false) }
  }

  const generateBrief = async () => {
    setBriefLoading(true); setShowBriefModal(false)
    try {
      const b = await api.post<Brief>('/seo/brief', briefForm)
      setBriefs(p => [b, ...p]); setSelectedBrief(b); setTab('Briefs')
    } catch (e: any) { alert(e.message) } finally { setBriefLoading(false) }
  }

  const runAudit = async () => {
    setAuditLoading(true); setShowAuditModal(false)
    try {
      const a = await api.post<Audit>('/seo/audit', auditForm)
      setAudits(p => [a, ...p]); setSelectedAudit(a); setTab('Audit')
    } catch (e: any) { alert(e.message) } finally { setAuditLoading(false) }
  }

  const analyzeCompetitor = async () => {
    setCompetitorLoading(true); setShowCompetitor(false)
    setCompetitorUrl(competitorForm.competitorUrl)
    try {
      const r = await api.post('/seo/competitor', { ...competitorForm, yourKeywords: keywords.map(k => k.keyword) })
      setCompetitorResult(r); setTab('Clusters')
    } catch (e: any) { alert(e.message) } finally { setCompetitorLoading(false) }
  }

  const clusterKeywords = async () => {
    if (keywords.length < 3) { alert('Add at least 3 keywords first.'); return }
    setClustering(true)
    try {
      const r = await api.post('/seo/cluster', { keywords: keywords.map(k => k.keyword) })
      setClusterResult(r)
      const updated = await api.get<Keyword[]>('/seo'); setKeywords(updated)
    } catch (e: any) { alert(e.message) } finally { setClustering(false) }
  }

  const generateReport = async () => {
    setReportLoading(true)
    try { const r = await api.post('/seo/report', reportForm); setReport(r) }
    catch (e: any) { alert(e.message) } finally { setReportLoading(false) }
  }

  const generateSchema = async () => {
    setSchemaLoading(true)
    try {
      let parsed = {}
      try { parsed = JSON.parse(schemaForm.data) } catch {}
      const r = await api.post('/seo/schema', { schemaType: schemaForm.schemaType, data: parsed })
      setSchemaResult(r)
    } catch (e: any) { alert(e.message) } finally { setSchemaLoading(false) }
  }

  const checkCannibalization = async () => {
    setCanniLoading(true)
    try {
      const pages = canniPages.trim().split('\n').filter(Boolean).map(line => {
        const [url, ...kws] = line.split(',').map(s => s.trim())
        return { url, keywords: kws }
      })
      const r = await api.post('/seo/cannibalization', { pages })
      setCanniResult(r)
    } catch (e: any) { alert(e.message) } finally { setCanniLoading(false) }
  }

  const findBacklinks = async () => {
    setBlFindLoading(true)
    try { const r = await api.post<any[]>('/seo/backlinks/find', blFindForm); setBlOpportunities(r) }
    catch (e: any) { alert(e.message) } finally { setBlFindLoading(false) }
  }

  const addBacklink = async () => {
    const bl = await api.post<Backlink>('/seo/backlinks', blForm)
    setBacklinkList(p => [bl, ...p])
    setShowAddBacklink(false)
    setBlForm({ sourceUrl:'', targetUrl:'', anchorText:'', type:'dofollow', status:'active', domainAuthority:'', category:'editorial', notes:'' })
  }

  const updateBacklink = async (id: string, updates: any) => {
    const updated = await api.patch<Backlink>(`/seo/backlinks/${id}`, updates)
    setBacklinkList(p => p.map(b => b.id === id ? updated : b))
  }

  const deleteBacklink = async (id: string) => {
    await api.delete(`/seo/backlinks/${id}`)
    setBacklinkList(p => p.filter(b => b.id !== id))
  }

  const deleteBrief = async (id: string) => {
    await api.delete(`/seo/briefs/${id}`)
    setBriefs(p => p.filter(b => b.id !== id))
    if (selectedBrief?.id === id) setSelectedBrief(null)
  }

  const deleteAudit = async (id: string) => {
    await api.delete(`/seo/audits/${id}`)
    setAudits(p => p.filter(a => a.id !== id))
    if (selectedAudit?.id === id) setSelectedAudit(null)
  }

  if (loading) return <PageLoader />

  // ─── Derived ──────────────────────────────────────────────────────────────
  const clusterLabels = ['all', ...Array.from(new Set(keywords.filter(k => k.cluster).map(k => k.cluster!)))]
  const filtered = keywords
    .filter(k => filterCluster === 'all' || k.cluster === filterCluster)
    .filter(k => filterStatus === 'all' || k.status === filterStatus)
    .filter(k => filterPriority === 'all' || k.priority === filterPriority)
    .sort((a,b) => sortBy === 'volume' ? (b.volume||0)-(a.volume||0) : sortBy === 'difficulty' ? (a.difficulty||100)-(b.difficulty||100) : sortBy === 'rank' ? (a.currentRank||999)-(b.currentRank||999) : new Date(b.createdAt).getTime()-new Date(a.createdAt).getTime())

  const stats = {
    total: keywords.length,
    totalVolume: keywords.reduce((s,k) => s+(k.volume||0), 0),
    avgDiff: keywords.filter(k=>k.difficulty).length ? Math.round(keywords.filter(k=>k.difficulty).reduce((s,k)=>s+k.difficulty!,0)/keywords.filter(k=>k.difficulty).length) : null,
    top10: keywords.filter(k=>k.currentRank&&k.currentRank<=10).length,
    top3: keywords.filter(k=>k.currentRank&&k.currentRank<=3).length,
    achieved: keywords.filter(k=>k.status==='achieved').length,
    highPriority: keywords.filter(k=>k.priority==='high').length,
  }

  const clusterGroups = keywords.reduce((acc,k) => { const c=k.cluster||'Unclustered'; if(!acc[c]) acc[c]=[]; acc[c].push(k); return acc }, {} as Record<string,Keyword[]>)

  const blFiltered = backlinkList.filter(b => filterBlStatus === 'all' || b.status === filterBlStatus)
  const blStats = {
    total: backlinkList.length,
    active: backlinkList.filter(b=>b.status==='active').length,
    lost: backlinkList.filter(b=>b.status==='lost').length,
    dofollow: backlinkList.filter(b=>b.type==='dofollow').length,
    avgDA: backlinkList.filter(b=>b.domainAuthority).length ? Math.round(backlinkList.filter(b=>b.domainAuthority).reduce((s,b)=>s+(b.domainAuthority||0),0)/backlinkList.filter(b=>b.domainAuthority).length) : null,
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PageHeader
        icon="🔎"
        title="SEO OS"
        description="Keywords · Rankings · Clusters · Briefs · Audits · Backlinks · Tools"
        action={
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setShowCompetitor(true)} className="btn-ghost text-sm">🕵️ Competitor</button>
            <button onClick={() => setShowBriefModal(true)} className="btn-secondary text-sm">📝 Brief</button>
            <button onClick={() => setShowAuditModal(true)} className="btn-secondary text-sm">🔬 Audit</button>
            <button onClick={() => setShowSuggest(true)} className="btn-secondary text-sm">🤖 AI Suggest</button>
            <button onClick={() => setShowAdd(true)} className="btn-primary text-sm">+ Keyword</button>
          </div>
        }
      />

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
        {[
          { label:'Keywords', value:stats.total, icon:'🔑', color:'text-white' },
          { label:'Search Volume', value:fmtVol(stats.totalVolume), icon:'📊', color:'text-brand-400' },
          { label:'Avg KD', value:stats.avgDiff ?? '—', icon:'💪', color:diffColor(stats.avgDiff) },
          { label:'Top 3', value:stats.top3, icon:'🥇', color:'text-yellow-400' },
          { label:'Top 10', value:stats.top10, icon:'🏆', color:'text-green-400' },
          { label:'High Priority', value:stats.highPriority, icon:'🎯', color:'text-red-400' },
          { label:'Backlinks', value:blStats.active, icon:'🔗', color:'text-cyan-400' },
        ].map(s => (
          <div key={s.label} className="card py-3 px-3">
            <div className="text-sm mb-0.5">{s.icon}</div>
            <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-slate-600 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Loading Banners */}
      {suggesting && <LoadingBanner icon="🤖" text="AI is finding keyword opportunities..." />}
      {clustering && <LoadingBanner icon="🧩" text="AI is grouping keywords into topic clusters..." color="violet" />}
      {briefLoading && <LoadingBanner icon="📝" text="Generating SEO content brief..." color="violet" />}
      {auditLoading && <LoadingBanner icon="🔬" text="Running SEO audit analysis..." />}
      {competitorLoading && <LoadingBanner icon="🕵️" text={`Analyzing ${competitorForm.competitorUrl}...`} color="orange" />}
      {reportLoading && <LoadingBanner icon="📊" text="Generating monthly SEO report..." color="green" />}
      {schemaLoading && <LoadingBanner icon="🏷️" text="Generating JSON-LD schema markup..." />}
      {canniLoading && <LoadingBanner icon="🔍" text="Checking for keyword cannibalization..." color="orange" />}
      {blFindLoading && <LoadingBanner icon="🔗" text="Finding backlink opportunities..." color="violet" />}

      {/* Tab Bar */}
      <div className="flex gap-0 mb-6 border-b border-white/10 overflow-x-auto">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-all -mb-px ${tab === t ? 'border-brand-500 text-white' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>
            {t === 'Keywords' ? `${t} (${keywords.length})` : t === 'Clusters' ? `${t} (${Object.keys(clusterGroups).length})` : t === 'Briefs' ? `${t} (${briefs.length})` : t === 'Audit' ? `${t} (${audits.length})` : t === 'Backlinks' ? `${t} (${backlinkList.length})` : t}
          </button>
        ))}
      </div>

      {/* ══════════ KEYWORDS TAB ══════════ */}
      {tab === 'Keywords' && (
        <div>
          <div className="flex flex-wrap gap-2 mb-4">
            <select className="glass text-sm text-slate-300 px-3 py-1.5 rounded-lg bg-transparent cursor-pointer" value={filterCluster} onChange={e=>setFilterCluster(e.target.value)}>
              {clusterLabels.map(c=><option key={c} value={c} className="bg-gray-900">{c==='all'?'All Clusters':c}</option>)}
            </select>
            <select className="glass text-sm text-slate-300 px-3 py-1.5 rounded-lg bg-transparent cursor-pointer" value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}>
              {['all','tracking','paused','achieved'].map(s=><option key={s} value={s} className="bg-gray-900">{s==='all'?'All Status':s[0].toUpperCase()+s.slice(1)}</option>)}
            </select>
            <select className="glass text-sm text-slate-300 px-3 py-1.5 rounded-lg bg-transparent cursor-pointer" value={filterPriority} onChange={e=>setFilterPriority(e.target.value)}>
              {['all','high','medium','low'].map(p=><option key={p} value={p} className="bg-gray-900">{p==='all'?'All Priority':p[0].toUpperCase()+p.slice(1)}</option>)}
            </select>
            <div className="ml-auto flex gap-1">
              {(['date','volume','difficulty','rank'] as const).map(s=>(
                <button key={s} onClick={()=>setSortBy(s)} className={`text-xs px-2.5 py-1.5 rounded-lg transition-all ${sortBy===s?'bg-brand-600 text-white':'glass text-slate-400 hover:text-white'}`}>{s[0].toUpperCase()+s.slice(1)}</button>
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <EmptyState icon="🔑" title="No keywords yet" description="Add keywords manually or let AI discover opportunities"
              action={<div className="flex gap-2"><button onClick={()=>setShowAdd(true)} className="btn-secondary">Add Keyword</button><button onClick={()=>setShowSuggest(true)} className="btn-primary">🤖 AI Suggest</button></div>} />
          ) : (
            <div className="card p-0 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-slate-500 border-b border-white/10">
                    <th className="px-4 py-3 font-medium">Keyword</th>
                    <th className="px-4 py-3 font-medium">Volume</th>
                    <th className="px-4 py-3 font-medium">KD</th>
                    <th className="px-4 py-3 font-medium">Rank</th>
                    <th className="px-4 py-3 font-medium">Trend</th>
                    <th className="px-4 py-3 font-medium">Intent</th>
                    <th className="px-4 py-3 font-medium">Cluster</th>
                    <th className="px-4 py-3 font-medium">Priority</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium w-8"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filtered.map(kw => {
                    const rb = rankBadge(kw.currentRank)
                    return (
                      <tr key={kw.id} className="hover:bg-white/3 transition-colors group">
                        <td className="px-4 py-3">
                          <div className="text-white font-medium">{kw.keyword}</div>
                          {kw.targetUrl && <div className="text-xs text-slate-600 truncate max-w-48">{kw.targetUrl.replace(/^https?:\/\//,'')}</div>}
                          {kw.targetRank && <div className="text-xs text-slate-600">Target: #{kw.targetRank}</div>}
                        </td>
                        <td className="px-4 py-3 text-slate-300 font-medium">{fmtVol(kw.volume)}</td>
                        <td className="px-4 py-3">
                          {kw.difficulty !== null ? (
                            <div className="flex items-center gap-1.5">
                              <div className="w-12 h-1.5 rounded-full bg-white/10 overflow-hidden"><div className={`h-full rounded-full ${diffBg(kw.difficulty)}`} style={{width:`${kw.difficulty}%`}} /></div>
                              <span className={`text-xs ${diffColor(kw.difficulty)}`}>{diffLabel(kw.difficulty)}</span>
                            </div>
                          ) : <span className="text-slate-600">—</span>}
                        </td>
                        <td className="px-4 py-3">
                          {editingRank === kw.id ? (
                            <div className="flex items-center gap-1">
                              <input className="w-14 bg-white/10 border border-white/20 rounded px-2 py-1 text-xs text-white" value={rankInput} onChange={e=>setRankInput(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')saveRank(kw.id);if(e.key==='Escape')setEditingRank(null)}} autoFocus placeholder="#" />
                              <button onClick={()=>saveRank(kw.id)} className="text-xs text-green-400 px-1">✓</button>
                            </div>
                          ) : (
                            <button onClick={()=>{setEditingRank(kw.id);setRankInput(kw.currentRank?.toString()||'')}}>
                              <span className={`badge ${rb.cls}`}>{rb.label}</span>
                            </button>
                          )}
                        </td>
                        <td className="px-4 py-3"><Sparkline history={kw.rankHistory||[]} /></td>
                        <td className="px-4 py-3">
                          {kw.intent ? <span className={`text-xs px-2 py-0.5 rounded-full ${intentColor[kw.intent]||'bg-slate-500/20 text-slate-400'}`}>{kw.intent.slice(0,4)}</span> : <span className="text-slate-600">—</span>}
                        </td>
                        <td className="px-4 py-3">
                          {kw.cluster ? <span className="text-xs bg-white/10 text-slate-300 px-2 py-0.5 rounded-full truncate max-w-24 block">{kw.cluster}</span> : <span className="text-slate-600">—</span>}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <div className={`w-1.5 h-1.5 rounded-full ${priorityDot[kw.priority]||'bg-slate-500'}`} />
                            <span className="text-xs text-slate-400 capitalize">{kw.priority}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <select className="text-xs bg-transparent text-slate-400 cursor-pointer" value={kw.status} onChange={e=>updateKeyword(kw.id,{status:e.target.value})} onClick={e=>e.stopPropagation()}>
                            {['tracking','paused','achieved'].map(s=><option key={s} value={s} className="bg-gray-900">{s}</option>)}
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <button onClick={()=>deleteKeyword(kw.id)} className="btn-ghost p-1 opacity-0 group-hover:opacity-100 text-red-400 hover:bg-red-500/10">🗑️</button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ══════════ CLUSTERS TAB ══════════ */}
      {tab === 'Clusters' && (
        <div>
          <div className="flex items-center justify-between mb-5">
            <p className="text-sm text-slate-400">Topic clusters group keywords into content pillars. Each cluster should have one authoritative pillar page.</p>
            <div className="flex gap-2">
              <button onClick={()=>setShowCompetitor(true)} className="btn-secondary text-sm">🕵️ Competitor Analysis</button>
              <button onClick={clusterKeywords} disabled={clustering||keywords.length<3} className="btn-primary text-sm">
                {clustering ? <LoadingSpinner size="sm" /> : '🧩 Re-cluster with AI'}
              </button>
            </div>
          </div>

          {competitorResult && (
            <div className="card border border-orange-500/20 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-white">🕵️ Competitor: <span className="text-orange-400">{competitorUrl}</span></h3>
                <button onClick={()=>setCompetitorResult(null)} className="btn-ghost p-1.5 text-slate-500">✕</button>
              </div>
              <div className="grid lg:grid-cols-3 gap-4">
                <div>
                  <div className="label mb-2">Content Strategy</div>
                  <p className="text-sm text-slate-300 glass rounded-lg p-3">{competitorResult.contentStrategy}</p>
                  <div className="label mt-3 mb-2">Strengths</div>
                  {(competitorResult.strengths||[]).map((s:string,i:number)=><div key={i} className="flex gap-2 text-sm text-slate-300 mb-1"><span className="text-red-400">⚡</span>{s}</div>)}
                </div>
                <div>
                  <div className="label mb-2">Keyword Gaps (Your Opportunities)</div>
                  <div className="space-y-2">
                    {(competitorResult.keywordGaps||[]).map((g:any,i:number)=>(
                      <div key={i} className="glass rounded-lg p-3">
                        <div className="text-sm text-white font-medium">{g.keyword}</div>
                        <div className="text-xs text-brand-400 mt-0.5">{g.opportunity}</div>
                        <div className="flex gap-2 mt-1 text-xs text-slate-500"><span>Vol: {fmtVol(g.volume)}</span><span className={diffColor(g.difficulty)}>KD: {g.difficulty}</span></div>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="label mb-2">Action Plan</div>
                  {(competitorResult.actionPlan||[]).map((a:string,i:number)=>(
                    <div key={i} className="flex gap-2 text-sm text-slate-300 mb-2">
                      <span className="text-brand-400 font-mono text-xs mt-0.5 flex-shrink-0">{i+1}.</span>{a}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {Object.keys(clusterGroups).length === 0 ? (
            <EmptyState icon="🧩" title="No clusters yet" description="Add keywords and click Re-cluster with AI to group them into topic pillars"
              action={<button onClick={clusterKeywords} disabled={keywords.length<3} className="btn-primary">🧩 Cluster Keywords</button>} />
          ) : (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
              {Object.entries(clusterGroups).map(([cluster, kws]) => {
                const totalVol = kws.reduce((s,k)=>s+(k.volume||0),0)
                const avgDiff = kws.filter(k=>k.difficulty).length ? Math.round(kws.filter(k=>k.difficulty).reduce((s,k)=>s+k.difficulty!,0)/kws.filter(k=>k.difficulty).length) : null
                return (
                  <div key={cluster} className="card">
                    <div className="flex items-start justify-between mb-3">
                      <div><h3 className="text-sm font-semibold text-white">{cluster}</h3><div className="text-xs text-slate-500 mt-0.5">{kws.length} keywords</div></div>
                      <div className="text-right text-xs space-y-0.5">
                        <div className="text-brand-400">Vol: {fmtVol(totalVol)}</div>
                        {avgDiff!==null && <div className={diffColor(avgDiff)}>KD: {avgDiff}</div>}
                      </div>
                    </div>
                    <div className="flex gap-2 mb-3 flex-wrap">
                      {kws.filter(k=>k.priority==='high').length>0 && <span className="text-xs bg-red-500/10 text-red-400 px-2 py-0.5 rounded-full">{kws.filter(k=>k.priority==='high').length} high priority</span>}
                      {kws.filter(k=>k.currentRank&&k.currentRank<=10).length>0 && <span className="text-xs bg-green-500/10 text-green-400 px-2 py-0.5 rounded-full">{kws.filter(k=>k.currentRank&&k.currentRank<=10).length} top 10</span>}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {kws.slice(0,8).map(k=>(
                        <span key={k.id} className={`text-xs px-2 py-0.5 rounded-full border ${k.priority==='high'?'border-red-500/20 text-red-400 bg-red-500/10':k.currentRank&&k.currentRank<=10?'border-green-500/20 text-green-400 bg-green-500/10':'border-white/10 text-slate-400 bg-white/5'}`}>{k.keyword}</span>
                      ))}
                      {kws.length>8 && <span className="text-xs text-slate-600">+{kws.length-8} more</span>}
                    </div>
                    <div className="mt-3 pt-3 border-t border-white/5">
                      <button onClick={()=>{setBriefForm(f=>({...f,keyword:kws[0]?.keyword||''}));setShowBriefModal(true)}} className="text-xs text-brand-400 hover:text-brand-300">📝 Generate pillar brief →</button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ══════════ BRIEFS TAB ══════════ */}
      {tab === 'Briefs' && (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="space-y-3">
            <button onClick={()=>setShowBriefModal(true)} className="btn-primary w-full">+ New Content Brief</button>
            {briefs.length === 0 ? <div className="text-center py-8 text-slate-500 text-sm">No briefs yet.</div>
              : briefs.map(b=>(
                <div key={b.id} onClick={()=>setSelectedBrief(b)} className={`card-hover p-3 ${selectedBrief?.id===b.id?'border-brand-500/40 bg-brand-500/5':''}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-white truncate">{b.keyword}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{b.wordCount?`~${b.wordCount} words · `:''}{ new Date(b.createdAt).toLocaleDateString()}</div>
                    </div>
                    <button onClick={e=>{e.stopPropagation();deleteBrief(b.id)}} className="btn-ghost p-1 text-red-400 hover:bg-red-500/10 flex-shrink-0 opacity-0 group-hover:opacity-100">🗑️</button>
                  </div>
                </div>
              ))
            }
          </div>
          <div className="lg:col-span-2">
            {selectedBrief ? <BriefDetail brief={selectedBrief} onDelete={()=>deleteBrief(selectedBrief.id)} /> : <div className="flex items-center justify-center h-64 text-slate-600 text-sm">Select a brief to view</div>}
          </div>
        </div>
      )}

      {/* ══════════ AUDIT TAB ══════════ */}
      {tab === 'Audit' && (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="space-y-3">
            <button onClick={()=>setShowAuditModal(true)} className="btn-primary w-full">🔬 Run New Audit</button>
            {audits.length === 0 ? <div className="text-center py-8 text-slate-500 text-sm">No audits yet.</div>
              : audits.map(a=>(
                <div key={a.id} onClick={()=>setSelectedAudit(a)} className={`card-hover p-3 ${selectedAudit?.id===a.id?'border-brand-500/40 bg-brand-500/5':''}`}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-white truncate">{a.url.replace(/^https?:\/\//,'')}</div>
                      <div className="text-xs text-slate-500">{new Date(a.createdAt).toLocaleDateString()}</div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <ScoreRing score={a.score} size={32} />
                      <button onClick={e=>{e.stopPropagation();deleteAudit(a.id)}} className="btn-ghost p-1 text-red-400 hover:bg-red-500/10">🗑️</button>
                    </div>
                  </div>
                </div>
              ))
            }
          </div>
          <div className="lg:col-span-2">
            {selectedAudit ? <AuditDetail audit={selectedAudit} /> : (
              <div className="flex flex-col items-center justify-center h-64 text-slate-600 text-sm gap-3">
                <span className="text-4xl">🔬</span>
                <span>Select an audit or run a new one</span>
                <button onClick={()=>setShowAuditModal(true)} className="btn-secondary text-sm">Run first audit</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════ BACKLINKS TAB ══════════ */}
      {tab === 'Backlinks' && (
        <div>
          {/* Backlink Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-5">
            {[
              { label:'Total', value:blStats.total, color:'text-white' },
              { label:'Active', value:blStats.active, color:'text-green-400' },
              { label:'Lost', value:blStats.lost, color:'text-red-400' },
              { label:'Dofollow', value:blStats.dofollow, color:'text-brand-400' },
              { label:'Avg DA', value:blStats.avgDA??'—', color:daColor(blStats.avgDA) },
            ].map(s=>(
              <div key={s.label} className="card py-3 px-3 text-center">
                <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                <div className="text-xs text-slate-600 mt-1">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            <select className="glass text-sm text-slate-300 px-3 py-1.5 rounded-lg bg-transparent cursor-pointer" value={filterBlStatus} onChange={e=>setFilterBlStatus(e.target.value)}>
              {['all','active','lost','pending','broken'].map(s=><option key={s} value={s} className="bg-gray-900">{s==='all'?'All Status':s[0].toUpperCase()+s.slice(1)}</option>)}
            </select>
            <div className="ml-auto flex gap-2">
              <button onClick={()=>{setTab('Tools')}} className="btn-secondary text-sm">🔍 Find Opportunities</button>
              <button onClick={()=>setShowAddBacklink(true)} className="btn-primary text-sm">+ Add Backlink</button>
            </div>
          </div>

          {blFiltered.length === 0 ? (
            <EmptyState icon="🔗" title="No backlinks tracked" description="Add backlinks manually or use AI to find link building opportunities"
              action={<div className="flex gap-2"><button onClick={()=>setShowAddBacklink(true)} className="btn-secondary">Add Backlink</button><button onClick={()=>setTab('Tools')} className="btn-primary">🔍 Find Opportunities</button></div>} />
          ) : (
            <div className="card p-0 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-slate-500 border-b border-white/10">
                    <th className="px-4 py-3 font-medium">Source Domain</th>
                    <th className="px-4 py-3 font-medium">DA</th>
                    <th className="px-4 py-3 font-medium">Anchor Text</th>
                    <th className="px-4 py-3 font-medium">Target Page</th>
                    <th className="px-4 py-3 font-medium">Type</th>
                    <th className="px-4 py-3 font-medium">Category</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium w-8"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {blFiltered.map(bl => (
                    <tr key={bl.id} className="hover:bg-white/3 group">
                      <td className="px-4 py-3">
                        <a href={bl.sourceUrl} target="_blank" rel="noreferrer" className="text-white font-medium hover:text-brand-400 transition-colors">
                          {bl.sourceDomain || bl.sourceUrl.replace(/^https?:\/\//,'').split('/')[0]}
                        </a>
                      </td>
                      <td className="px-4 py-3">
                        {bl.domainAuthority ? <span className={`font-bold ${daColor(bl.domainAuthority)}`}>{bl.domainAuthority}</span> : <span className="text-slate-600">—</span>}
                      </td>
                      <td className="px-4 py-3 text-slate-300 italic">{bl.anchorText||<span className="text-slate-600 not-italic">—</span>}</td>
                      <td className="px-4 py-3 text-xs text-slate-400 truncate max-w-32">{bl.targetUrl.replace(/^https?:\/\//,'')}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${bl.type==='dofollow'?'bg-green-500/15 text-green-400':'bg-slate-500/20 text-slate-400'}`}>{bl.type}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400 capitalize">{bl.category||'—'}</td>
                      <td className="px-4 py-3">
                        <select className={`text-xs bg-transparent cursor-pointer font-medium ${bl.status==='active'?'text-green-400':bl.status==='lost'?'text-red-400':bl.status==='broken'?'text-orange-400':'text-slate-400'}`}
                          value={bl.status} onChange={e=>updateBacklink(bl.id,{status:e.target.value})}>
                          {['active','lost','pending','broken'].map(s=><option key={s} value={s} className="bg-gray-900">{s}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={()=>deleteBacklink(bl.id)} className="btn-ghost p-1 opacity-0 group-hover:opacity-100 text-red-400 hover:bg-red-500/10">🗑️</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Backlink Opportunities */}
          {blOpportunities.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-white mb-3">🔗 Link Building Opportunities</h3>
              <div className="grid md:grid-cols-2 gap-3">
                {blOpportunities.map((opp, i) => (
                  <div key={i} className="card p-3">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <div className="text-sm font-medium text-white">{opp.sourceDomain}</div>
                        <div className="flex gap-2 mt-0.5">
                          <span className={`text-xs font-bold ${daColor(opp.domainAuthority)}`}>DA {opp.domainAuthority}</span>
                          <span className="text-xs bg-white/10 text-slate-400 px-1.5 py-0.5 rounded">{opp.category}</span>
                          <span className={`text-xs px-1.5 py-0.5 rounded ${opp.difficulty==='easy'?'bg-green-500/10 text-green-400':opp.difficulty==='medium'?'bg-amber-500/10 text-amber-400':'bg-red-500/10 text-red-400'}`}>{opp.difficulty}</span>
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${opp.type==='dofollow'?'bg-green-500/15 text-green-400':'bg-slate-500/20 text-slate-400'}`}>{opp.type}</span>
                    </div>
                    <p className="text-xs text-slate-400">{opp.strategy}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════ TOOLS TAB ══════════ */}
      {tab === 'Tools' && (
        <div className="space-y-8">

          {/* SERP Preview */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">🖥️</span>
              <h2 className="text-base font-semibold text-white">SERP Preview</h2>
              <span className="text-xs text-slate-500 ml-1">See how your page looks in Google search results</span>
            </div>
            <div className="grid lg:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <label className="label">Page Title</label>
                  <input className="input" placeholder="The Complete Guide to Email Marketing (2025)" value={serpTitle} onChange={e=>setSerpTitle(e.target.value)} />
                  <div className={`text-xs text-right mt-1 ${serpTitle.length>60?'text-amber-400':serpTitle.length>50?'text-slate-400':'text-slate-600'}`}>{serpTitle.length}/60</div>
                </div>
                <div>
                  <label className="label">Page URL</label>
                  <input className="input" placeholder="https://yoursite.com/blog/email-marketing-guide" value={serpUrl} onChange={e=>setSerpUrl(e.target.value)} />
                </div>
                <div>
                  <label className="label">Meta Description</label>
                  <textarea className="input resize-none h-20" placeholder="Learn everything about email marketing. Our guide covers automation, sequences, best practices, and proven strategies for 2025." value={serpDesc} onChange={e=>setSerpDesc(e.target.value)} />
                  <div className={`text-xs text-right mt-1 ${serpDesc.length>160?'text-amber-400':serpDesc.length>=120?'text-green-400':'text-slate-500'}`}>{serpDesc.length}/160</div>
                </div>
              </div>
              <div>
                <div className="label mb-2">Live Preview</div>
                <SerpPreview title={serpTitle} url={serpUrl} description={serpDesc} />
                <div className="mt-3 space-y-1">
                  {serpTitle.length > 60 && <div className="text-xs text-amber-400">⚠️ Title too long — Google will truncate it</div>}
                  {serpTitle.length > 0 && serpTitle.length < 30 && <div className="text-xs text-amber-400">⚠️ Title may be too short — aim for 50-60 chars</div>}
                  {serpDesc.length > 160 && <div className="text-xs text-amber-400">⚠️ Description too long — Google will cut it off</div>}
                  {serpDesc.length > 0 && serpDesc.length < 120 && <div className="text-xs text-slate-500">ℹ️ Description could be longer (aim for 120-160 chars)</div>}
                  {serpTitle.length > 0 && serpTitle.length <= 60 && serpDesc.length >= 120 && serpDesc.length <= 160 && <div className="text-xs text-green-400">✓ Title and description look great!</div>}
                </div>
              </div>
            </div>
          </section>

          <div className="border-t border-white/10" />

          {/* Schema Markup Generator */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">🏷️</span>
              <h2 className="text-base font-semibold text-white">Schema Markup Generator</h2>
              <span className="text-xs text-slate-500 ml-1">Generate JSON-LD structured data for rich results</span>
            </div>
            <div className="grid lg:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <label className="label">Schema Type</label>
                  <select className="input" value={schemaForm.schemaType} onChange={e=>{
                    const type = e.target.value
                    const defaults: Record<string,string> = {
                      Article: '{\n  "title": "Article Title",\n  "description": "Article description",\n  "author": "Author Name",\n  "date": "2025-01-01",\n  "url": "https://example.com/article"\n}',
                      FAQPage: '{\n  "faqs": [\n    {"question": "What is X?", "answer": "X is..."},\n    {"question": "How does X work?", "answer": "X works by..."}\n  ]\n}',
                      Product: '{\n  "name": "Product Name",\n  "description": "Product description",\n  "price": "29.99",\n  "currency": "USD"\n}',
                      Organization: '{\n  "name": "Company Name",\n  "url": "https://example.com",\n  "logo": "https://example.com/logo.png",\n  "socials": ["https://twitter.com/company"]\n}',
                      LocalBusiness: '{\n  "name": "Business Name",\n  "address": "123 Main St",\n  "city": "San Francisco",\n  "country": "US",\n  "phone": "+1-555-0100"\n}',
                      BreadcrumbList: '{\n  "items": [\n    {"name": "Home", "url": "https://example.com"},\n    {"name": "Blog", "url": "https://example.com/blog"},\n    {"name": "Article Title", "url": "https://example.com/blog/article"}\n  ]\n}',
                    }
                    setSchemaForm({ schemaType: type, data: defaults[type] || '{}' })
                    setSchemaResult(null)
                  }}>
                    {['Article','FAQPage','Product','Organization','LocalBusiness','BreadcrumbList'].map(t=><option key={t} value={t} className="bg-gray-900">{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Data (JSON)</label>
                  <textarea className="input resize-none h-44 font-mono text-xs" value={schemaForm.data} onChange={e=>setSchemaForm(f=>({...f,data:e.target.value}))} />
                </div>
                <button onClick={generateSchema} disabled={schemaLoading} className="btn-primary w-full">
                  {schemaLoading ? <LoadingSpinner size="sm" /> : '🏷️ Generate Schema'}
                </button>
              </div>
              <div>
                {schemaResult ? (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="label">Generated JSON-LD</div>
                      <button onClick={()=>navigator.clipboard.writeText(`<script type="application/ld+json">\n${schemaResult.formatted}\n</script>`)} className="btn-secondary text-xs py-1">📋 Copy Script Tag</button>
                    </div>
                    <div className="bg-black/30 rounded-xl p-4 border border-white/10 overflow-auto max-h-72">
                      <pre className="text-xs text-green-300 font-mono whitespace-pre-wrap">{schemaResult.formatted}</pre>
                    </div>
                    <div className="mt-3 glass rounded-lg p-3 text-xs text-slate-400">
                      <strong className="text-slate-300">How to use:</strong> Paste this inside a <code className="text-brand-400">&lt;script type="application/ld+json"&gt;</code> tag in the <code className="text-brand-400">&lt;head&gt;</code> of your HTML page.
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-64 text-slate-600 text-sm">Output will appear here</div>
                )}
              </div>
            </div>
          </section>

          <div className="border-t border-white/10" />

          {/* Keyword Cannibalization */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">🔍</span>
              <h2 className="text-base font-semibold text-white">Keyword Cannibalization Checker</h2>
              <span className="text-xs text-slate-500 ml-1">Find pages competing against each other for the same keywords</span>
            </div>
            <div className="grid lg:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <label className="label">Pages & Keywords (one per line)</label>
                  <p className="text-xs text-slate-500 mb-2">Format: <code className="text-brand-400">URL, keyword1, keyword2</code></p>
                  <textarea className="input resize-none h-40 font-mono text-xs" placeholder={"/blog/best-crm, best crm, crm software\n/features/crm, crm features, top crm\n/landing/crm, crm for startups, startup crm"} value={canniPages} onChange={e=>setCanniPages(e.target.value)} />
                </div>
                <p className="text-xs text-slate-500">AI will also analyze your {keywords.length} tracked keywords for potential issues.</p>
                <button onClick={checkCannibalization} disabled={canniLoading} className="btn-primary w-full">
                  {canniLoading ? <LoadingSpinner size="sm" /> : '🔍 Check Cannibalization'}
                </button>
              </div>
              <div>
                {canniResult ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="card py-3 text-center"><div className="text-2xl font-bold text-red-400">{canniResult.affectedPages||0}</div><div className="text-xs text-slate-500 mt-1">Affected Pages</div></div>
                      <div className="card py-3 text-center"><div className="text-2xl font-bold text-green-400">{canniResult.cleanPages||0}</div><div className="text-xs text-slate-500 mt-1">Clean Pages</div></div>
                    </div>
                    <div className="glass rounded-lg p-3 text-sm text-slate-300">{canniResult.summary}</div>
                    <div className="space-y-2">
                      {(canniResult.issues||[]).map((issue: any, i: number) => (
                        <div key={i} className={`border-l-2 pl-3 py-2 rounded-r-lg ${issue.severity==='high'?'border-l-red-500 bg-red-500/5':issue.severity==='medium'?'border-l-amber-500 bg-amber-500/5':'border-l-blue-500 bg-blue-500/5'}`}>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-xs font-medium uppercase ${issue.severity==='high'?'text-red-400':issue.severity==='medium'?'text-amber-400':'text-blue-400'}`}>{issue.severity}</span>
                            <span className="text-sm text-white font-medium">"{issue.keyword}"</span>
                          </div>
                          <div className="text-xs text-slate-400 mb-1">Competing: {(issue.pages||[]).join(' vs ')}</div>
                          <div className="text-xs text-green-400">Fix: {issue.recommendation}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : <div className="flex items-center justify-center h-64 text-slate-600 text-sm">Results will appear here</div>}
              </div>
            </div>
          </section>

          <div className="border-t border-white/10" />

          {/* Link Building Finder */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">🔗</span>
              <h2 className="text-base font-semibold text-white">Backlink Opportunity Finder</h2>
              <span className="text-xs text-slate-500 ml-1">AI-powered link building strategy for your niche</span>
            </div>
            <div className="grid lg:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <label className="label">Your Website URL</label>
                  <input className="input" placeholder="https://yoursite.com" value={blFindForm.websiteUrl} onChange={e=>setBlFindForm(f=>({...f,websiteUrl:e.target.value}))} />
                </div>
                <div>
                  <label className="label">Your Niche / Industry</label>
                  <input className="input" placeholder="e.g. SaaS startup tools, email marketing software" value={blFindForm.niche} onChange={e=>setBlFindForm(f=>({...f,niche:e.target.value}))} />
                </div>
                <button onClick={findBacklinks} disabled={blFindLoading||!blFindForm.niche} className="btn-primary w-full">
                  {blFindLoading ? <LoadingSpinner size="sm" /> : '🔗 Find Opportunities'}
                </button>
              </div>
              <div>
                {blOpportunities.length > 0 ? (
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {blOpportunities.map((opp,i)=>(
                      <div key={i} className="glass rounded-lg p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-white">{opp.sourceDomain}</span>
                          <div className="flex gap-1.5">
                            <span className={`text-xs font-bold ${daColor(opp.domainAuthority)}`}>DA {opp.domainAuthority}</span>
                            <span className={`text-xs px-1.5 py-0.5 rounded ${opp.difficulty==='easy'?'bg-green-500/10 text-green-400':opp.difficulty==='medium'?'bg-amber-500/10 text-amber-400':'bg-red-500/10 text-red-400'}`}>{opp.difficulty}</span>
                          </div>
                        </div>
                        <p className="text-xs text-slate-400">{opp.strategy}</p>
                      </div>
                    ))}
                  </div>
                ) : <div className="flex items-center justify-center h-64 text-slate-600 text-sm">Opportunities appear here</div>}
              </div>
            </div>
          </section>

          <div className="border-t border-white/10" />

          {/* SEO Report Generator */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">📊</span>
              <h2 className="text-base font-semibold text-white">Monthly SEO Report Generator</h2>
              <span className="text-xs text-slate-500 ml-1">AI generates a performance summary from your tracked data</span>
            </div>
            {report ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl font-black text-brand-400">{report.overallHealthScore}<span className="text-slate-500 text-lg">/100</span></div>
                    <div>
                      <div className="text-base font-semibold text-white">SEO Health Score</div>
                      <div className="text-xs text-slate-500">{report.period}</div>
                    </div>
                  </div>
                  <button onClick={()=>setReport(null)} className="btn-secondary text-sm">Generate New</button>
                </div>

                <div className="glass rounded-xl p-4">
                  <div className="label mb-1">Executive Summary</div>
                  <p className="text-sm text-slate-300">{report.executiveSummary}</p>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="card p-4">
                    <div className="label mb-2">✅ Wins This Period</div>
                    {(report.wins||[]).map((w:string,i:number)=><div key={i} className="flex gap-2 text-sm text-slate-300 mb-1.5"><span className="text-green-400 flex-shrink-0">✓</span>{w}</div>)}
                  </div>
                  <div className="card p-4">
                    <div className="label mb-2">⚠️ Needs Attention</div>
                    {(report.concerns||[]).map((c:string,i:number)=><div key={i} className="flex gap-2 text-sm text-slate-300 mb-1.5"><span className="text-amber-400 flex-shrink-0">!</span>{c}</div>)}
                  </div>
                </div>

                <div className="card p-4">
                  <div className="label mb-3">🎯 Priority Actions for Next Month</div>
                  <div className="space-y-2">
                    {(report.priorityActions||[]).map((a:any,i:number)=>(
                      <div key={i} className={`border-l-2 pl-3 py-2 rounded-r-lg ${a.impact==='high'?'border-l-red-500 bg-red-500/5':a.impact==='medium'?'border-l-amber-500 bg-amber-500/5':'border-l-blue-500 bg-blue-500/5'}`}>
                        <div className="flex items-center gap-2 mb-0.5 text-xs">
                          <span className={`uppercase font-medium ${a.impact==='high'?'text-red-400':a.impact==='medium'?'text-amber-400':'text-blue-400'}`}>{a.impact} impact</span>
                          <span className="text-slate-600">·</span>
                          <span className="text-slate-500">{a.effort} effort</span>
                          {a.deadline && <><span className="text-slate-600">·</span><span className="text-slate-500">{a.deadline}</span></>}
                        </div>
                        <div className="text-sm text-white">{a.action}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="glass rounded-xl p-4">
                    <div className="label mb-1">📈 Trend Assessment</div>
                    <p className="text-sm text-slate-300">{report.trendAssessment}</p>
                  </div>
                  <div className="glass rounded-xl p-4">
                    <div className="label mb-1">🎯 Next Month Focus</div>
                    <p className="text-sm text-slate-300">{report.nextMonthFocus}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid lg:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <label className="label">Reporting Period</label>
                    <input className="input" placeholder="e.g. June 2025, Q2 2025" value={reportForm.period} onChange={e=>setReportForm(f=>({...f,period:e.target.value}))} />
                  </div>
                  <div>
                    <label className="label">Website URL</label>
                    <input className="input" placeholder="https://yoursite.com" value={reportForm.websiteUrl} onChange={e=>setReportForm(f=>({...f,websiteUrl:e.target.value}))} />
                  </div>
                  <div>
                    <label className="label">SEO Goals</label>
                    <input className="input" placeholder="e.g. reach 10K organic visits/month, rank top 3 for main keyword" value={reportForm.goals} onChange={e=>setReportForm(f=>({...f,goals:e.target.value}))} />
                  </div>
                  <button onClick={generateReport} disabled={reportLoading} className="btn-primary w-full">
                    {reportLoading ? <LoadingSpinner size="sm" /> : '📊 Generate Report'}
                  </button>
                  <p className="text-xs text-slate-500">Report is auto-generated using your {keywords.length} keywords, {audits.length} audits, and {backlinkList.length} backlinks.</p>
                </div>
                <div className="flex items-center justify-center h-48 text-slate-600 text-sm">
                  Report will appear here
                </div>
              </div>
            )}
          </section>
        </div>
      )}

      {/* ══════════ MODALS ══════════ */}

      <Modal isOpen={showAdd} onClose={()=>setShowAdd(false)} title="+ Add Keyword" size="lg">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="label">Keyword *</label>
            <input className="input" placeholder="e.g. best project management software" value={addForm.keyword} onChange={e=>setAddForm(f=>({...f,keyword:e.target.value}))} />
          </div>
          {[{key:'volume',label:'Monthly Volume',ph:'1200'},{key:'difficulty',label:'KD (0-100)',ph:'35'},{key:'currentRank',label:'Current Rank',ph:'24'},{key:'targetRank',label:'Target Rank',ph:'5'}].map(f=>(
            <div key={f.key}>
              <label className="label">{f.label}</label>
              <input type="number" className="input" placeholder={f.ph} value={(addForm as any)[f.key]} onChange={e=>setAddForm(p=>({...p,[f.key]:e.target.value}))} />
            </div>
          ))}
          <div>
            <label className="label">Search Intent</label>
            <select className="input" value={addForm.intent} onChange={e=>setAddForm(f=>({...f,intent:e.target.value}))}>
              <option value="" className="bg-gray-900">Select...</option>
              {['informational','commercial','transactional','navigational'].map(i=><option key={i} value={i} className="bg-gray-900">{i}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Priority</label>
            <select className="input" value={addForm.priority} onChange={e=>setAddForm(f=>({...f,priority:e.target.value}))}>
              {['high','medium','low'].map(p=><option key={p} value={p} className="bg-gray-900">{p[0].toUpperCase()+p.slice(1)}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Cluster / Topic</label>
            <input className="input" placeholder="e.g. Comparisons, Guides" value={addForm.cluster} onChange={e=>setAddForm(f=>({...f,cluster:e.target.value}))} />
          </div>
          <div>
            <label className="label">Status</label>
            <select className="input" value={addForm.status} onChange={e=>setAddForm(f=>({...f,status:e.target.value}))}>
              {['tracking','paused','achieved'].map(s=><option key={s} value={s} className="bg-gray-900">{s[0].toUpperCase()+s.slice(1)}</option>)}
            </select>
          </div>
          <div className="col-span-2">
            <label className="label">Target URL</label>
            <input className="input" placeholder="https://yoursite.com/page" value={addForm.targetUrl} onChange={e=>setAddForm(f=>({...f,targetUrl:e.target.value}))} />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-4">
          <button className="btn-secondary" onClick={()=>setShowAdd(false)}>Cancel</button>
          <button className="btn-primary" onClick={addKeyword} disabled={!addForm.keyword}>Add Keyword</button>
        </div>
      </Modal>

      <Modal isOpen={showSuggest} onClose={()=>setShowSuggest(false)} title="🤖 AI Keyword Research" size="md">
        <div className="space-y-4">
          <div><label className="label">Your Niche / Industry</label><input className="input" placeholder="e.g. email marketing, project management SaaS" value={suggestForm.niche} onChange={e=>setSuggestForm(f=>({...f,niche:e.target.value}))} /></div>
          <div><label className="label">Seed Keyword</label><input className="input" placeholder="e.g. task management" value={suggestForm.seedKeyword} onChange={e=>setSuggestForm(f=>({...f,seedKeyword:e.target.value}))} /></div>
          <div>
            <label className="label">Keywords to generate</label>
            <div className="flex gap-2">{['5','10','20'].map(n=><button key={n} onClick={()=>setSuggestForm(f=>({...f,count:n}))} className={`flex-1 py-1.5 rounded-lg text-sm ${suggestForm.count===n?'bg-brand-600 text-white':'glass text-slate-400 hover:text-white'}`}>{n}</button>)}</div>
          </div>
          <div className="flex justify-end gap-3"><button className="btn-secondary" onClick={()=>setShowSuggest(false)}>Cancel</button><button className="btn-primary" onClick={suggestKeywords} disabled={!suggestForm.niche||!suggestForm.seedKeyword}>🔍 Find Keywords</button></div>
        </div>
      </Modal>

      <Modal isOpen={showBriefModal} onClose={()=>setShowBriefModal(false)} title="📝 Generate Content Brief" size="md">
        <div className="space-y-4">
          <div><label className="label">Target Keyword *</label><input className="input" placeholder="e.g. best crm for startups" value={briefForm.keyword} onChange={e=>setBriefForm(f=>({...f,keyword:e.target.value}))} /></div>
          <div><label className="label">Target Audience</label><input className="input" placeholder="e.g. early-stage SaaS founders" value={briefForm.targetAudience} onChange={e=>setBriefForm(f=>({...f,targetAudience:e.target.value}))} /></div>
          <div><label className="label">Business Context</label><input className="input" placeholder="e.g. B2B SaaS startup with CRM product" value={briefForm.businessContext} onChange={e=>setBriefForm(f=>({...f,businessContext:e.target.value}))} /></div>
          <div className="flex justify-end gap-3"><button className="btn-secondary" onClick={()=>setShowBriefModal(false)}>Cancel</button><button className="btn-primary" onClick={generateBrief} disabled={!briefForm.keyword}>📝 Generate Brief</button></div>
        </div>
      </Modal>

      <Modal isOpen={showAuditModal} onClose={()=>setShowAuditModal(false)} title="🔬 SEO Page Audit" size="lg">
        <div className="space-y-4">
          <div><label className="label">Page URL *</label><input className="input" placeholder="https://yoursite.com/blog/post" value={auditForm.url} onChange={e=>setAuditForm(f=>({...f,url:e.target.value}))} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="label">Page Title</label><input className="input" placeholder="The Complete Guide to..." value={auditForm.pageTitle} onChange={e=>setAuditForm(f=>({...f,pageTitle:e.target.value}))} /></div>
            <div><label className="label">H1 Heading</label><input className="input" placeholder="H1 tag content" value={auditForm.h1} onChange={e=>setAuditForm(f=>({...f,h1:e.target.value}))} /></div>
            <div><label className="label">Word Count</label><input type="number" className="input" placeholder="1500" value={auditForm.wordCount} onChange={e=>setAuditForm(f=>({...f,wordCount:e.target.value}))} /></div>
            <div><label className="label">Internal Links</label><input type="number" className="input" placeholder="12" value={auditForm.internalLinks} onChange={e=>setAuditForm(f=>({...f,internalLinks:e.target.value}))} /></div>
          </div>
          <div>
            <label className="label">Meta Description</label>
            <textarea className="input resize-none h-16" placeholder="Your meta description..." value={auditForm.metaDescription} onChange={e=>setAuditForm(f=>({...f,metaDescription:e.target.value}))} />
            <div className={`text-xs text-right mt-1 ${auditForm.metaDescription.length>160?'text-amber-400':'text-slate-600'}`}>{auditForm.metaDescription.length}/160</div>
          </div>
          <div><label className="label">Page Content Sample (optional)</label><textarea className="input resize-none h-20" placeholder="Paste the first 500 words..." value={auditForm.pageContent} onChange={e=>setAuditForm(f=>({...f,pageContent:e.target.value}))} /></div>
          <div className="flex justify-end gap-3"><button className="btn-secondary" onClick={()=>setShowAuditModal(false)}>Cancel</button><button className="btn-primary" onClick={runAudit} disabled={!auditForm.url}>🔬 Run Audit</button></div>
        </div>
      </Modal>

      <Modal isOpen={showCompetitor} onClose={()=>setShowCompetitor(false)} title="🕵️ Competitor SEO Analysis" size="md">
        <div className="space-y-4">
          <p className="text-slate-400 text-sm">AI analyzes a competitor's SEO strategy and identifies keyword gaps you can exploit.</p>
          <div><label className="label">Competitor URL *</label><input className="input" placeholder="https://competitor.com" value={competitorForm.competitorUrl} onChange={e=>setCompetitorForm(f=>({...f,competitorUrl:e.target.value}))} /></div>
          <div><label className="label">Your Industry / Niche</label><input className="input" placeholder="e.g. project management SaaS" value={competitorForm.niche} onChange={e=>setCompetitorForm(f=>({...f,niche:e.target.value}))} /></div>
          <p className="text-xs text-slate-600">Analysis uses AI estimation — not live crawler data.</p>
          <div className="flex justify-end gap-3"><button className="btn-secondary" onClick={()=>setShowCompetitor(false)}>Cancel</button><button className="btn-primary" onClick={analyzeCompetitor} disabled={!competitorForm.competitorUrl}>🕵️ Analyze</button></div>
        </div>
      </Modal>

      <Modal isOpen={showAddBacklink} onClose={()=>setShowAddBacklink(false)} title="+ Add Backlink" size="lg">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2"><label className="label">Source URL (linking page) *</label><input className="input" placeholder="https://other-site.com/blog/article" value={blForm.sourceUrl} onChange={e=>setBlForm(f=>({...f,sourceUrl:e.target.value}))} /></div>
          <div className="col-span-2"><label className="label">Target URL (your page) *</label><input className="input" placeholder="https://yoursite.com/page" value={blForm.targetUrl} onChange={e=>setBlForm(f=>({...f,targetUrl:e.target.value}))} /></div>
          <div><label className="label">Anchor Text</label><input className="input" placeholder="best project management" value={blForm.anchorText} onChange={e=>setBlForm(f=>({...f,anchorText:e.target.value}))} /></div>
          <div><label className="label">Domain Authority (DA)</label><input type="number" className="input" placeholder="45" value={blForm.domainAuthority} onChange={e=>setBlForm(f=>({...f,domainAuthority:e.target.value}))} /></div>
          <div>
            <label className="label">Link Type</label>
            <select className="input" value={blForm.type} onChange={e=>setBlForm(f=>({...f,type:e.target.value}))}>
              {['dofollow','nofollow','sponsored','ugc'].map(t=><option key={t} value={t} className="bg-gray-900">{t}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Category</label>
            <select className="input" value={blForm.category} onChange={e=>setBlForm(f=>({...f,category:e.target.value}))}>
              {['editorial','directory','guest-post','forum','social','tool','resource'].map(c=><option key={c} value={c} className="bg-gray-900">{c}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Status</label>
            <select className="input" value={blForm.status} onChange={e=>setBlForm(f=>({...f,status:e.target.value}))}>
              {['active','pending','lost','broken'].map(s=><option key={s} value={s} className="bg-gray-900">{s[0].toUpperCase()+s.slice(1)}</option>)}
            </select>
          </div>
          <div><label className="label">Notes</label><input className="input" placeholder="How this link was acquired..." value={blForm.notes} onChange={e=>setBlForm(f=>({...f,notes:e.target.value}))} /></div>
        </div>
        <div className="flex justify-end gap-3 mt-4"><button className="btn-secondary" onClick={()=>setShowAddBacklink(false)}>Cancel</button><button className="btn-primary" onClick={addBacklink} disabled={!blForm.sourceUrl||!blForm.targetUrl}>Add Backlink</button></div>
      </Modal>
    </div>
  )
}

// ─── Brief Detail ─────────────────────────────────────────────────────────────

function BriefDetail({ brief, onDelete }: { brief: Brief; onDelete: () => void }) {
  const [copied, setCopied] = useState(false)
  const copyBrief = () => {
    const text = [`# SEO Content Brief: ${brief.keyword}`,`\n## Titles`,...(brief.titles||[]).map((t,i)=>`${i+1}. ${t}`),`\n## Meta Description`,brief.metaDescription,`\n## Content Outline`,...(brief.outline||[]).map((h:any)=>`${h.type==='h2'?'##':'###'} ${h.heading||h}`),`\n## Key Points`,...(brief.keyPoints||[]).map((p:string)=>`- ${p}`),`\n## Related Keywords`,(brief.relatedKeywords||[]).join(', '),`\n## Recommended Word Count`,`~${brief.wordCount} words`].join('\n')
    navigator.clipboard.writeText(text); setCopied(true); setTimeout(()=>setCopied(false),2000)
  }
  return (
    <div className="card border border-white/10">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-base font-semibold text-white">📝 {brief.keyword}</h3>
          <div className="flex gap-3 text-xs text-slate-500 mt-0.5">{brief.wordCount&&<span>~{brief.wordCount} words</span>}{brief.targetAudience&&<span>{brief.targetAudience}</span>}<span>{new Date(brief.createdAt).toLocaleDateString()}</span></div>
        </div>
        <div className="flex gap-2"><button onClick={copyBrief} className="btn-secondary text-xs py-1.5">{copied?'✓ Copied!':'📋 Copy Brief'}</button><button onClick={onDelete} className="btn-ghost text-red-400 text-xs">🗑️</button></div>
      </div>
      <div className="space-y-5">
        <div>
          <div className="label mb-2">Title Options</div>
          <div className="space-y-1.5">{(brief.titles||[]).map((t,i)=><div key={i} className="glass rounded-lg px-3 py-2 text-sm text-slate-200 flex gap-2"><span className="text-brand-400 font-mono text-xs mt-0.5">{i+1}.</span>{t}</div>)}</div>
        </div>
        <div>
          <div className="label mb-2">Meta Description</div>
          <div className="glass rounded-lg px-3 py-2 text-sm text-slate-300">{brief.metaDescription}<div className={`text-xs mt-1 ${(brief.metaDescription?.length||0)>160?'text-amber-400':'text-slate-600'}`}>{brief.metaDescription?.length||0}/160 chars</div></div>
        </div>
        <div className="grid lg:grid-cols-2 gap-4">
          <div>
            <div className="label mb-2">Content Outline</div>
            <div className="space-y-1">{(brief.outline||[]).map((h:any,i:number)=>(
              <div key={i} className={`flex items-start gap-2 text-sm py-1 ${(h.type||'')==='h3'?'pl-4':''}`}>
                <span className="text-brand-400 flex-shrink-0 text-xs mt-0.5 font-mono">{(h.type||'h2').toUpperCase()}</span>
                <div><div className={`text-slate-200 ${(h.type||'')==='h3'?'text-xs':''}`}>{h.heading||h}</div>{h.notes&&<div className="text-xs text-slate-600">{h.notes}</div>}</div>
              </div>
            ))}</div>
          </div>
          <div className="space-y-4">
            <div>
              <div className="label mb-2">Key Points</div>
              {(brief.keyPoints||[]).map((p:string,i:number)=><div key={i} className="flex gap-2 text-sm text-slate-300 mb-1.5"><span className="text-green-400">✓</span>{p}</div>)}
            </div>
            <div>
              <div className="label mb-2">Related Keywords</div>
              <div className="flex flex-wrap gap-1.5">{(brief.relatedKeywords||[]).map((kw:string)=><span key={kw} className="text-xs text-brand-400 bg-brand-500/10 px-2 py-1 rounded-full">{kw}</span>)}</div>
            </div>
          </div>
        </div>
        {brief.faqSection&&brief.faqSection.length>0&&(
          <div>
            <div className="label mb-2">FAQ Section</div>
            <div className="space-y-2">{(brief.faqSection as any[]).map((q:any,i:number)=>(
              <div key={i} className="glass rounded-lg p-3"><div className="text-sm font-medium text-white mb-1">{q.question}</div><div className="text-xs text-slate-400">{q.answer}</div></div>
            ))}</div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Audit Detail ─────────────────────────────────────────────────────────────

function AuditDetail({ audit }: { audit: Audit }) {
  const meta = audit.metadata||{}
  const scores = meta.scores||{}
  const scoreCategories = [{key:'title',label:'Title'},{key:'meta',label:'Meta'},{key:'content',label:'Content'},{key:'technical',label:'Technical'},{key:'links',label:'Links'},{key:'schema',label:'Schema'}]
  const severityIcon: Record<string,string> = {error:'🔴',warning:'🟡',info:'🔵'}
  const priorityCls: Record<string,string> = {high:'border-l-red-500 bg-red-500/5',medium:'border-l-amber-500 bg-amber-500/5',low:'border-l-blue-500 bg-blue-500/5'}
  return (
    <div className="card border border-white/10">
      <div className="flex items-center gap-4 mb-5">
        <ScoreRing score={audit.score} size={56} />
        <div className="flex items-center gap-2">
          <GradeBadge grade={meta.grade||'—'} score={audit.score} />
          <div><div className="text-base font-semibold text-white">{audit.url.replace(/^https?:\/\//,'')}</div><div className="text-xs text-slate-500">{new Date(audit.createdAt).toLocaleDateString()}</div></div>
        </div>
      </div>
      <div className="grid grid-cols-6 gap-2 mb-5">
        {scoreCategories.map(({key,label})=>{const s=scores[key]||0;return(
          <div key={key} className="glass rounded-lg p-2 text-center">
            <div className="text-xs text-slate-500 mb-1">{label}</div>
            <div className={`text-sm font-bold ${s>=80?'text-green-400':s>=60?'text-amber-400':'text-red-400'}`}>{s}</div>
          </div>
        )})}
      </div>
      {meta.strengths&&meta.strengths.length>0&&(
        <div className="mb-4">
          <div className="label mb-2">Strengths</div>
          <div className="flex flex-wrap gap-2">{(meta.strengths as string[]).map((s,i)=><span key={i} className="text-xs bg-green-500/10 text-green-400 px-2 py-1 rounded-lg">✓ {s}</span>)}</div>
        </div>
      )}
      {audit.issues&&audit.issues.length>0&&(
        <div className="mb-4">
          <div className="label mb-2">Issues ({audit.issues.length})</div>
          <div className="space-y-2">{(audit.issues as any[]).filter(Boolean).map((issue:any,i:number)=>(
            <div key={i} className="glass rounded-lg p-3">
              <div className="flex items-start gap-2">
                <span>{severityIcon[issue.type]||'🔵'}</span>
                <div><div className="text-xs font-medium text-slate-400 mb-0.5">{issue.category}</div><div className="text-sm text-white">{issue.message}</div>{issue.fix&&<div className="text-xs text-green-400 mt-1">Fix: {issue.fix}</div>}</div>
              </div>
            </div>
          ))}</div>
        </div>
      )}
      {audit.recommendations&&audit.recommendations.length>0&&(
        <div>
          <div className="label mb-2">Recommendations</div>
          <div className="space-y-2">{(audit.recommendations as any[]).map((rec:any,i:number)=>(
            <div key={i} className={`border-l-2 pl-3 py-2 rounded-r-lg ${priorityCls[rec.priority]||'border-l-slate-500 bg-white/3'}`}>
              <div className="flex items-center gap-2 mb-0.5"><span className={`text-xs uppercase font-medium ${rec.priority==='high'?'text-red-400':rec.priority==='medium'?'text-amber-400':'text-blue-400'}`}>{rec.priority}</span></div>
              <div className="text-sm text-white">{rec.action}</div>
              {rec.impact&&<div className="text-xs text-slate-500 mt-0.5">Impact: {rec.impact}</div>}
            </div>
          ))}</div>
        </div>
      )}
    </div>
  )
}
