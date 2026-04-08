import { useApp } from './_app'
import { translations } from '../lib/i18n'
import { PLANS, PLAN_LIST } from '../lib/plans'
import Navbar from '../components/Navbar'
import HeatmapCanvas from '../components/HeatmapCanvas'
import { useRouter } from 'next/router'
import Head from 'next/head'

export default function Home() {
  const { lang } = useApp()
  const t = translations[lang]
  const router = useRouter()

  const isPT = lang === 'pt'

  return (
    <>
      <Head>
        <title>LiquiMap — Mapa de liquidez em tempo real</title>
        <meta name="description" content="Heatmap do livro de ordens em tempo real. Cripto, Forex, Metais, Nasdaq e B3 Brasil. Tudo no navegador." />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div style={{ background: '#080c10', minHeight: '100vh', color: '#fff' }}>
        <Navbar />

        {/* ── HERO — escuro ── */}
        <section style={{ padding: '72px 32px 56px', textAlign: 'center', background: '#080c10' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(34,201,122,0.1)', border: '0.5px solid rgba(34,201,122,0.3)',
            borderRadius: 20, padding: '5px 16px', fontSize: 12, color: '#22c97a', marginBottom: 28,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c97a', display: 'inline-block', animation: 'pulse 1.5s infinite' }} />
            {t.hero.tag}
          </div>

          <h1 style={{ fontSize: 52, fontWeight: 700, lineHeight: 1.1, marginBottom: 20, letterSpacing: -2, maxWidth: 700, margin: '0 auto 20px' }}>
            {t.hero.title.split(t.hero.titleHighlight).map((part, i) => (
              <span key={i}>{part}{i === 0 && <span style={{ color: '#22c97a' }}>{t.hero.titleHighlight}</span>}</span>
            ))}
          </h1>

          <p style={{ fontSize: 17, color: '#888', maxWidth: 540, margin: '0 auto 36px', lineHeight: 1.7 }}>
            {t.hero.sub}
          </p>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
            <button onClick={() => router.push('/signup')} style={{
              background: '#22c97a', color: '#000', border: 'none',
              padding: '14px 32px', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer',
              boxShadow: '0 0 24px rgba(34,201,122,0.25)',
            }}>{t.hero.btn1}</button>
            <button onClick={() => router.push('/demo')} style={{
              background: 'transparent', color: '#ccc', border: '0.5px solid #2a2f3a',
              padding: '13px 24px', borderRadius: 10, fontSize: 15, cursor: 'pointer',
              transition: 'border-color 0.2s',
            }}>{t.hero.btn2}</button>
          </div>
          <p style={{ fontSize: 12, color: '#555', marginTop: 16 }}>{t.hero.note}</p>
        </section>

        {/* ── LIVE HEATMAP — escuro ── */}
        <section style={{ padding: '0 32px 0', background: '#080c10' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <HeatmapCanvas symbol="BTC/USDT" height={300} />
          </div>
        </section>

        {/* ── SOCIAL PROOF — escuro ── */}
        <section style={{ padding: '32px 32px 0', background: '#080c10', textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 40, flexWrap: 'wrap', maxWidth: 700, margin: '0 auto' }}>
            {[
              { val: '200+', label: isPT ? 'Pares cripto' : 'Crypto pairs' },
              { val: '$0', label: isIT ? 'Taxa de feed' : 'Feed cost', sub: isIT ? 'incluído' : 'included' },
              { val: '7', label: isIT ? 'Dias grátis' : 'Days free trial' },
              { val: '50%', label: isIT ? 'Mais barato' : 'Cheaper than Bookmap' },
            ].map((s, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 30, fontWeight: 700, color: '#22c97a' }}>{s.val}</div>
                <div style={{ fontSize: 12, color: '#666', marginTop: 3 }}>{s.label}</div>
                {s.sub && <div style={{ fontSize: 10, color: '#444' }}>{s.sub}</div>}
              </div>
            ))}
          </div>
        </section>

        {/* ── FEATURES — claro ── */}
        <section style={{ padding: '72px 32px', background: '#f8f9fc', color: '#111' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <h2 style={{ fontSize: 34, fontWeight: 700, letterSpacing: -1, marginBottom: 12, color: '#111' }}>
                {t.features.title}
              </h2>
              <p style={{ fontSize: 15, color: '#666', maxWidth: 480, margin: '0 auto' }}>
                {isIT ? 'Tudo que um trader profissional precisa para ler o mercado.' : 'Everything a professional trader needs to read the market.'}
              </p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
              {t.features.items.map((f, i) => (
                <div key={i} style={{
                  background: '#fff', border: '1px solid #e8eaed',
                  borderRadius: 14, padding: '24px 26px',
                  boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
                  transition: 'box-shadow 0.2s',
                }}>
                  <div style={{ fontSize: 24, marginBottom: 12 }}>
                    {['🌡️', '⚡', '📊', '🌐', '🖥️', '🔄'][i] || '✨'}
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#111', marginBottom: 8 }}>{f.title}</div>
                  <div style={{ fontSize: 13, color: '#666', lineHeight: 1.65 }}>{f.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── DEMO CTA — escuro ── */}
        <section style={{ padding: '72px 32px', background: '#0d1117', textAlign: 'center' }}>
          <div style={{ maxWidth: 700, margin: '0 auto' }}>
            <div style={{ fontSize: 12, color: '#22c97a', fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 16 }}>
              {isIT ? 'Demonstração ao vivo' : 'Live demonstration'}
            </div>
            <h2 style={{ fontSize: 36, fontWeight: 700, letterSpacing: -1, marginBottom: 16, color: '#fff' }}>
              {isIT ? 'Veja o LiquiMap em ação' : 'See LiquiMap in action'}
            </h2>
            <p style={{ fontSize: 15, color: '#888', marginBottom: 32, lineHeight: 1.7 }}>
              {isIT
                ? 'Tour guiado com 6 etapas. BTC, ETH e SOL ao vivo simultaneamente. Veja tamanhos de lote, icebergs e grandes players em tempo real.'
                : 'Guided tour with 6 steps. BTC, ETH and SOL live simultaneously. See lot sizes, icebergs and large players in real time.'}
            </p>
            <button onClick={() => router.push('/demo')} style={{
              background: '#22c97a', color: '#000', border: 'none',
              padding: '15px 36px', borderRadius: 10, fontSize: 16, fontWeight: 700, cursor: 'pointer',
              boxShadow: '0 0 30px rgba(34,201,122,0.3)',
            }}>
              {isIT ? '▶ Ver demonstração ao vivo' : '▶ Watch live demonstration'}
            </button>
            <div style={{ display: 'flex', gap: 20, justifyContent: 'center', marginTop: 24, flexWrap: 'wrap' }}>
              {['🐋 Large Lot Tracker', '🧊 Iceberg Detection', '⚫ Volume Dots', '📊 DOM com lotes'].map((item, i) => (
                <span key={i} style={{ fontSize: 12, color: '#666', display: 'flex', alignItems: 'center', gap: 4 }}>
                  {item}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ── VS TABLE — claro ── */}
        <section style={{ padding: '72px 32px', background: '#f8f9fc' }}>
          <div style={{ maxWidth: 900, margin: '0 auto' }}>
            <h2 style={{ fontSize: 34, fontWeight: 700, textAlign: 'center', marginBottom: 12, color: '#111', letterSpacing: -1 }}>
              {t.compare.title}
            </h2>
            <p style={{ fontSize: 14, color: '#888', textAlign: 'center', marginBottom: 40 }}>
              {isIT ? 'Bookmap cobra software + feed + VPS separados. LiquiMap: tudo em um.' : 'Bookmap charges software + feed + VPS separately. LiquiMap: all in one.'}
            </p>
            <div style={{ background: '#fff', border: '1px solid #e8eaed', borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
                    {t.compare.headers.map((h, i) => (
                      <th key={i} style={{
                        padding: '14px 24px', textAlign: 'left',
                        color: i === 1 ? '#22c97a' : '#888',
                        fontWeight: i === 1 ? 700 : 500, fontSize: 13,
                        background: i === 1 ? 'rgba(34,201,122,0.04)' : 'transparent',
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {t.compare.rows.map((row, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f5f5f5' }}>
                      <td style={{ padding: '11px 24px', color: '#444', fontWeight: 500 }}>{row[0]}</td>
                      <td style={{ padding: '11px 24px', color: '#22c97a', fontWeight: 600, background: 'rgba(34,201,122,0.03)' }}>{row[1]}</td>
                      <td style={{ padding: '11px 24px', color: '#aaa' }}>{row[2]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ── PRICING — escuro ── */}
        <section style={{ padding: '72px 32px', background: '#080c10' }}>
          <div style={{ maxWidth: 1000, margin: '0 auto' }}>
            <h2 style={{ fontSize: 34, fontWeight: 700, textAlign: 'center', marginBottom: 10, color: '#fff', letterSpacing: -1 }}>
              {t.pricing.title}
            </h2>
            <p style={{ fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 48 }}>{t.pricing.sub}</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
              {PLAN_LIST.map(pid => {
                const plan = PLANS[pid]
                return (
                  <div key={pid} style={{
                    background: plan.popular ? '#0d1a12' : '#0d1117',
                    borderRadius: 16,
                    border: plan.popular ? '1.5px solid #22c97a' : '0.5px solid #2a2f3a',
                    padding: '28px', display: 'flex', flexDirection: 'column', gap: 16,
                    boxShadow: plan.popular ? '0 0 40px rgba(34,201,122,0.12)' : 'none',
                    position: 'relative',
                  }}>
                    {plan.popular && (
                      <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: '#22c97a', color: '#000', fontSize: 11, fontWeight: 700, padding: '3px 14px', borderRadius: 10 }}>
                        {t.pricing.popular}
                      </div>
                    )}
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 600, color: '#fff', marginBottom: 8 }}>{plan.name}</div>
                      <div style={{ fontSize: 36, fontWeight: 700, color: plan.popular ? '#22c97a' : '#fff' }}>
                        ${plan.price}<span style={{ fontSize: 14, color: '#555', fontWeight: 400 }}>{t.pricing.period}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                      {plan.features[lang].map((f, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#ccc' }}>
                          <span style={{ color: '#22c97a', fontSize: 14, flexShrink: 0 }}>✓</span>{f}
                        </div>
                      ))}
                      {plan.missing[lang].map((f, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#444' }}>
                          <span style={{ fontSize: 14, flexShrink: 0 }}>✗</span>{f}
                        </div>
                      ))}
                    </div>
                    <button onClick={() => router.push(`/signup?plan=${pid}`)} style={{
                      padding: '12px', borderRadius: 10, fontSize: 14, cursor: 'pointer', fontWeight: 600,
                      background: plan.popular ? '#22c97a' : 'transparent',
                      color: plan.popular ? '#000' : '#888',
                      border: plan.popular ? 'none' : '0.5px solid #2a2f3a',
                    }}>{t.pricing.cta}</button>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* ── FINAL CTA — claro ── */}
        <section style={{ padding: '80px 32px', background: '#f8f9fc', textAlign: 'center' }}>
          <div style={{ maxWidth: 600, margin: '0 auto' }}>
            <h2 style={{ fontSize: 36, fontWeight: 700, color: '#111', letterSpacing: -1, marginBottom: 14 }}>
              {isIT ? 'Pronto para operar com informação real?' : 'Ready to trade with real information?'}
            </h2>
            <p style={{ fontSize: 15, color: '#888', marginBottom: 32, lineHeight: 1.7 }}>
              {isIT ? '7 dias grátis em todos os planos. Sem cartão de crédito. Cancele quando quiser.' : '7 days free on all plans. No credit card. Cancel anytime.'}
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={() => router.push('/signup')} style={{
                background: '#111', color: '#fff', border: 'none',
                padding: '14px 36px', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer',
              }}>
                {isIT ? 'Começar 7 dias grátis →' : 'Start 7-day free trial →'}
              </button>
              <button onClick={() => router.push('/demo')} style={{
                background: 'transparent', color: '#666', border: '1px solid #ddd',
                padding: '13px 24px', borderRadius: 10, fontSize: 15, cursor: 'pointer',
              }}>
                {isIT ? 'Ver demonstração' : 'See demo'}
              </button>
            </div>
          </div>
        </section>

        {/* ── FOOTER — escuro ── */}
        <footer style={{ padding: '24px 32px', borderTop: '0.5px solid #2a2f3a', background: '#080c10', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
          <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: -0.5 }}>
            Liqui<span style={{ color: '#22c97a' }}>Map</span>
          </div>
          <div style={{ fontSize: 12, color: '#555' }}>{t.footer.tagline}</div>
          <div style={{ fontSize: 11, color: '#444', maxWidth: 400, textAlign: 'right' }}>{t.footer.risk}</div>
        </footer>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }
      `}</style>
    </>
  )
}
