import { useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabase'
import { useApp } from './_app'
import { translations } from '../lib/i18n'
import Head from 'next/head'

export default function Login() {
  const { lang } = useApp()
  const t = translations[lang].auth
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true); setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false); return }
    router.push('/dashboard')
  }

  const inputStyle = {
    width: '100%', padding: '10px 14px', borderRadius: 8, fontSize: 14,
    background: 'var(--bg3)', border: '0.5px solid var(--border2)',
    color: 'var(--text)', outline: 'none',
  }

  return (
    <>
      <Head><title>Log in — LiquiMap</title></Head>
      <div style={{ background: 'var(--bg)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ width: '100%', maxWidth: 400 }}>
          <div onClick={() => router.push('/')} style={{ fontSize: 20, fontWeight: 500, textAlign: 'center', marginBottom: 32, cursor: 'pointer' }}>
            Liqui<span style={{ color: 'var(--green2)' }}>Map</span>
          </div>
          <div style={{ background: 'var(--bg2)', border: '0.5px solid var(--border)', borderRadius: 14, padding: 32 }}>
            <h1 style={{ fontSize: 20, fontWeight: 500, marginBottom: 4 }}>{t.loginTitle}</h1>
            <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 24 }}>{t.loginSub}</p>
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 5 }}>{t.email}</label>
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} placeholder="you@email.com" />
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 5 }}>{t.password}</label>
                <input type="password" required value={password} onChange={e => setPassword(e.target.value)} style={inputStyle} placeholder="••••••••" />
              </div>
              {error && <div style={{ fontSize: 12, color: 'var(--red)', background: 'rgba(224,90,74,0.1)', padding: '8px 12px', borderRadius: 6 }}>{error}</div>}
              <button type="submit" disabled={loading} style={{
                background: 'var(--green)', color: '#fff', border: 'none',
                padding: 12, borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: 'pointer', marginTop: 4,
              }}>{loading ? 'Loading...' : t.loginBtn}</button>
              <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--text2)' }}>
                {t.noAccount} <span onClick={() => router.push('/signup')} style={{ color: 'var(--green2)', cursor: 'pointer' }}>{t.signUp}</span>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}
