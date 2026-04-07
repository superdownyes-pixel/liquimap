import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabase'
import { useApp } from './_app'
import { translations } from '../lib/i18n'
import { PLANS } from '../lib/plans'
import HeatmapCanvas from '../components/HeatmapCanvas'
import Navbar from '../components/Navbar'
import Head from 'next/head'

const SYMBOLS = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'BNB/USDT', 'XRP/USDT']

export default function Dashboard() {
  const { user, lang } = useApp()
  const t = translations[lang].dashboard
  const router = useRouter()
  const [planId, setPlanId] = useState('starter')
  const [selectedSym, setSym] = useState('BTC/USDT')
  const [trialEnd, setTrialEnd] = useState(null)

  useEffect(() => {
    if (!user) { router.push('/login'); return }
    const userPlan = user.user_metadata?.plan || 'starter'
    setPlanId(userPlan)
    const end = new Date()
    end.setDate(end.getDate() + 7)
    setTrialEnd(end.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }))
  }, [user])

  const plan = PLANS[planId]
  const markets = [
    { key: 'crypto', label: t.crypto, plans: ['starter', 'pro', 'full'], tags: ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', '+197'] },
    { key: 'forex', label: t.forex, plans: ['pro', 'full'], tags: ['EUR/USD', 'GBP/USD', 'USD/BRL'] },
    { key: 'stocks', label: t.stocks, plans: ['full'], tags: ['AAPL', 'TSLA', 'ES/NQ'] },
    { key: 'b3', label: t.b3, plans: ['full'], tags: ['WIN', 'WDO', 'DOL'] },
  ]

  const hasAccess = (mkt) => mkt.plans.includes(planId)

  async function logout() {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <>
      <Head><title>Dashboard — FlowMap</title></Head>
      <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
        <Navbar />

        <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            {[
              { label: t.plan, value: plan?.name, color: 'var(--green2)' },
              { label: t.markets, value: plan?.markets.length },
              { label: t.daysLeft, value: '7' },
              { label: t.billing, value: trialEnd || '—' },
            ].map((m, i) => (
              <div key={i} style={{ background: 'var(--bg2)', border: '0.5px solid var(--border)', borderRadius: 10, padding: '12px 16px' }}>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 5 }}>{m.label}</div>
                <div style={{ fontSize: i === 3 ? 13 : 18, fontWeight: 500, color: m.color || 'var(--text)' }}>{m.value}</div>
              </div>
            ))}
          </div>

          {/* Market selector */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {markets.map(mkt => (
              <div key={mkt.key} style={{
                background: hasAccess(mkt) ? 'var(--bg2)' : 'var(--bg3)',
                border: '0.5px solid var(--border)', borderRadius: 10, padding: '14px 18px',
                flex: 1, minWidth: 180, opacity: hasAccess(mkt) ? 1 : 0.6,
              }}>
                <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 6 }}>{mkt.label}</div>
                {hasAccess(mkt) ? (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {mkt.tags.map(tag => (
                      <span key={tag} style={{ fontSize: 11, padding: '2px 8px', background: 'var(--green3)', color: 'var(--green2)', borderRadius: 4 }}>{tag}</span>
                    ))}
                  </div>
                ) : (
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 8 }}>{t.availableIn} {mkt.plans[0]}</div>
                    <button onClick={() => router.push('/signup')} style={{
                      fontSize: 12, padding: '5px 12px', background: 'transparent', border: '0.5px solid var(--border2)',
                      color: 'var(--text2)', borderRadius: 6, cursor: 'pointer',
                    }}>{t.upgrade}</button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Symbol selector */}
          <div style={{ display: 'flex', gap: 8 }}>
            {SYMBOLS.map(s => (
              <button key={s} onClick={() => setSym(s)} style={{
                padding: '6px 14px', borderRadius: 7, fontSize: 13, cursor: 'pointer',
                background: selectedSym === s ? 'var(--green3)' : 'transparent',
                color: selectedSym === s ? 'var(--green2)' : 'var(--text2)',
                border: selectedSym === s ? '0.5px solid var(--green)' : '0.5px solid var(--border2)',
              }}>{s}</button>
            ))}
          </div>

          {/* Live Heatmap */}
          <HeatmapCanvas symbol={selectedSym} height={340} />

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={logout} style={{
              padding: '9px 20px', fontSize: 13, background: 'transparent',
              border: '0.5px solid var(--border2)', color: 'var(--text2)', borderRadius: 7, cursor: 'pointer',
            }}>Log out</button>
          </div>

        </div>
      </div>
    </>
  )
}
