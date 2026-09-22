import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { supabase } from '../lib/supabase'

// A checagem de verdade acontece no servidor (/api/admin/users). Esta lista só evita mostrar a tela para quem não é admin.
const ADMIN_EMAILS = [
  'superdownyes@gmail.com',
  'moises@liquimap.com.br',
  'admin@liquimap.com.br',
]

async function adminFetch(method, body) {
  const { data: { session } } = await supabase.auth.getSession()
  const res = await fetch('/api/admin/users', {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token || ''}` },
    body: body ? JSON.stringify(body) : undefined,
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json.error || `Erro ${res.status}`)
  return json
}

const PLANS = ['trial', 'starter', 'pro', 'full', 'cancelled']
const PLAN_COLORS = { trial: '#facc15', starter: '#60a5fa', pro: '#34d399', full: '#a78bfa', cancelled: '#6b7280' }

export default function Admin() {
  const router = useRouter()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterPlan, setFilter] = useState('all')
  const [saving, setSaving] = useState(null)
  const [adminOk, setAdminOk] = useState(false)
  const [stats, setStats] = useState({})
  const [denied, setDenied] = useState(null)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data?.user) { router.push('/login?next=/admin'); return }
      if (!ADMIN_EMAILS.includes((data.user.email || '').toLowerCase())) { setDenied(data.user.email); return }
      setAdminOk(true)
      loadUsers()
    })
  }, [])

  async function loadUsers() {
    setLoading(true); setErrorMsg('')
    let data = []
    try { data = (await adminFetch('GET')).users } catch (e) { setErrorMsg(e.message) }
    setUsers(data || [])
    const s = { total: 0, trial: 0, paying: 0, revenue: 0 }
    const prices = { starter: 29, pro: 59, full: 99 }
    ;(data || []).forEach(u => {
      s.total++
      if (u.plan === 'trial') s.trial++
      if (u.is_paying) { s.paying++; s.revenue += prices[u.plan] || 0 }
    })
    setStats(s)
    setLoading(false)
  }

  async function changePlan(userId, newPlan) {
    setSaving(userId)
    const isPaying = !['trial', 'cancelled'].includes(newPlan)
    try { await adminFetch('PATCH', { id: userId, plan: newPlan }) } catch (e) { setErrorMsg(e.message); setSaving(null); return }
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, plan: newPlan, is_paying: isPaying } : u))
    setSaving(null)
  }

  function daysLeft(trialEnd) {
    if (!trialEnd) return null
    return Math.ceil((new Date(trialEnd) - new Date()) / 86400000)
  }

  const filtered = users.filter(u => {
    const s = !search || u.email?.toLowerCase().includes(search.toLowerCase()) || u.name?.toLowerCase().includes(search.toLowerCase())
    const p = filterPlan === 'all' || (filterPlan === 'paying' ? u.is_paying : u.plan === filterPlan)
    return s && p
  })

  if (denied) return (
    <div style={{ background: '#05070f', minHeight: '100vh', color: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif', textAlign: 'center' }}>
      <div>Acesso negado para <b>{denied}</b>.<br /><span style={{ color: '#64748b', fontSize: 13 }}>Este e-mail não está na lista de administradores.</span></div>
    </div>
  )
  if (!adminOk) return (
    <div style={{ background: '#05070f', minHeight: '100vh', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif' }}>Verificando acesso...</div>
  )

  const col = { display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1.2fr 1fr 1fr 1.5fr', padding: '11px 20px', alignItems: 'center' }

  return (
    <>
      <Head><title>Admin — LiquiMap</title></Head>
      <div style={{ background: '#05070f', minHeight: '100vh', fontFamily: 'Inter, sans-serif', color: '#e2e8f0' }}>
        <div style={{ background: '#0b0f1e', borderBottom: '1px solid #1e2d4a', padding: '14px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 20, fontWeight: 800, color: '#22d3a0' }}>LiquiMap</span>
            <span style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', fontSize: 10, fontWeight: 700, letterSpacing: 2, padding: '3px 8px', borderRadius: 4 }}>ADMIN</span>
          </div>
          <button onClick={() => { supabase.auth.signOut(); router.push('/') }} style={{ background: 'none', border: '1px solid #1e2d4a', color: '#64748b', padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>
            Sair
          </button>
        </div>

        <div style={{ padding: '28px 32px', maxWidth: 1300, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 28 }}>
            {[
              { label: 'Total usuários', value: stats.total || 0, color: '#60a5fa', icon: '👥' },
              { label: 'Em trial', value: stats.trial || 0, color: '#facc15', icon: '⏳' },
              { label: 'Pagantes', value: stats.paying || 0, color: '#22d3a0', icon: '💳' },
              { label: 'MRR estimado', value: `$${stats.revenue || 0}`, color: '#a78bfa', icon: '💰' },
            ].map((s, i) => (
              <div key={i} style={{ background: '#0b0f1e', border: '1px solid #1e2d4a', borderRadius: 10, padding: '18px 20px', borderTop: `3px solid ${s.color}` }}>
                <div style={{ fontSize: 22, marginBottom: 8 }}>{s.icon}</div>
                <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>{s.label}</div>
                <div style={{ fontSize: 26, fontWeight: 800, color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
            <input type="text" placeholder="🔍 Buscar nome ou e-mail..." value={search} onChange={e => setSearch(e.target.value)}
              style={{ flex: 1, minWidth: 220, background: '#0b0f1e', border: '1px solid #1e2d4a', borderRadius: 8, padding: '10px 14px', color: '#e2e8f0', fontSize: 13, outline: 'none' }} />
            <select value={filterPlan} onChange={e => setFilter(e.target.value)}
              style={{ background: '#0b0f1e', border: '1px solid #1e2d4a', borderRadius: 8, padding: '10px 14px', color: '#e2e8f0', fontSize: 13, cursor: 'pointer' }}>
              <option value="all">Todos os planos</option>
              <option value="paying">💳 Só pagantes</option>
              {PLANS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <button onClick={loadUsers} style={{ background: '#1e2d4a', border: 'none', borderRadius: 8, padding: '10px 18px', color: '#e2e8f0', fontSize: 13, cursor: 'pointer' }}>
              🔄 Atualizar
            </button>
          </div>

          {errorMsg && <div style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171', padding: '10px 14px', borderRadius: 8, marginBottom: 14, fontSize: 13 }}>Erro: {errorMsg}</div>}
          <div style={{ background: '#0b0f1e', border: '1px solid #1e2d4a', borderRadius: 10, overflow: 'hidden' }}>
            <div style={{ ...col, background: '#0d1327', borderBottom: '1px solid #1e2d4a', fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>
              <span>Nome</span><span>E-mail</span><span>Plano</span><span>Trial até</span><span>Pagante</span><span>Cadastro</span><span>Ação</span>
            </div>

            {loading ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>Carregando...</div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>Nenhum usuário encontrado.</div>
            ) : filtered.map(u => {
              const dl = daysLeft(u.trial_end)
              const expired = dl !== null && dl <= 0
              return (
                <div key={u.id} style={{ ...col, borderBottom: '1px solid #111827' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{u.name || '—'}</span>
                  <span style={{ fontSize: 12, color: '#94a3b8' }}>{u.email}</span>
                  <span style={{ display: 'inline-block', background: `${PLAN_COLORS[u.plan] || '#6b7280'}20`, color: PLAN_COLORS[u.plan] || '#6b7280', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, textTransform: 'uppercase', letterSpacing: 1 }}>{u.plan}</span>
                  <span style={{ fontSize: 12, color: expired ? '#f87171' : '#94a3b8' }}>{u.trial_end ? (expired ? '⛔ Expirado' : `✅ ${dl}d`) : '—'}</span>
                  <span style={{ fontSize: 18 }}>{u.is_paying ? '✅' : '❌'}</span>
                  <span style={{ fontSize: 11, color: '#64748b' }}>{u.created_at ? new Date(u.created_at).toLocaleDateString('pt-BR') : '—'}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <select value={u.plan} onChange={e => changePlan(u.id, e.target.value)} disabled={saving === u.id}
                      style={{ background: '#111827', border: '1px solid #1e2d4a', borderRadius: 6, padding: '5px 10px', color: '#e2e8f0', fontSize: 12, cursor: 'pointer', flex: 1 }}>
                      {PLANS.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                    {saving === u.id && <span style={{ fontSize: 12, color: '#22d3a0' }}>⏳</span>}
                  </div>
                </div>
              )
            })}
          </div>
          <div style={{ marginTop: 12, fontSize: 12, color: '#475569', textAlign: 'right' }}>{filtered.length} de {users.length} usuários</div>
        </div>
      </div>
    </>
  )
}
