import '../styles/globals.css'
import { useState, useEffect, createContext, useContext } from 'react'
import { supabase } from '../lib/supabase'
import { detectLang } from '../lib/i18n'

export const AppContext = createContext({})

export function useApp() {
  return useContext(AppContext)
}

export default function App({ Component, pageProps }) {
  const [user, setUser] = useState(null)
  const [lang, setLangState] = useState('en')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLangState(detectLang())
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  const setLang = (l) => setLangState(l)

  if (loading) return (
    <div style={{ background: '#0a0f0a', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="dot-live" />
    </div>
  )

  return (
    <AppContext.Provider value={{ user, lang, setLang }}>
      <Component {...pageProps} />
    </AppContext.Provider>
  )
}
