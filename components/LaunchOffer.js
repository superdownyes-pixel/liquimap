import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'

// Promoção de lançamento: 60 dias a partir de 22/09/2026.
// Para mudar a data final sem mexer no código, crie NEXT_PUBLIC_LAUNCH_END na Vercel (ex.: 2026-11-21T23:59:59-05:00).
export const LAUNCH_END = process.env.NEXT_PUBLIC_LAUNCH_END || '2026-11-21T23:59:59-05:00'

function timeLeft() {
  const ms = new Date(LAUNCH_END).getTime() - Date.now()
  if (ms <= 0) return null
  return {
    d: Math.floor(ms / 86400000),
    h: Math.floor(ms / 3600000) % 24,
    m: Math.floor(ms / 60000) % 60,
    s: Math.floor(ms / 1000) % 60,
  }
}

function useCountdown() {
  // Começa vazio no servidor para não dar erro de hidratação; o relógio aparece no navegador
  const [left, setLeft] = useState(undefined)
  useEffect(() => {
    setLeft(timeLeft())
    const id = setInterval(() => setLeft(timeLeft()), 1000)
    return () => clearInterval(id)
  }, [])
  return left
}

const pad = n => String(n).padStart(2, '0')

const TXT = {
  pt: {
    tag: '🚀 OFERTA DE LANÇAMENTO',
    bar: 'Preços de lançamento a partir de $9/mês — só por tempo limitado',
    title: 'Preço de lançamento garantido para sempre',
    body: 'Assine durante os 60 dias de lançamento e mantenha o seu preço enquanto a assinatura estiver ativa — mesmo quando os valores subirem para novos clientes.',
    ends: 'A oferta termina em',
    units: ['dias', 'horas', 'min', 'seg'],
    cta: 'Garantir meu preço →',
    until: d => `Válido até ${d}`,
  },
  en: {
    tag: '🚀 LAUNCH OFFER',
    bar: 'Launch pricing from $9/mo — limited time only',
    title: 'Launch price locked in for life',
    body: 'Subscribe during the 60-day launch and keep your price for as long as your subscription stays active — even after prices go up for new customers.',
    ends: 'Offer ends in',
    units: ['days', 'hours', 'min', 'sec'],
    cta: 'Lock in my price →',
    until: d => `Valid until ${d}`,
  },
}

// variant="bar"  → faixa fixa no rodapé da tela (o menu do topo já é fixo)
// variant="card" → bloco grande com contagem regressiva (acima dos planos / no cadastro)
export default function LaunchOffer({ lang = 'pt', variant = 'card', showCta = true }) {
  const router = useRouter()
  const left = useCountdown()
  const t = TXT[lang] || TXT.pt
  if (left === null) return null // promoção acabou: some sozinha

  const endLabel = new Date(LAUNCH_END).toLocaleDateString(lang === 'pt' ? 'pt-BR' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' })

  if (variant === 'bar') {
    return (
      <>
      <div style={{ height: 44 }} />{/* espaço para a faixa fixa não cobrir o rodapé */}
      <div onClick={() => router.push('/#precos')} style={{
        position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 60, boxShadow: '0 -4px 20px rgba(0,0,0,0.4)',
        background: 'linear-gradient(90deg,#0f3d2a,#22c97a,#0f3d2a)', color: '#fff', textAlign: 'center',
        padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex',
        justifyContent: 'center', alignItems: 'center', gap: 10, flexWrap: 'wrap',
      }}>
        <span>{t.bar}</span>
        {left && <span style={{ background: 'rgba(0,0,0,0.35)', padding: '2px 10px', borderRadius: 6, fontVariantNumeric: 'tabular-nums' }}>
          ⏳ {left.d}d {pad(left.h)}:{pad(left.m)}:{pad(left.s)}
        </span>}
      </div>
      </>
    )
  }

  return (
    <div style={{
      background: 'linear-gradient(135deg,#0d1a12 0%,#0d1117 100%)', border: '1.5px solid #22c97a',
      borderRadius: 16, padding: '28px 24px', textAlign: 'center', boxShadow: '0 0 40px rgba(34,201,122,0.15)',
      maxWidth: 820, margin: '0 auto 40px',
    }}>
      <div style={{ display: 'inline-block', background: '#22c97a', color: '#000', fontSize: 11, fontWeight: 800, letterSpacing: 1, padding: '4px 12px', borderRadius: 20, marginBottom: 14 }}>
        {t.tag}
      </div>
      <div style={{ fontSize: 24, fontWeight: 700, color: '#fff', marginBottom: 8 }}>{t.title}</div>
      <p style={{ fontSize: 14, color: '#aaa', lineHeight: 1.6, maxWidth: 560, margin: '0 auto 20px' }}>{t.body}</p>

      <div style={{ fontSize: 12, color: '#22c97a', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>{t.ends}</div>
      <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 12 }}>
        {[left?.d, left?.h, left?.m, left?.s].map((v, i) => (
          <div key={i} style={{ background: '#0a0f0a', border: '0.5px solid #2a2f3a', borderRadius: 10, padding: '10px 0', width: 68 }}>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#fff', fontVariantNumeric: 'tabular-nums' }}>{v === undefined ? '--' : (i === 0 ? v : pad(v))}</div>
            <div style={{ fontSize: 10, color: '#666', textTransform: 'uppercase' }}>{t.units[i]}</div>
          </div>
        ))}
      </div>
      <div style={{ fontSize: 12, color: '#666', marginBottom: showCta ? 18 : 0 }}>{t.until(endLabel)}</div>

      {showCta && (
        <button onClick={() => router.push('/signup?plan=pro')} style={{
          background: '#22c97a', color: '#000', border: 'none', padding: '12px 28px', borderRadius: 10,
          fontSize: 15, fontWeight: 700, cursor: 'pointer',
        }}>{t.cta}</button>
      )}
    </div>
  )
}
