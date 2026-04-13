import { useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabase'
import { useApp } from './_app'
import { translations } from '../lib/i18n'
import { PLANS, PLAN_LIST } from '../lib/plans'
import Head from 'next/head'

export default function Signup() {
  const { lang } = useApp()
  const t = translations[lang]
  const router = useRouter()
  const defaultPlan = router.query.plan || 'pro'

  const [step, setStep] = useState(1)
  const [selectedPlan, setPlan] = useState(defaultPlan)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const inputStyle = {
    width: '100%', padding: '10px 14px', borderRadius: 8, fontSize: 14,
    background: 'var(--bg3)', border: '0.5px solid var(--border2)',
    color: 'var(--text)', outline: 'none',
  }

  async function handleRegister(e) {
    e.preventDefault()
    if (!name || !email || !password) { setError('Please fill all fields'); return }
    setLoading(true); setError('')
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: name, plan: selectedPlan } }
    })
    if (error) { setError(error.message); setLoading(false); return }
    setLoading(false)
    setStep(3) // Go to payment step
  }

  async function handleCheckout() {
    setLoading(true)
    const res = await fetch('/api/create-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan: selectedPlan, email }),
    })
    const { url } = await res.json()
    if (url) window.location.href = url
    else { setError('Checkout failed. Try again.'); setLoading(false) }
  }

  const plan = PLANS[selectedPlan]

  return (
    <>
      <Head><title>Sign up — LiquiMap</title></Head>
      <div style={{ background: 'var(--bg)', minHeight: '100vh', padding: '40px 24px' }}>
        <div onClick={() => router.push('/')} style={{ fontSize: 20, fontWeight: 500, textAlign: 'center', marginBottom: 40, cursor: 'pointer' }}>
          Liqui<span style={{ color: 'var(--green2)' }}>Map</span>
        </div>

        {/* Progress */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 40 }}>
          {['Plan', 'Account', 'Payment'].map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 500,
                background: step > i + 1 ? 'var(--green)' : step === i + 1 ? 'var(--green3)' : 'var(--bg3)',
                color: step >= i + 1 ? 'var(--green2)' : 'var(--text3)',
                border: step === i + 1 ? '1.5px solid var(--green)' : '0.5px solid var(--border2)',
              }}>{i + 1}</div>
              <span style={{ fontSize: 12, color: step === i + 1 ? 'var(--text)' : 'var(--text3)' }}>{s}</span>
              {i < 2 && <div style={{ width: 40, height: 0.5, background: 'var(--border2)' }} />}
            </div>
          ))}
        </div>

        {/* STEP 1 — Plan */}
        {step === 1 && (
          <div style={{ maxWidth: 720, margin: '0 auto' }}>
            <h2 style={{ fontSize: 22, fontWeight: 500, textAlign: 'center', marginBottom: 24 }}>{t.pricing.title}</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
              {PLAN_LIST.map(pid => {
                const p = PLANS[pid]
                const sel = selectedPlan === pid
                return (
                  <div key={pid} onClick={() => setPlan(pid)} style={{
                    background: 'var(--bg2)', borderRadius: 12, padding: 20, cursor: 'pointer',
                    border: sel ? '1.5px solid var(--green)' : '0.5px solid var(--border)',
                    transition: 'border-color 0.15s',
                  }}>
                    {p.popular && <div style={{ fontSize: 10, background: 'var(--green3)', color: 'var(--green2)', padding: '2px 8px', borderRadius: 4, fontWeight: 500, display: 'inline-block', marginBottom: 8 }}>{t.pricing.popular}</div>}
                    <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 4 }}>{p.name}</div>
                    <div style={{ fontSize: 26, fontWeight: 500, marginBottom: 12 }}>${p.price}<span style={{ fontSize: 13, color: 'var(--text2)', fontWeight: 400 }}>{t.pricing.period}</span></div>
                    {p.features[lang].slice(0, 4).map((f, i) => (
                      <div key={i} style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 5, display: 'flex', gap: 6 }}>
                        <span style={{ color: 'var(--green2)' }}>✓</span>{f}
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>
            <button onClick={() => setStep(2)} style={{
              display: 'block', margin: '0 auto', background: 'var(--green)', color: '#fff',
              border: 'none', padding: '12px 40px', borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: 'pointer',
            }}>Continue with {PLANS[selectedPlan].name} →</button>
          </div>
        )}

        {/* STEP 2 — Account */}
        {step === 2 && (
          <div style={{ maxWidth: 420, margin: '0 auto' }}>
            <div style={{ background: 'var(--bg2)', border: '0.5px solid var(--border)', borderRadius: 14, padding: 32 }}>
              <h2 style={{ fontSize: 20, fontWeight: 500, marginBottom: 4 }}>{t.auth.registerTitle}</h2>
              <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 24 }}>{t.auth.registerSub}</p>
              <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 5 }}>{t.auth.name}</label>
                  <input type="text" required value={name} onChange={e => setName(e.target.value)} style={inputStyle} placeholder="Fabio" />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 5 }}>{t.auth.email}</label>
                  <input type="email" required value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} placeholder="you@email.com" />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 5 }}>{t.auth.password}</label>
                  <input type="password" required minLength={8} value={password} onChange={e => setPassword(e.target.value)} style={inputStyle} placeholder="Min. 8 characters" />
                </div>
                {error && <div style={{ fontSize: 12, color: 'var(--red)', background: 'rgba(224,90,74,0.1)', padding: '8px 12px', borderRadius: 6 }}>{error}</div>}
                <button type="submit" disabled={loading} style={{
                  background: 'var(--green)', color: '#fff', border: 'none',
                  padding: 12, borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: 'pointer',
                }}>{loading ? 'Creating account...' : t.auth.registerBtn}</button>
                <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--text2)' }}>
                  {t.auth.hasAccount} <span onClick={() => router.push('/login')} style={{ color: 'var(--green2)', cursor: 'pointer' }}>{t.auth.signIn}</span>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* STEP 3 — Payment */}
        {step === 3 && (
          <div style={{ maxWidth: 480, margin: '0 auto' }}>
            <div style={{ background: 'var(--bg2)', border: '0.5px solid var(--border)', borderRadius: 14, padding: 32, marginBottom: 16 }}>
              <h2 style={{ fontSize: 20, fontWeight: 500, marginBottom: 20 }}>Activate your trial</h2>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '0.5px solid var(--border)', fontSize: 14 }}>
                <span style={{ color: 'var(--text2)' }}>Plan</span>
                <span style={{ fontWeight: 500 }}>{plan.name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '0.5px solid var(--border)', fontSize: 14 }}>
                <span style={{ color: 'var(--text2)' }}>Trial period</span>
                <span style={{ color: 'var(--green2)', fontWeight: 500 }}>7 days free</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '0.5px solid var(--border)', fontSize: 14 }}>
                <span style={{ color: 'var(--text2)' }}>After trial</span>
                <span>${plan.price}/mo</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 0 0', fontSize: 16, fontWeight: 500 }}>
                <span>You pay today</span>
                <span style={{ color: 'var(--green2)' }}>$0.00</span>
              </div>
            </div>
            {error && <div style={{ fontSize: 12, color: 'var(--red)', background: 'rgba(224,90,74,0.1)', padding: '8px 12px', borderRadius: 6, marginBottom: 14 }}>{error}</div>}
            <button onClick={handleCheckout} disabled={loading} style={{
              width: '100%', background: 'var(--green)', color: '#fff', border: 'none',
              padding: 14, borderRadius: 9, fontSize: 15, fontWeight: 500, cursor: 'pointer',
            }}>{loading ? 'Redirecting to Stripe...' : 'Activate 7-day free trial'}</button>
            <p style={{ fontSize: 11, color: 'var(--text3)', textAlign: 'center', marginTop: 12 }}>
              Secure payment via Stripe · You won't be charged until the trial ends
            </p>
          </div>
        )}
      </div>
    </>
  )
}
