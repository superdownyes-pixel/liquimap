import { useRouter } from 'next/router'
import { useApp } from './_app'
import Head from 'next/head'

export default function Success() {
  const router = useRouter()
  const { lang } = useApp()

  return (
    <>
      <Head><title>Welcome to LiquiMap!</title></Head>
      <div style={{ background: 'var(--bg)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ maxWidth: 440, width: '100%', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>

          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--green3)', border: '1.5px solid var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <polyline points="6,14 11,19 22,9" stroke="var(--green2)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>

          <div>
            <div style={{ fontSize: 26, fontWeight: 500, marginBottom: 8 }}>
              {lang === 'pt' ? 'Trial ativado!' : 'Trial activated!'}
            </div>
            <div style={{ fontSize: 15, color: 'var(--text2)', lineHeight: 1.6 }}>
              {lang === 'pt'
                ? 'Seus 7 dias gratuitos começaram. Explore o LiquiMap sem limites.'
                : 'Your 7-day free trial has started. Explore LiquiMap with no limits.'}
            </div>
          </div>

          <div style={{ background: 'var(--bg2)', border: '0.5px solid var(--border)', borderRadius: 12, padding: '20px 24px', width: '100%' }}>
            {[
              { label: lang === 'pt' ? 'Status' : 'Status', value: lang === 'pt' ? 'Trial ativo — 7 dias' : 'Trial active — 7 days', color: 'var(--green2)' },
              { label: lang === 'pt' ? 'Mercados disponíveis' : 'Available markets', value: lang === 'pt' ? 'Cripto, Forex, Metais' : 'Crypto, Forex, Metals' },
              { label: lang === 'pt' ? 'Cobrança' : 'Billing', value: lang === 'pt' ? 'Somente após o trial' : 'Only after trial ends' },
            ].map((r, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < 2 ? '0.5px solid var(--border)' : 'none', fontSize: 14 }}>
                <span style={{ color: 'var(--text2)' }}>{r.label}</span>
                <span style={{ fontWeight: 500, color: r.color || 'var(--text)' }}>{r.value}</span>
              </div>
            ))}
          </div>

          <button onClick={() => router.push('/dashboard')} style={{
            width: '100%', background: 'var(--green)', color: '#fff', border: 'none',
            padding: '13px', borderRadius: 9, fontSize: 15, fontWeight: 500, cursor: 'pointer',
          }}>
            {lang === 'pt' ? 'Abrir LiquiMap →' : 'Open LiquiMap →'}
          </button>

        </div>
      </div>
    </>
  )
}
