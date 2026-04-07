import { useApp } from '../pages/_app'
import { translations } from '../lib/i18n'
import { useRouter } from 'next/router'

export default function Navbar() {
  const { lang, setLang, user } = useApp()
  const t = translations[lang].nav
  const router = useRouter()

  return (
    <nav style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '14px 32px', borderBottom: '0.5px solid var(--border)',
      background: 'var(--bg)', position: 'sticky', top: 0, zIndex: 100,
    }}>
      <div
        onClick={() => router.push('/')}
        style={{ fontSize: 18, fontWeight: 500, color: 'var(--text)', cursor: 'pointer', letterSpacing: '-0.5px' }}
      >
        Flow<span style={{ color: 'var(--green2)' }}>Map</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
        {['features', 'pricing', 'compare'].map(k => (
          <span key={k} style={{ fontSize: 13, color: 'var(--text2)', cursor: 'pointer' }}
            onMouseEnter={e => e.target.style.color = 'var(--text)'}
            onMouseLeave={e => e.target.style.color = 'var(--text2)'}
          >{t[k]}</span>
        ))}

        {/* Language toggle */}
        <div style={{ display: 'flex', background: 'var(--bg3)', border: '0.5px solid var(--border2)', borderRadius: 6, padding: '3px 5px', gap: 2 }}>
          {['en', 'pt'].map(l => (
            <button key={l} onClick={() => setLang(l)} style={{
              fontSize: 11, padding: '3px 8px', borderRadius: 4, border: 'none', cursor: 'pointer',
              background: lang === l ? 'var(--green3)' : 'transparent',
              color: lang === l ? 'var(--green2)' : 'var(--text2)',
              fontWeight: lang === l ? 500 : 400,
            }}>{l.toUpperCase()}</button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {user ? (
          <button onClick={() => router.push('/dashboard')} style={{
            background: 'var(--green)', color: '#fff', border: 'none',
            padding: '8px 18px', borderRadius: 7, fontSize: 13, fontWeight: 500, cursor: 'pointer',
          }}>Dashboard</button>
        ) : (
          <>
            <button onClick={() => router.push('/login')} style={{
              background: 'transparent', color: 'var(--text2)', border: '0.5px solid var(--border2)',
              padding: '7px 16px', borderRadius: 7, fontSize: 13, cursor: 'pointer',
            }}>{t.login}</button>
            <button onClick={() => router.push('/signup')} style={{
              background: 'var(--green)', color: '#fff', border: 'none',
              padding: '8px 18px', borderRadius: 7, fontSize: 13, fontWeight: 500, cursor: 'pointer',
            }}>{t.cta}</button>
          </>
        )}
      </div>
    </nav>
  )
}
