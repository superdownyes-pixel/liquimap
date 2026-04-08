import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'

// ─── Mini Heatmap para a página demo ───────────────────────────────────────
const SYMBOLS_MAP = {
  'BTC/USDT': 'btcusdt',
  'ETH/USDT': 'ethusdt',
  'SOL/USDT': 'solusdt',
}

function fmtSize(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K'
  if (n >= 100) return n.toFixed(0)
  return n.toFixed(2)
}
function fmtPrice(n, d = 2) {
  return Number(n).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d })
}

function MiniHeatmap({ symbol, activeStep }) {
  const canvasRef = useRef(null)
  const heatRef   = useRef([])
  const wsDepth   = useRef(null)
  const wsTrades  = useRef(null)
  const rafRef    = useRef(null)
  const [price, setPrice]     = useState(null)
  const [prevPrice, setPrev]  = useState(null)
  const [status, setStatus]   = useState('connecting')
  const [domRows, setDomRows] = useState({ asks: [], bids: [] })
  const [trades, setTrades]   = useState([])
  const [largeLots, setLargeLots] = useState([])
  const [icebergs, setIcebergs]   = useState([])
  const prevBookRef = useRef({ asks: [], bids: [] })
  const sym = SYMBOLS_MAP[symbol] || 'btcusdt'
  const HEIGHT = 200

  useEffect(() => {
    let alive = true
    function connect() {
      if (!alive) return
      setStatus('connecting')
      const wd = new WebSocket(`wss://stream.binance.com:9443/ws/${sym}@depth20@100ms`)
      wsDepth.current = wd
      wd.onopen = () => alive && setStatus('live')
      wd.onerror = () => alive && setStatus('error')
      wd.onclose = () => alive && setTimeout(connect, 3000)
      wd.onmessage = (e) => {
        if (!alive) return
        const d = JSON.parse(e.data)
        const asks = d.asks.slice(0, 10).map(([p, q]) => ({ price: +p, size: +q })).sort((a, b) => a.price - b.price)
        const bids = d.bids.slice(0, 10).map(([p, q]) => ({ price: +p, size: +q })).sort((a, b) => b.price - a.price)
        setDomRows({ asks, bids })

        // Large lots
        const allSizes = [...asks, ...bids].map(l => l.size)
        const sorted = [...allSizes].sort((a, b) => b - a)
        const threshold = sorted[Math.floor(sorted.length * 0.2)] || 0
        const large = [...asks.map(l => ({ ...l, side: 'ask' })), ...bids.map(l => ({ ...l, side: 'bid' }))]
          .filter(l => l.size >= threshold * 1.5)
        if (large.length > 0) {
          setLargeLots(prev => {
            const now = Date.now()
            return [...large.map(l => ({ ...l, time: now })), ...prev.filter(l => now - l.time < 6000)].slice(0, 4)
          })
        }

        // Icebergs
        const prev = prevBookRef.current
        const newIce = []
        asks.forEach(ask => {
          const p = prev.asks.find(a => Math.abs(a.price - ask.price) < 0.01)
          if (p && ask.size > p.size * 1.4 && ask.size > threshold) newIce.push({ ...ask, side: 'ask' })
        })
        bids.forEach(bid => {
          const p = prev.bids.find(b => Math.abs(b.price - bid.price) < 0.01)
          if (p && bid.size > p.size * 1.4 && bid.size > threshold) newIce.push({ ...bid, side: 'bid' })
        })
        if (newIce.length > 0) {
          setIcebergs(prev => {
            const now = Date.now()
            return [...newIce.map(i => ({ ...i, time: now })), ...prev.filter(i => now - i.time < 4000)].slice(0, 3)
          })
        }
        prevBookRef.current = { asks, bids }

        const snap = { asks: asks.map(l => l.size), bids: bids.map(l => l.size) }
        heatRef.current.push(snap)
        if (heatRef.current.length > 80) heatRef.current.shift()
      }

      const wt = new WebSocket(`wss://stream.binance.com:9443/ws/${sym}@aggTrade`)
      wsTrades.current = wt
      wt.onmessage = (e) => {
        if (!alive) return
        const d = JSON.parse(e.data)
        setPrice(prev => { setPrev(prev); return +d.p })
        setTrades(prev => [{
          price: +d.p, qty: +d.q,
          value: +d.p * +d.q,
          isBuy: !d.m,
          time: new Date().toTimeString().slice(0, 8),
        }, ...prev].slice(0, 30))
      }
    }
    connect()

    function draw() {
      const canvas = canvasRef.current
      if (!canvas) { rafRef.current = requestAnimationFrame(draw); return }
      const W = canvas.offsetWidth
      const H = HEIGHT
      if (canvas.width !== W) canvas.width = W
      canvas.height = H
      const ctx = canvas.getContext('2d')
      ctx.clearRect(0, 0, W, H)
      const hist = heatRef.current
      if (hist.length < 2) { rafRef.current = requestAnimationFrame(draw); return }
      const cols = hist.length
      const LEVELS = hist[0].asks.length || 10
      const cellW = W / cols
      const cellH = (H / 2) / LEVELS
      let mx = 1
      hist.forEach(s => { s.asks.forEach(v => { if (v > mx) mx = v }); s.bids.forEach(v => { if (v > mx) mx = v }) })
      for (let c = 0; c < cols; c++) {
        const snap = hist[c]
        for (let r = 0; r < LEVELS; r++) {
          const ai = snap.asks[r] !== undefined ? snap.asks[r] / mx : 0
          ctx.fillStyle = `rgba(224,90,74,${Math.pow(ai, 0.5)})`
          ctx.fillRect(c * cellW, r * cellH, cellW + 1, cellH + 1)
          const bi = snap.bids[r] !== undefined ? snap.bids[r] / mx : 0
          ctx.fillStyle = `rgba(34,201,122,${Math.pow(bi, 0.5)})`
          ctx.fillRect(c * cellW, H / 2 + r * cellH, cellW + 1, cellH + 1)
        }
      }
      ctx.fillStyle = 'rgba(255,255,255,0.15)'
      ctx.fillRect(0, H / 2 - 1, W, 2)
      rafRef.current = requestAnimationFrame(draw)
    }
    rafRef.current = requestAnimationFrame(draw)
    return () => {
      alive = false
      cancelAnimationFrame(rafRef.current)
      try { wsDepth.current?.close() } catch (_) {}
      try { wsTrades.current?.close() } catch (_) {}
    }
  }, [sym])

  const maxSize = Math.max(...domRows.asks.map(l => l.size), ...domRows.bids.map(l => l.size), 1)
  const priceUp = price && prevPrice ? price >= prevPrice : true

  return (
    <div style={{ background: '#0d1117', border: '0.5px solid #2a2f3a', borderRadius: 10, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 12px', borderBottom: '0.5px solid #2a2f3a' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: status === 'live' ? '#22c97a' : '#e0a84a' }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{symbol}</span>
          <span style={{ fontSize: 10, color: '#666' }}>ao vivo</span>
        </div>
        <span style={{ fontSize: 15, fontWeight: 600, color: priceUp ? '#22c97a' : '#e05a4a' }}>
          {price ? `$${fmtPrice(price)}` : '—'}
        </span>
      </div>

      {/* Alertas */}
      {(largeLots.length > 0 || icebergs.length > 0) && (
        <div style={{ display: 'flex', gap: 5, padding: '4px 10px', borderBottom: '0.5px solid #2a2f3a', flexWrap: 'wrap' }}>
          {icebergs.slice(0, 2).map((ice, i) => (
            <span key={i} style={{ fontSize: 9, padding: '1px 6px', borderRadius: 3, background: ice.side === 'ask' ? 'rgba(224,90,74,0.2)' : 'rgba(34,201,122,0.2)', color: ice.side === 'ask' ? '#e05a4a' : '#22c97a' }}>
              🧊 ICEBERG {fmtSize(ice.size)}
            </span>
          ))}
          {largeLots.slice(0, 2).map((lot, i) => (
            <span key={i} style={{ fontSize: 9, padding: '1px 6px', borderRadius: 3, background: lot.side === 'ask' ? 'rgba(224,90,74,0.15)' : 'rgba(34,201,122,0.15)', color: lot.side === 'ask' ? '#e05a4a' : '#22c97a' }}>
              🐋 {fmtSize(lot.size)} @ ${fmtPrice(lot.price)}
            </span>
          ))}
        </div>
      )}

      {/* Heatmap + DOM */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px' }}>
        <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: HEIGHT }} />
        <div style={{ borderLeft: '0.5px solid #2a2f3a', overflowY: 'auto', maxHeight: HEIGHT }}>
          {[...domRows.asks].reverse().map((l, i) => {
            const isLarge = l.size >= maxSize * 0.5
            return (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 44px', padding: '1px 6px', alignItems: 'center', background: isLarge ? 'rgba(224,90,74,0.08)' : 'transparent', borderLeft: isLarge ? '2px solid #e05a4a' : '2px solid transparent' }}>
                <span style={{ fontSize: 9, color: '#e05a4a', fontWeight: isLarge ? 600 : 400 }}>${fmtPrice(l.price)}</span>
                <span style={{ fontSize: 9, color: isLarge ? '#e05a4a' : '#555', textAlign: 'right', fontWeight: isLarge ? 600 : 400 }}>{fmtSize(l.size)}</span>
              </div>
            )
          })}
          <div style={{ padding: '2px 6px', background: '#1a1f2a', fontSize: 9, color: '#666', textAlign: 'center', borderTop: '0.5px solid #2a2f3a', borderBottom: '0.5px solid #2a2f3a' }}>
            spread ${domRows.asks[0] && domRows.bids[0] ? fmtPrice(domRows.asks[0].price - domRows.bids[0].price) : '—'}
          </div>
          {domRows.bids.map((l, i) => {
            const isLarge = l.size >= maxSize * 0.5
            return (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 44px', padding: '1px 6px', alignItems: 'center', background: isLarge ? 'rgba(34,201,122,0.08)' : 'transparent', borderLeft: isLarge ? '2px solid #22c97a' : '2px solid transparent' }}>
                <span style={{ fontSize: 9, color: '#22c97a', fontWeight: isLarge ? 600 : 400 }}>${fmtPrice(l.price)}</span>
                <span style={{ fontSize: 9, color: isLarge ? '#22c97a' : '#555', textAlign: 'right', fontWeight: isLarge ? 600 : 400 }}>{fmtSize(l.size)}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Trades com volume dots */}
      <div style={{ borderTop: '0.5px solid #2a2f3a', maxHeight: 90, overflowY: 'auto' }}>
        {trades.slice(0, 12).map((t, i) => {
          const maxVal = Math.max(...trades.map(tr => tr.value), 1)
          const dotSize = Math.max(5, Math.min(12, (t.value / maxVal) * 12))
          return (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '50px 1fr 50px 36px', padding: '2px 8px', fontSize: 10, borderBottom: '0.5px solid #1a1f2a' }}>
              <span style={{ color: '#444' }}>{t.time}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: dotSize, height: dotSize, borderRadius: '50%', background: t.isBuy ? '#22c97a' : '#e05a4a', opacity: 0.9, flexShrink: 0 }} />
                <span style={{ color: t.isBuy ? '#22c97a' : '#e05a4a', fontWeight: 500 }}>${fmtPrice(t.price)}</span>
              </div>
              <span style={{ textAlign: 'right', color: '#555', fontSize: 9 }}>{t.value >= 1000 ? `$${fmtSize(t.value)}` : `$${t.value.toFixed(0)}`}</span>
              <span style={{ textAlign: 'right', color: t.isBuy ? '#22c97a' : '#e05a4a', fontSize: 9, fontWeight: 600 }}>{t.isBuy ? 'BUY' : 'SELL'}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Tour steps ─────────────────────────────────────────────────────────────
const TOUR_STEPS = [
  {
    title: '🌡️ Mapa de Calor do Livro de Ordens',
    description: 'As cores mostram onde a liquidez está concentrada. Quanto mais intensa a cor, maior o volume de ordens naquele nível de preço. Vermelho = vendedores. Verde = compradores.',
    highlight: 'heatmap',
  },
  {
    title: '🐋 Large Lot Tracker — Rastreie os Grandes Players',
    description: 'Quando uma ordem grande aparece no livro, o LiquiMap a destaca automaticamente com borda colorida e alerta. Isso mostra onde instituições e grandes traders estão posicionados.',
    highlight: 'largelot',
  },
  {
    title: '🧊 Iceberg Detection — Ordens Ocultas',
    description: 'Ordens iceberg são grandes ordens disfarçadas como pequenas. Quando o LiquiMap detecta que um nível foi reabastecido rapidamente, ele alerta com o ícone 🧊. O Bookmap cobra extra por isso.',
    highlight: 'iceberg',
  },
  {
    title: '⚫ Volume Dots — Tamanho de Cada Trade',
    description: 'Cada trade executado aparece como uma bolinha no tape. Quanto maior a bolinha, maior o valor do trade em USD. Bolinhas grandes = grandes players movendo o mercado.',
    highlight: 'volumedots',
  },
  {
    title: '📊 DOM — Profundidade de Mercado com Lotes',
    description: 'O livro de ordens mostra o tamanho de cada nível em tempo real. Ordens grandes ficam destacadas em negrito com borda colorida. Você vê exatamente quanto está sendo ofertado em cada preço.',
    highlight: 'dom',
  },
  {
    title: '✅ Tudo isso por $29/mês — tudo incluído',
    description: 'O Bookmap cobra $49 de software + $79 de feed de dados + $70 de VPS = $198/mês. O LiquiMap oferece tudo isso por $29/mês no plano Starter, sem instalar nada, direto no browser.',
    highlight: 'pricing',
    isCTA: true,
  },
]

// ─── Página Demo ─────────────────────────────────────────────────────────────
export default function DemoPage() {
  const [step, setStep] = useState(0)
  const [autoPlay, setAutoPlay] = useState(true)

  // Auto avança o tour
  useEffect(() => {
    if (!autoPlay) return
    if (step >= TOUR_STEPS.length - 1) return
    const t = setTimeout(() => setStep(s => s + 1), 6000)
    return () => clearTimeout(t)
  }, [step, autoPlay])

  const currentStep = TOUR_STEPS[step]

  return (
    <div style={{ minHeight: '100vh', background: '#080c10', color: '#fff', fontFamily: 'var(--font-sans, system-ui, sans-serif)' }}>

      {/* Nav */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 24px', borderBottom: '0.5px solid #2a2f3a' }}>
        <Link href="/" style={{ fontSize: 18, fontWeight: 700, color: '#22c97a', textDecoration: 'none', letterSpacing: '-0.5px' }}>
          LiquiMap
        </Link>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: '#666' }}>Demonstração ao vivo</span>
          <Link href="/signup" style={{ fontSize: 13, fontWeight: 600, padding: '8px 20px', borderRadius: 8, background: '#22c97a', color: '#000', textDecoration: 'none' }}>
            Começar grátis →
          </Link>
        </div>
      </div>

      {/* Hero */}
      <div style={{ textAlign: 'center', padding: '32px 24px 24px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(34,201,122,0.1)', border: '0.5px solid rgba(34,201,122,0.3)', borderRadius: 20, padding: '4px 14px', marginBottom: 16 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c97a', animation: 'pulse 1.5s infinite' }} />
          <span style={{ fontSize: 12, color: '#22c97a' }}>Dados ao vivo — BTC, ETH, SOL</span>
        </div>
        <h1 style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-1px', margin: '0 0 10px', lineHeight: 1.2 }}>
          Veja a <span style={{ color: '#22c97a' }}>liquidez</span> em tempo real
        </h1>
        <p style={{ fontSize: 15, color: '#888', maxWidth: 540, margin: '0 auto' }}>
          O mesmo que o Bookmap faz. Metade do preço. No seu navegador. Sem instalar nada.
        </p>
      </div>

      {/* Tour guide */}
      <div style={{ maxWidth: 900, margin: '0 auto 20px', padding: '0 16px' }}>
        <div style={{ background: currentStep.isCTA ? 'rgba(34,201,122,0.08)' : '#0d1117', border: `1px solid ${currentStep.isCTA ? '#22c97a' : '#2a2f3a'}`, borderRadius: 12, padding: '18px 22px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 260 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <span style={{ fontSize: 10, color: '#555', background: '#1a1f2a', padding: '2px 8px', borderRadius: 10 }}>
                  {step + 1} / {TOUR_STEPS.length}
                </span>
                <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0, color: currentStep.isCTA ? '#22c97a' : '#fff' }}>
                  {currentStep.title}
                </h2>
              </div>
              <p style={{ fontSize: 13, color: '#999', margin: 0, lineHeight: 1.6 }}>
                {currentStep.description}
              </p>
            </div>
            {currentStep.isCTA && (
              <Link href="/signup" style={{ fontSize: 14, fontWeight: 700, padding: '12px 28px', borderRadius: 10, background: '#22c97a', color: '#000', textDecoration: 'none', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6 }}>
                Começar 7 dias grátis →
              </Link>
            )}
          </div>

          {/* Progress bar */}
          <div style={{ marginTop: 14, display: 'flex', gap: 5, alignItems: 'center' }}>
            {TOUR_STEPS.map((_, i) => (
              <div
                key={i}
                onClick={() => { setStep(i); setAutoPlay(false) }}
                style={{ flex: 1, height: 3, borderRadius: 2, cursor: 'pointer', background: i <= step ? '#22c97a' : '#2a2f3a', transition: 'background 0.3s' }}
              />
            ))}
            <button
              onClick={() => setAutoPlay(v => !v)}
              style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, border: '0.5px solid #2a2f3a', background: autoPlay ? 'rgba(34,201,122,0.15)' : '#1a1f2a', color: autoPlay ? '#22c97a' : '#666', cursor: 'pointer', marginLeft: 6, whiteSpace: 'nowrap' }}
            >
              {autoPlay ? '⏸ Pausar' : '▶ Auto'}
            </button>
          </div>

          {/* Botões de navegação */}
          <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
            <button onClick={() => { setStep(s => Math.max(0, s - 1)); setAutoPlay(false) }} disabled={step === 0} style={{ fontSize: 12, padding: '5px 14px', borderRadius: 6, border: '0.5px solid #2a2f3a', background: '#1a1f2a', color: step === 0 ? '#444' : '#fff', cursor: step === 0 ? 'default' : 'pointer' }}>
              ← Anterior
            </button>
            <button onClick={() => { setStep(s => Math.min(TOUR_STEPS.length - 1, s + 1)); setAutoPlay(false) }} disabled={step === TOUR_STEPS.length - 1} style={{ fontSize: 12, padding: '5px 14px', borderRadius: 6, border: '0.5px solid #2a2f3a', background: '#1a1f2a', color: step === TOUR_STEPS.length - 1 ? '#444' : '#fff', cursor: step === TOUR_STEPS.length - 1 ? 'default' : 'pointer' }}>
              Próximo →
            </button>
          </div>
        </div>
      </div>

      {/* 3 Heatmaps ao vivo */}
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 16px 40px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 16 }}>
        {Object.keys(SYMBOLS_MAP).map(sym => (
          <MiniHeatmap key={sym} symbol={sym} activeStep={currentStep.highlight} />
        ))}
      </div>

      {/* CTA final */}
      <div style={{ textAlign: 'center', padding: '32px 24px 48px', borderTop: '0.5px solid #2a2f3a' }}>
        <h2 style={{ fontSize: 26, fontWeight: 700, marginBottom: 10, letterSpacing: '-0.5px' }}>
          Pronto para operar com informação real?
        </h2>
        <p style={{ fontSize: 14, color: '#888', marginBottom: 24 }}>
          7 dias grátis. Sem cartão de crédito. Cancele quando quiser.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/signup" style={{ fontSize: 15, fontWeight: 700, padding: '14px 36px', borderRadius: 10, background: '#22c97a', color: '#000', textDecoration: 'none' }}>
            Começar 7 dias grátis →
          </Link>
          <Link href="/" style={{ fontSize: 15, fontWeight: 500, padding: '14px 28px', borderRadius: 10, border: '0.5px solid #2a2f3a', color: '#888', textDecoration: 'none' }}>
            Ver planos
          </Link>
        </div>
        <p style={{ fontSize: 12, color: '#555', marginTop: 16 }}>
          Starter $29/mês · Pro $59/mês · Full $99/mês — tudo incluído
        </p>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: #0d1117; }
        ::-webkit-scrollbar-thumb { background: #2a2f3a; border-radius: 2px; }
      `}</style>
    </div>
  )
}
 
 
