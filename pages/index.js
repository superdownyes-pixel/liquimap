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

  return (
    <>
      <Head>
        <title>FlowMap — Real-time order book heatmap</title>
        <meta name="description" content="Real-time order book heatmap for Crypto, Forex, Metals, Nasdaq and B3 Brasil" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
        <Navbar />

        {/* HERO */}
        <section style={{ padding: '64px 32px 40px', textAlign: 'center' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'var(--bg3)', border: '0.5px solid var(--border2)',
            borderRadius: 20, padding: '5px 16px', fontSize: 12, color: 'var(--green2)', marginBottom: 24,
          }}>
            <span className="dot-live" />
            {t.hero.tag}
          </div>
          <h1 style={{ fontSize: 44, fontWeight: 500, lineHeight: 1.15, color: 'var(--text)', marginBottom: 16, letterSpacing: -1.5 }}>
            {t.hero.title.split(t.hero.titleHighlight).map((part, i) => (
              <span key={i}>{part}{i === 0 && <span style={{ color: 'var(--green2)' }}>{t.hero.titleHighlight}</span>}</span>
            ))}
          </h1>
          <p style={{ fontSize: 16, color: 'var(--text2)', maxWidth: 560, margin: '0 auto 32px', lineHeight: 1.65 }}>
            {t.hero.sub}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
            <button onClick={() => router.push('/signup')} style={{
              background: 'var(--green)', color: '#fff', border: 'none',
              padding: '13px 28px', borderRadius: 9, fontSize: 15, fontWeight: 500, cursor: 'pointer',
            }}>{t.hero.btn1}</button>
            <button style={{
              background: 'transparent', color: 'var(--text2)', border: '0.5px solid var(--border2)',
              padding: '12px 22px', borderRadius: 9, fontSize: 15, cursor: 'pointer',
            }}>{t.hero.btn2}</button>
          </div>
          <p style={{ fontSize: 12, color: 'var(--text3)', marginTop: 14 }}>{t.hero.note}</p>
        </section>

        {/* LIVE PREVIEW */}
        <section style={{ padding: '0 32px 48px' }}>
          <HeatmapCanvas symbol="BTC/USDT" height={300} />
        </section>

        {/* FEATURES */}
        <section style={{ padding: '0 32px 56px' }}>
          <h2 style={{ fontSize: 28, fontWeight: 500, textAlign: 'center', marginBottom: 8 }}>{t.features.title}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginTop: 32 }}>
            {t.features.items.map((f, i) => (
              <div key={i} style={{ background: 'var(--bg2)', border: '0.5px solid var(--border)', borderRadius: 12, padding: '20px 22px' }}>
                <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)', marginBottom: 8 }}>{f.title}</div>
                <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* VS TABLE */}
        <section style={{ padding: '0 32px 56px' }}>
          <h2 style={{ fontSize: 28, fontWeight: 500, textAlign: 'center', marginBottom: 32 }}>{t.compare.title}</h2>
          <div style={{ background: 'var(--bg2)', border: '0.5px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ borderBottom: '0.5px solid var(--border)' }}>
                  {t.compare.headers.map((h, i) => (
                    <th key={i} style={{ padding: '12px 20px', textAlign: 'left', color: i === 1 ? 'var(--green2)' : 'var(--text2)', fontWeight: 400, fontSize: 13 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {t.compare.rows.map((row, i) => (
                  <tr key={i} style={{ borderBottom: '0.5px solid var(--border)' }}>
                    <td style={{ padding: '10px 20px', color: 'var(--text)' }}>{row[0]}</td>
                    <td style={{ padding: '10px 20px', color: 'var(--green2)', fontWeight: 500, background: 'rgba(26,158,95,0.05)' }}>{row[1]}</td>
                    <td style={{ padding: '10px 20px', color: 'var(--text3)' }}>{row[2]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* PRICING */}
        <section style={{ padding: '0 32px 64px' }}>
          <h2 style={{ fontSize: 28, fontWeight: 500, textAlign: 'center', marginBottom: 8 }}>{t.pricing.title}</h2>
          <p style={{ fontSize: 14, color: 'var(--text2)', textAlign: 'center', marginBottom: 32 }}>{t.pricing.sub}</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
            {PLAN_LIST.map(pid => {
              const plan = PLANS[pid]
              return (
                <div key={pid} style={{
                  background: 'var(--bg2)', borderRadius: 14,
                  border: plan.popular ? '1.5px solid var(--green)' : '0.5px solid var(--border)',
                  padding: '24px', display: 'flex', flexDirection: 'column', gap: 14,
                }}>
                  {plan.popular && (
                    <span style={{ fontSize: 10, background: 'var(--green3)', color: 'var(--green2)', padding: '3px 10px', borderRadius: 4, fontWeight: 500, display: 'inline-block' }}>
                      {t.pricing.popular}
                    </span>
                  )}
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 500, color: 'var(--text)', marginBottom: 6 }}>{plan.name}</div>
                    <div style={{ fontSize: 30, fontWeight: 500, color: 'var(--text)' }}>
                      ${plan.price}<span style={{ fontSize: 14, color: 'var(--text2)', fontWeight: 400 }}>{t.pricing.period}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                    {plan.features[lang].map((f, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text2)' }}>
                        <span style={{ color: 'var(--green2)', fontSize: 14 }}>✓</span>{f}
                      </div>
                    ))}
                    {plan.missing[lang].map((f, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text3)', opacity: 0.5 }}>
                        <span style={{ fontSize: 14 }}>✗</span>{f}
                      </div>
                    ))}
                  </div>
                  <button onClick={() => router.push(`/signup?plan=${pid}`)} style={{
                    padding: '10px', borderRadius: 8, fontSize: 14, cursor: 'pointer', fontWeight: 500,
                    background: plan.popular ? 'var(--green)' : 'transparent',
                    color: plan.popular ? '#fff' : 'var(--text2)',
                    border: plan.popular ? 'none' : '0.5px solid var(--border2)',
                  }}>{t.pricing.cta}</button>
                </div>
              )
            })}
          </div>
        </section>

        {/* FOOTER */}
        <footer style={{ padding: '20px 32px', borderTop: '0.5px solid var(--border)', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <div style={{ fontSize: 15, fontWeight: 500 }}>Flow<span style={{ color: 'var(--green2)' }}>Map</span></div>
          <div style={{ fontSize: 12, color: 'var(--text3)' }}>{t.footer.tagline}</div>
          <div style={{ fontSize: 11, color: 'var(--text3)' }}>{t.footer.risk}</div>
        </footer>
      </div>
    </>
  )
}
