import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import { PageHeader } from '../components/ui/PageHeader'
import { EmptyStateAnimated } from '../components/ui/EmptyStateAnimated'
import { Modal } from '../components/ui/Modal'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { SkeletonListPage } from '../components/ui/PageSkeletons'
import { MeshGradient } from '../components/ui/MeshGradient'

/* ─── Types ─────────────────────────────────────────────────────── */
interface CatalogItem {
  type: string
  name: string
  icon: string
  category: string
  description: string
  credentialFields: string[]
  setupUrl: string
}

interface Connection {
  id: string
  type: string
  name: string
  credentials: Record<string, any> | null
  status: 'connected' | 'disconnected' | 'error' | 'pending'
  metadata: any
  lastSyncAt: string | null
  createdAt: string
  updatedAt: string
}

type Category = 'all' | 'social' | 'website' | 'analytics' | 'tools'

const CATEGORIES: { id: Category; label: string; icon: string }[] = [
  { id: 'all', label: 'All', icon: '🔗' },
  { id: 'social', label: 'Social Media', icon: '📱' },
  { id: 'website', label: 'Websites', icon: '🌐' },
  { id: 'analytics', label: 'Analytics', icon: '📊' },
  { id: 'tools', label: 'Tools', icon: '🔧' },
]

/* ─── Credential field labels ───────────────────────────────────── */
const FIELD_LABELS: Record<string, { label: string; placeholder: string; type?: string }> = {
  bearerToken: { label: 'Bearer Token', placeholder: 'AAAAAAAAAAAAAAAAAAAAA...' },
  accessToken: { label: 'Access Token', placeholder: 'EAA...' },
  pageId: { label: 'Page / Account ID', placeholder: '123456789' },
  apiKey: { label: 'API Key', placeholder: 'AIza...' },
  clientId: { label: 'Client ID', placeholder: 'tYH...' },
  clientSecret: { label: 'Client Secret', placeholder: '...' },
  refreshToken: { label: 'Refresh Token', placeholder: '...' },
  handle: { label: 'Handle', placeholder: 'yourname.bsky.social' },
  appPassword: { label: 'App Password', placeholder: 'xxxx-xxxx-xxxx-xxxx', type: 'password' },
  url: { label: 'Site URL', placeholder: 'https://yoursite.com' },
  username: { label: 'Username', placeholder: 'admin' },
  applicationPassword: { label: 'Application Password', placeholder: 'xxxx xxxx xxxx xxxx', type: 'password' },
  shopDomain: { label: 'Shop Domain', placeholder: 'yourstore.myshopify.com' },
  siteId: { label: 'Site ID', placeholder: 'abc123...' },
  apiToken: { label: 'API Token', placeholder: '...' },
  personalAccessToken: { label: 'Personal Access Token', placeholder: 'ghp_...', type: 'password' },
  secretKey: { label: 'Secret Key', placeholder: 'sk_live_...', type: 'password' },
  publishableKey: { label: 'Publishable Key', placeholder: 'pk_live_...' },
  webhookUrl: { label: 'Webhook URL', placeholder: 'https://hooks.zapier.com/hooks/catch/...' },
  propertyId: { label: 'Property ID', placeholder: 'properties/123456' },
  credentialsJson: { label: 'Service Account JSON', placeholder: '{ "type": "service_account", ... }', type: 'textarea' },
  serverPrefix: { label: 'Server Prefix', placeholder: 'us21' },
  userId: { label: 'User ID', placeholder: '17841400...' },
}

/* ─── Component ─────────────────────────────────────────────────── */
export function ConnectionsPage() {
  const [catalog, setCatalog] = useState<CatalogItem[]>([])
  const [connectionsList, setConnectionsList] = useState<Connection[]>([])
  const [loading, setLoading] = useState(true)
  const [category, setCategory] = useState<Category>('all')

  // Modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedIntegration, setSelectedIntegration] = useState<CatalogItem | null>(null)
  const [formName, setFormName] = useState('')
  const [formCreds, setFormCreds] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Test state
  const [testingId, setTestingId] = useState<string | null>(null)
  const [testResults, setTestResults] = useState<Record<string, { ok: boolean; message: string }>>({})

  /* ── Fetch data on mount ──────────────────────────────────────── */
  useEffect(() => {
    Promise.all([
      api.get<CatalogItem[]>('/connections/catalog'),
      api.get<Connection[]>('/connections'),
    ]).then(([cat, conns]) => {
      setCatalog(cat)
      setConnectionsList(conns)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  /* ── Derived data ─────────────────────────────────────────────── */
  const filtered = category === 'all'
    ? catalog
    : catalog.filter(c => c.category === category)

  const connectionMap = new Map(connectionsList.map(c => [c.type, c]))

  const stats = {
    connected: connectionsList.filter(c => c.status === 'connected').length,
    errors: connectionsList.filter(c => c.status === 'error').length,
    available: catalog.length,
  }

  /* ── Open connect modal ───────────────────────────────────────── */
  const openConnect = (item: CatalogItem) => {
    setSelectedIntegration(item)
    const existing = connectionMap.get(item.type)
    setFormName(existing?.name || item.name)
    setFormCreds(existing?.credentials || {})
    setError('')
    setModalOpen(true)
  }

  /* ── Save connection ──────────────────────────────────────────── */
  const saveConnection = async () => {
    if (!selectedIntegration) return
    setSaving(true)
    setError('')
    try {
      const existing = connectionMap.get(selectedIntegration.type)
      if (existing) {
        const updated = await api.patch<Connection>(`/connections/${existing.id}`, {
          name: formName,
          credentials: formCreds,
        })
        setConnectionsList(prev => prev.map(c => c.id === updated.id ? updated : c))
      } else {
        const created = await api.post<Connection>('/connections', {
          type: selectedIntegration.type,
          name: formName,
          credentials: formCreds,
        })
        setConnectionsList(prev => [created, ...prev])
      }
      setModalOpen(false)
    } catch (e: any) {
      setError(e.message || 'Failed to save connection')
    } finally {
      setSaving(false)
    }
  }

  /* ── Test connection ──────────────────────────────────────────── */
  const testConn = async (conn: Connection) => {
    setTestingId(conn.id)
    try {
      const result = await api.post<{ ok: boolean; message: string; status: string }>(`/connections/${conn.id}/test`, {})
      setTestResults(prev => ({ ...prev, [conn.id]: result }))
      setConnectionsList(prev => prev.map(c => c.id === conn.id ? { ...c, status: result.status as Connection['status'] } : c))
    } catch (e: any) {
      setTestResults(prev => ({ ...prev, [conn.id]: { ok: false, message: e.message || 'Test failed' } }))
    } finally {
      setTestingId(null)
    }
  }

  /* ── Delete connection ────────────────────────────────────────── */
  const deleteConn = async (conn: Connection) => {
    if (!confirm(`Remove ${conn.name}?`)) return
    await api.delete(`/connections/${conn.id}`)
    setConnectionsList(prev => prev.filter(c => c.id !== conn.id))
  }

  /* ── Loading skeleton ─────────────────────────────────────────── */
  if (loading) return <SkeletonListPage />

  /* ── Render ────────────────────────────────────────────────────── */
  return (
    <div className="p-6 max-w-7xl mx-auto relative">
      <MeshGradient />
      <PageHeader
        icon="🔗"
        title="Connections"
        description="Connect your websites, social accounts, and tools"
        action={
          <button onClick={() => { setSelectedIntegration(null); setFormName(''); setFormCreds({}); setError(''); setModalOpen(true) }} className="btn-primary">
            + Add Connection
          </button>
        }
      />

      {/* ── Stats ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center text-lg">✅</div>
          <div>
            <div className="text-2xl font-bold text-white">{stats.connected}</div>
            <div className="text-xs text-slate-400">Connected</div>
          </div>
        </div>
        <div className="card flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center text-lg">⚠️</div>
          <div>
            <div className="text-2xl font-bold text-white">{stats.errors}</div>
            <div className="text-xs text-slate-400">Errors</div>
          </div>
        </div>
        <div className="card flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-brand-600/20 flex items-center justify-center text-lg">📦</div>
          <div>
            <div className="text-2xl font-bold text-white">{stats.available}</div>
            <div className="text-xs text-slate-400">Available</div>
          </div>
        </div>
      </div>

      {/* ── Category filters ───────────────────────────────────── */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setCategory(cat.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              category === cat.id
                ? 'bg-brand-600/20 border border-brand-500/20 text-white'
                : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
            }`}
          >
            <span>{cat.icon}</span>{cat.label}
          </button>
        ))}
      </div>

      {/* ── Integration grid ───────────────────────────────────── */}
      {filtered.length === 0 ? (
        <EmptyStateAnimated
          icon="🔗"
          title="No integrations found"
          description="Try a different category"
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(item => {
            const conn = connectionMap.get(item.type)
            const status = conn?.status
            const testResult = conn ? testResults[conn.id] : null

            return (
              <div
                key={item.type}
                className={`card-hover cursor-pointer group relative overflow-hidden ${
                  status === 'connected' ? 'ring-1 ring-green-500/20' :
                  status === 'error' ? 'ring-1 ring-red-500/20' : ''
                }`}
                onClick={() => openConnect(item)}
              >
                {/* Status indicator dot */}
                {status && (
                  <div className={`absolute top-3 right-3 w-2.5 h-2.5 rounded-full ${
                    status === 'connected' ? 'bg-green-400 animate-pulse' :
                    status === 'error' ? 'bg-red-400' :
                    status === 'pending' ? 'bg-amber-400' : 'bg-slate-500'
                  }`} />
                )}

                <div className="flex items-start gap-3 mb-3">
                  <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl flex-shrink-0 group-hover:scale-110 transition-transform">
                    {item.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-white truncate">{item.name}</div>
                    <div className="text-xs text-slate-500 capitalize">{item.category}</div>
                  </div>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed mb-3 line-clamp-2">{item.description}</p>

                {conn ? (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      status === 'connected' ? 'bg-green-500/20 text-green-400' :
                      status === 'error' ? 'bg-red-500/20 text-red-400' :
                      status === 'pending' ? 'bg-amber-500/20 text-amber-400' :
                      'bg-slate-500/20 text-slate-400'
                    }`}>
                      {status === 'connected' ? '● Connected' :
                       status === 'error' ? '● Error' :
                       status === 'pending' ? '● Pending' : '● Disconnected'}
                    </span>

                    <button
                      onClick={e => { e.stopPropagation(); testConn(conn) }}
                      disabled={testingId === conn.id}
                      className="text-xs text-brand-400 hover:text-brand-300 px-2 py-0.5 rounded hover:bg-brand-500/10 transition-colors"
                    >
                      {testingId === conn.id ? '...' : 'Test'}
                    </button>

                    <button
                      onClick={e => { e.stopPropagation(); deleteConn(conn) }}
                      className="text-xs text-red-400 hover:text-red-300 px-2 py-0.5 rounded hover:bg-red-500/10 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="text-xs text-brand-400 group-hover:text-brand-300 font-medium transition-colors">
                    + Connect →
                  </div>
                )}

                {/* Test result toast */}
                {testResult && (
                  <div className={`mt-2 text-xs px-2 py-1 rounded ${
                    testResult.ok ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                  }`}>
                    {testResult.message}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ── Connect Modal ──────────────────────────────────────── */}
      {modalOpen && (
        <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={selectedIntegration ? `${connectionMap.get(selectedIntegration.type) ? 'Update' : 'Connect'} ${selectedIntegration.name}` : 'Choose an Integration'}>
          <div>
            {selectedIntegration ? (
              <>
                <p className="text-xs text-slate-400 mb-4">{selectedIntegration.description}</p>

                <div className="space-y-3">
                  <div>
                    <label className="label">Connection Name</label>
                    <input
                      className="input w-full"
                      value={formName}
                      onChange={e => setFormName(e.target.value)}
                      placeholder={selectedIntegration.name}
                    />
                  </div>

                  {selectedIntegration.credentialFields.map(field => {
                    const config = FIELD_LABELS[field] || { label: field, placeholder: '...' }
                    return (
                      <div key={field}>
                        <label className="label">{config.label}</label>
                        {config.type === 'textarea' ? (
                          <textarea
                            className="input w-full h-24 resize-none font-mono text-xs"
                            value={formCreds[field] || ''}
                            onChange={e => setFormCreds(prev => ({ ...prev, [field]: e.target.value }))}
                            placeholder={config.placeholder}
                          />
                        ) : (
                          <input
                            className="input w-full"
                            type={config.type || 'text'}
                            value={formCreds[field] || ''}
                            onChange={e => setFormCreds(prev => ({ ...prev, [field]: e.target.value }))}
                            placeholder={config.placeholder}
                          />
                        )}
                      </div>
                    )
                  })}

                  {selectedIntegration.setupUrl && (
                    <a
                      href={selectedIntegration.setupUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-brand-400 hover:text-brand-300 block"
                    >
                      Get credentials from {selectedIntegration.name} →
                    </a>
                  )}

                  {error && <p className="text-sm text-red-400">{error}</p>}

                  <div className="flex gap-3 pt-2">
                    <button onClick={saveConnection} disabled={saving} className="btn-primary flex-1">
                      {saving ? <LoadingSpinner size="sm" /> : connectionMap.get(selectedIntegration.type) ? 'Update' : 'Connect'}
                    </button>
                    <button onClick={() => setModalOpen(false)} className="btn-ghost">Cancel</button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-1 max-h-[60vh] overflow-y-auto">
                  {catalog.map(item => (
                    <button
                      key={item.type}
                      onClick={() => {
                        setSelectedIntegration(item)
                        setFormName(item.name)
                        const existing = connectionMap.get(item.type)
                        setFormCreds(existing?.credentials || {})
                      }}
                      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors text-left"
                    >
                      <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-xl flex-shrink-0">
                        {item.icon}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-white">{item.name}</div>
                        <div className="text-xs text-slate-500 truncate">{item.description}</div>
                      </div>
                      {connectionMap.has(item.type) && (
                        <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">Active</span>
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </Modal>
      )}
    </div>
  )
}
