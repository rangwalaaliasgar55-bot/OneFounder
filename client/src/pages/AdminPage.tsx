import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useNavigate } from 'react-router-dom'

interface UserRow {
  id: string
  email: string
  name: string | null
  isAdmin: boolean
  tokenBalance: number
  tokenUsed: number
  createdAt: string
}

interface Stats {
  totals: { totalUsers: number; totalTokensUsed: number; totalTokensRemaining: number }
  recentActivity: { id: string; userId: string; amount: number; type: string; note: string | null; createdAt: string }[]
}

async function apiFetch(url: string, opts?: RequestInit) {
  const r = await fetch(url, { credentials: 'include', ...opts })
  if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.error || r.statusText) }
  return r.json()
}

export function AdminPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [users, setUsers] = useState<UserRow[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [grantInputs, setGrantInputs] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState<Record<string, boolean>>({})
  const [tab, setTab] = useState<'users' | 'activity'>('users')

  useEffect(() => {
    if (!user) return
    if (!(user as any).isAdmin) { navigate('/settings'); return }
    loadAll()
  }, [user])

  async function loadAll() {
    setLoading(true); setError('')
    try {
      const [u, s] = await Promise.all([
        apiFetch('/api/admin/users'),
        apiFetch('/api/admin/stats'),
      ])
      setUsers(u); setStats(s)
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }

  async function grantTokens(userId: string) {
    const amount = parseInt(grantInputs[userId] || '0')
    if (!amount || amount <= 0) return
    setBusy(b => ({ ...b, [userId]: true }))
    try {
      await apiFetch(`/api/admin/users/${userId}/grant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      })
      setGrantInputs(g => ({ ...g, [userId]: '' }))
      await loadAll()
    } catch (e: any) { alert(e.message) }
    finally { setBusy(b => ({ ...b, [userId]: false })) }
  }

  async function setBalance(userId: string, balance: number) {
    setBusy(b => ({ ...b, [`set_${userId}`]: true }))
    try {
      await apiFetch(`/api/admin/users/${userId}/set-tokens`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ balance }),
      })
      await loadAll()
    } catch (e: any) { alert(e.message) }
    finally { setBusy(b => ({ ...b, [`set_${userId}`]: false })) }
  }

  async function toggleAdmin(userId: string) {
    if (!confirm('Toggle admin status for this user?')) return
    setBusy(b => ({ ...b, [`admin_${userId}`]: true }))
    try {
      await apiFetch(`/api/admin/users/${userId}/toggle-admin`, { method: 'POST' })
      await loadAll()
    } catch (e: any) { alert(e.message) }
    finally { setBusy(b => ({ ...b, [`admin_${userId}`]: false })) }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-brand-600/20 flex items-center justify-center text-xl">🛡️</div>
        <div>
          <h1 className="text-xl font-bold text-white">Admin Panel</h1>
          <p className="text-xs text-slate-500">Manage users and AI token allocations</p>
        </div>
        <button onClick={loadAll} className="ml-auto btn-ghost text-xs">↻ Refresh</button>
      </div>

      {error && <div className="rounded-xl p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>}

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Total Users', value: stats.totals.totalUsers, icon: '👥' },
            { label: 'Tokens Used', value: stats.totals.totalTokensUsed ?? 0, icon: '⚡' },
            { label: 'Tokens Remaining', value: stats.totals.totalTokensRemaining ?? 0, icon: '🪙' },
          ].map(s => (
            <div key={s.label} className="card text-center">
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className="text-2xl font-bold text-white">{Number(s.value).toLocaleString()}</div>
              <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2">
        {(['users', 'activity'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize ${
              tab === t ? 'bg-brand-600/20 text-brand-400 border border-brand-500/20' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {t === 'users' ? '👥 Users' : '📋 Activity Log'}
          </button>
        ))}
      </div>

      {tab === 'users' && (
        <div className="card overflow-hidden p-0">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/[0.06]">
                {['User', 'Balance', 'Used', 'Grant Tokens', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-slate-500 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">
                        {(u.name || u.email).slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-slate-200 font-medium">{u.name || '—'}</div>
                        <div className="text-slate-600">{u.email}</div>
                      </div>
                      {u.isAdmin && <span className="ml-1 text-[10px] bg-amber-500/15 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded-full">admin</span>}
                      {u.id === (user as any)?.id && <span className="text-[10px] text-slate-600">(you)</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`font-mono font-bold ${u.tokenBalance <= 0 ? 'text-red-400' : u.tokenBalance <= 20 ? 'text-yellow-400' : 'text-green-400'}`}>
                      {u.tokenBalance}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 font-mono">{u.tokenUsed}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min="1"
                        placeholder="e.g. 50"
                        value={grantInputs[u.id] || ''}
                        onChange={e => setGrantInputs(g => ({ ...g, [u.id]: e.target.value }))}
                        className="w-20 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-white text-xs focus:outline-none focus:border-brand-500/50"
                      />
                      <button
                        onClick={() => grantTokens(u.id)}
                        disabled={busy[u.id] || !grantInputs[u.id]}
                        className="px-2.5 py-1 rounded-lg bg-brand-600/20 border border-brand-500/20 text-brand-400 hover:bg-brand-600/30 disabled:opacity-40 transition-all text-xs"
                      >
                        {busy[u.id] ? '…' : '+ Add'}
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setBalance(u.id, 100)}
                        disabled={busy[`set_${u.id}`]}
                        title="Reset to 100 tokens"
                        className="px-2 py-1 rounded-lg bg-white/5 border border-white/8 text-slate-400 hover:bg-white/10 disabled:opacity-40 transition-all text-[10px]"
                      >
                        Reset 100
                      </button>
                      {u.id !== (user as any)?.id && (
                        <button
                          onClick={() => toggleAdmin(u.id)}
                          disabled={busy[`admin_${u.id}`]}
                          title={u.isAdmin ? 'Remove admin' : 'Make admin'}
                          className={`px-2 py-1 rounded-lg border disabled:opacity-40 transition-all text-[10px] ${
                            u.isAdmin
                              ? 'bg-amber-500/10 border-amber-500/20 text-amber-400 hover:bg-amber-500/20'
                              : 'bg-white/5 border-white/8 text-slate-400 hover:bg-white/10'
                          }`}
                        >
                          {u.isAdmin ? '★ Admin' : '☆ Admin'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && (
            <div className="px-4 py-8 text-center text-slate-600 text-sm">No users yet</div>
          )}
        </div>
      )}

      {tab === 'activity' && (
        <div className="card overflow-hidden p-0">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/[0.06]">
                {['Time', 'Type', 'Amount', 'Note'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-slate-500 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {stats?.recentActivity.map(a => (
                <tr key={a.id} className="hover:bg-white/[0.02]">
                  <td className="px-4 py-2.5 text-slate-500">{new Date(a.createdAt).toLocaleString()}</td>
                  <td className="px-4 py-2.5">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                      a.type === 'grant' ? 'bg-green-500/15 text-green-400' :
                      a.type === 'deduct' ? 'bg-red-500/10 text-red-400' :
                      'bg-blue-500/10 text-blue-400'
                    }`}>{a.type}</span>
                  </td>
                  <td className={`px-4 py-2.5 font-mono font-bold ${a.amount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {a.amount > 0 ? `+${a.amount}` : a.amount}
                  </td>
                  <td className="px-4 py-2.5 text-slate-500">{a.note || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!stats?.recentActivity.length && (
            <div className="px-4 py-8 text-center text-slate-600 text-sm">No activity yet</div>
          )}
        </div>
      )}
    </div>
  )
}
