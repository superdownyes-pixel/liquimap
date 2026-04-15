import { useEffect, useRef, useState } from 'react'

const THEMES = {
  'BTC/USDT': { color: '#00f3ff', glow: 'rgba(0,243,255,0.5)',   bg: 'rgba(0,243,255,0.05)',   askColor: '#ff4444', askGlow: 'rgba(255,68,68,0.5)'   },
  'ETH/USDT': { color: '#bc13fe', glow: 'rgba(188,19,254,0.5)',  bg: 'rgba(188,19,254,0.05)',  askColor: '#ff6b35', askGlow: 'rgba(255,107,53,0.5)'  },
  'SOL/USDT': { color: '#00ff88', glow: 'rgba(0,255,136,0.5)',   bg: 'rgba(0,255,136,0.05)',   askColor: '#ff3366', askGlow: 'rgba(255,51,102,0.5)'  },
  'BNB/USDT': { color: '#f3ba2f', glow: 'rgba(243,186,47,0.5)',  bg: 'rgba(243,186,47,0.05)',  askColor: '#ff5500', askGlow: 'rgba(255,85,0,0.5)'    },
  'XRP/USDT': { color: '#346aa9', glow: 'rgba(52,106,169,0.5)',  bg: 'rgba(52,106,169,0.05)',  askColor: '#e03030', askGlow: 'rgba(224,48,48,0.5)'   },
}

const WHALE_THRESHOLD = 8

export default function HeatmapDemo({ symbol = 'BTC/USDT', height = 340 }) {
  const canvasRef = useRef(null)
  const rafRef    = useRef(null)
  const heatRef   = useRef([])

  const [buyPct, setBuyPct]       = useState(52)
  const [cvd, setCvd]             = useState(0)
  const [price, setPrice]         = useState(84320.5)
  const [largeLots, setLargeLots] = useState([])
  const [icebergs, setIcebergs]   = useState([])
  const [trades, setTrades]       = useState([])
  const [domRows, setDomRows]     = useState({ asks: [], bids: [] })

  const theme = THEMES[symbol] || THEMES['BTC/USDT']
  const fmt    = (n, d = 2) => Number(n).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d })
  const fmtVol = (n) => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : n.toFixed(2)

  useEffect(() => {
    let alive = true
    let tick  = 0
    let basePrice  = symbol === 'ETH/USDT' ? 3200 : symbol === 'SOL/USDT' ? 140 : 84320.5
    let cvdAcc     = 0

    function genBook(bp) {
      const asks = Array.from({ length: 14 }, (_, i) => ({
        price: bp + (i + 1) * (bp * 0.00008),
        size:  Math.abs(Math.sin(tick * 0.07 + i * 1.3) * 18 + Math.random() * 12 + 3)
      }))
      const bids = Array.from({ length: 14 }, (_, i) => ({
        price: bp - (i + 1) * (bp * 0.00008),
        size:  Math.abs(Math.sin(tick * 0.07 + i * 1.7 + 2) * 18 + Math.random() * 12 + 3)
      }))
      if (tick % 23 < 5) asks[2].size = 45 + Math.random() * 30
      if (tick % 31 < 4) bids[3].size = 55 + Math.random() * 25
      if (tick % 47 < 3) bids[1].size = 80 + Math.random() * 40
      return { asks, bids }
    }

    function simulate() {
      if (!alive) return
      tick++
      basePrice += (Math.random() - 0.495) * (symbol === 'SOL/USDT' ? 0.3 : symbol === 'ETH/USDT' ? 2 : 8)
      setPrice(parseFloat(basePrice.toFixed(1)))

      const bp = Math.round(50 + Math.sin(tick * 0.04) * 18 + (Math.random() - 0.5) * 8)
      setBuyPct(Math.max(20, Math.min(80, bp)))
      cvdAcc += (bp - 50) * 0.6 + (Math.random() - 0.5) * 4
      setCvd(cvdAcc)

      const book = genBook(basePrice)
      setDomRows(book)
      heatRef.current.push({ asks: book.asks.map(l => l.size), bids: book.bids.map(l => l.size) })
      if (heatRef.current.length > 120) heatRef.current.shift()

      if (tick % 3 === 0) {
        const isBuy = Math.random() > 0.48
        const qty   = Math.random() < 0.05 ? 5 + Math.random() * 15 : 0.01 + Math.random() * 0.8
        const t     = { time: new Date().toTimeString().slice(0, 8), price: basePrice + (Math.random() - 0.5) * 2, qty, isBuy }
        if (qty >= WHALE_THRESHOLD) setLargeLots(prev => [{ ...t }, ...prev].slice(0, 8))
        setTrades(prev => [t, ...prev].slice(0, 40))
      }
      if (tick % 37 === 0) {
        const side = Math.random() > 0.5 ? 'ask' : 'bid'
        setIcebergs(prev => [{ side, price: basePrice + (side === 'ask' ? 1 : -1) * (Math.random() * 50 + 10), size: 20 + Math.random() * 30 }, ...prev].slice(0, 8))
      }
    }

    const interval = setInterval(simulate, 180)
    return () => { alive = false; clearInterval(interval) }
  }, [symbol])

  useEffect(() => {
    let alive = true
    const t = THEMES[symbol] || THEMES['BTC/USDT']

    function draw() {
      const canvas = canvasRef.current
      if (!canvas) { rafRef.current = requestAnimationFrame(draw); return }
      const W = canvas.offsetWidth, H = height
      if (canvas.width !== W) canvas.width = W
      canvas.height = H
      const ctx = canvas.getContext('2d')

      // Dark bg
      ctx.fillStyle = '#060c0a'
      ctx.fillRect(0, 0, W, H)

      // Subtle grid
      ctx.strokeStyle = 'rgba(255,255,255,0.03)'
      ctx.lineWidth = 1
      for (let i = 1; i < 6; i++) {
        ctx.beginPath(); ctx.moveTo(W*i/6, 0); ctx.lineTo(W*i/6, H); ctx.stroke()
      }
      ctx.beginPath(); ctx.moveTo(0, H/2); ctx.lineTo(W, H/2); ctx.stroke()

      const hist = heatRef.current
      if (hist.length < 2) { rafRef.current = requestAnimationFrame(draw); return }

      const cols   = hist.length
      const LEVELS = 14
      const cellW  = W / cols
      const cellH  = (H / 2) / LEVELS

      let mx = 1
      hist.forEach(s => {
        s.asks.forEach(v => { if (v > mx) mx = v })
        s.bids.forEach(v => { if (v > mx) mx = v })
      })

      for (let c = 0; c < cols; c++) {
        const snap = hist[c]
        const isLatest = c === cols - 1

        for (let r = 0; r < LEVELS; r++) {
          // ── ASKS (top half) ──
          if (snap.asks[r] !== undefined) {
            const qty = snap.asks[r]
            const alpha = Math.min(qty / mx, 1)
            if (alpha > 0.04) {
              const isWhale = qty > WHALE_THRESHOLD * mx * 0.4

              if (isWhale && isLatest) {
                ctx.shadowBlur  = 12
                ctx.shadowColor = t.askGlow
              }

              // Color intensity: dim orange → bright red-white
              const R = Math.round(200 + 55 * alpha)
              const G = Math.round(50  * (1 - alpha) * alpha * 2)
              const B = Math.round(20  * (1 - alpha))
              ctx.fillStyle = `rgba(${R},${G},${B},${Math.pow(alpha, 0.4) * 0.9})`
              ctx.fillRect(c * cellW, r * cellH, cellW + 0.5, cellH + 0.5)

              if (isWhale && isLatest) ctx.shadowBlur = 0
            }
          }

          // ── BIDS (bottom half) — themed color ──
          if (snap.bids[r] !== undefined) {
            const qty = snap.bids[r]
            const alpha = Math.min(qty / mx, 1)
            if (alpha > 0.04) {
              const isWhale = qty > WHALE_THRESHOLD * mx * 0.4

              if (isWhale && isLatest) {
                ctx.shadowBlur  = 14
                ctx.shadowColor = t.glow
              }

              // Parse theme color and apply alpha
              const intensity = Math.pow(alpha, 0.38)
              ctx.fillStyle = hexToRgba(t.color, intensity * 0.88)
              ctx.fillRect(c * cellW, H / 2 + r * cellH, cellW + 0.5, cellH + 0.5)

              // Whale gets extra bright cell
              if (isWhale && isLatest) {
                ctx.fillStyle = hexToRgba(t.color, 0.95)
                ctx.fillRect(c * cellW - 1, H / 2 + r * cellH - 1, cellW + 2, cellH + 2)
                ctx.shadowBlur = 0
              }
            }
          }
        }
      }

      // Midline glow
      const grad = ctx.createLinearGradient(0, H/2-4, 0, H/2+4)
      grad.addColorStop(0, 'rgba(255,255,255,0.0)')
      grad.addColorStop(0.5, 'rgba(255,255,255,0.2)')
      grad.addColorStop(1, 'rgba(255,255,255,0.0)')
      ctx.fillStyle = grad
      ctx.fillRect(0, H/2-4, W, 8)

      // Labels with theme color
      ctx.shadowBlur = 6; ctx.shadowColor = t.askGlow
      ctx.fillStyle = t.askColor || '#ff5030'
      ctx.font = 'bold 10px sans-serif'
      ctx.fillText('ASKS', 8, 14)
      ctx.shadowBlur = 6; ctx.shadowColor = t.glow
      ctx.fillStyle = t.color
      ctx.fillText('BIDS', 8, H/2 + 14)
      ctx.shadowBlur = 0
      ctx.fillStyle = 'rgba(255,255,255,0.2)'
      ctx.font = '10px sans-serif'
      ctx.fillText('recent →', W - 65, H - 5)

      rafRef.current = requestAnimationFrame(draw)
    }
    rafRef.current = requestAnimationFrame(draw)
    return () => { alive = false; cancelAnimationFrame(rafRef.current) }
  }, [symbol, height])

  function hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1,3),16)
    const g = parseInt(hex.slice(3,5),16)
    const b = parseInt(hex.slice(5,7),16)
    return `rgba(${r},${g},${b},${alpha})`
  }

  const sellPct  = 100 - buyPct
  const cvdColor = cvd >= 0 ? theme.color : '#ff4444'
  const maxSize  = Math.max(...domRows.asks.map(l => l?.size||0), ...domRows.bids.map(l => l?.size||0), 1)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', background: '#060c0a', borderRadius: 12, overflow: 'hidden', border: `0.5px solid ${theme.color}33` }}>

      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 14px', borderBottom: `0.5px solid ${theme.color}22`, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="dot-live" style={{ background: theme.color, boxShadow: `0 0 6px ${theme.glow}` }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: theme.color, textShadow: `0 0 8px ${theme.glow}` }}>{symbol}</span>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Order Book Heatmap</span>
          <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 4, background: `${theme.color}18`, color: theme.color, border: `0.5px solid ${theme.color}44` }}>DEMO</span>
        </div>
        <span style={{ fontSize: 16, fontWeight: 700, color: theme.color, textShadow: `0 0 10px ${theme.glow}` }}>${fmt(price)}</span>
      </div>

      {/* Flow Indicators */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', borderBottom: `0.5px solid ${theme.color}15`, background: '#060c0a' }}>
        <div style={{ padding: '8px 14px', borderRight: `0.5px solid ${theme.color}15` }}>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', marginBottom: 5, letterSpacing: 0.5 }}>PRESSÃO COMPRA/VENDA</div>
          <div style={{ display: 'flex', gap: 4, alignItems: 'center', marginBottom: 4 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: theme.color }}>{buyPct}%</span>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>buy</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#ff4444', marginLeft: 4 }}>{sellPct}%</span>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>sell</span>
          </div>
          <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.06)', overflow: 'hidden', display: 'flex' }}>
            <div style={{ width: `${buyPct}%`, background: theme.color, boxShadow: `0 0 6px ${theme.glow}`, transition: 'width 0.4s' }} />
            <div style={{ width: `${sellPct}%`, background: '#ff4444', transition: 'width 0.4s' }} />
          </div>
        </div>
        <div style={{ padding: '8px 14px', borderRight: `0.5px solid ${theme.color}15` }}>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', marginBottom: 5, letterSpacing: 0.5 }}>CVD — DELTA ACUMULADO</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: cvdColor, textShadow: `0 0 8px ${cvd>=0 ? theme.glow : 'rgba(255,68,68,0.5)'}` }}>
            {cvd >= 0 ? '+' : ''}{fmtVol(Math.abs(cvd))}
          </div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{cvd >= 0 ? '▲ Compradores dominam' : '▼ Vendedores dominam'}</div>
        </div>
        <div style={{ padding: '8px 14px', borderRight: `0.5px solid ${theme.color}15` }}>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', marginBottom: 5, letterSpacing: 0.5 }}>GRANDES PLAYERS 🐋</div>
          {largeLots.length === 0
            ? <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>Aguardando lotes...</div>
            : largeLots.slice(0, 3).map((t, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2 }}>
                <span style={{ fontSize: 10, color: t.isBuy ? theme.color : '#ff4444', fontWeight: 600 }}>{t.isBuy ? '▲' : '▼'}</span>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)' }}>${fmt(t.price, 0)}</span>
                <span style={{ fontSize: 10, color: '#e0a84a', fontWeight: 600 }}>{t.qty.toFixed(2)}</span>
              </div>
            ))}
        </div>
        <div style={{ padding: '8px 14px' }}>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', marginBottom: 5, letterSpacing: 0.5 }}>ICEBERG DETECTOR 🧊</div>
          {icebergs.length === 0
            ? <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>Monitorando...</div>
            : icebergs.slice(0, 3).map((ic, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2 }}>
                <span style={{ fontSize: 10, color: '#e0a84a', fontWeight: 600 }}>🧊 {ic.side.toUpperCase()}</span>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)' }}>${fmt(ic.price, 0)}</span>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>{ic.size.toFixed(2)}</span>
              </div>
            ))}
        </div>
      </div>

      {/* Heatmap + DOM */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 210px' }}>
        <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height }} />
        <div style={{ borderLeft: `0.5px solid ${theme.color}18`, display: 'flex', flexDirection: 'column', background: '#060c0a' }}>
          <div style={{ padding: '6px 10px', borderBottom: `0.5px solid ${theme.color}18`, fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>DOM — Level 2</div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {[...domRows.asks].reverse().map((l, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '80px 1fr 44px', padding: '2px 8px', alignItems: 'center' }}>
                <span style={{ fontSize: 10, color: '#ff6050' }}>${fmt(l.price, 0)}</span>
                <div style={{ height: 8, background: 'rgba(255,255,255,0.04)', borderRadius: 2, overflow: 'hidden', margin: '0 4px' }}>
                  <div style={{ height: '100%', width: `${Math.round(l.size/maxSize*100)}%`, background: '#ff4030', opacity: 0.8, borderRadius: 2, transition: 'width 0.3s' }} />
                </div>
                <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', textAlign: 'right' }}>{l.size.toFixed(1)}</span>
              </div>
            ))}
            <div style={{ padding: '3px 8px', background: `${theme.color}08`, fontSize: 10, color: theme.color, textAlign: 'center', borderTop: `0.5px solid ${theme.color}18`, borderBottom: `0.5px solid ${theme.color}18` }}>
              Spread: ${domRows.asks[0] && domRows.bids[0] ? fmt(domRows.asks[0].price - domRows.bids[0].price, 1) : '—'}
            </div>
            {domRows.bids.map((l, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '80px 1fr 44px', padding: '2px 8px', alignItems: 'center' }}>
                <span style={{ fontSize: 10, color: theme.color }}>${fmt(l.price, 0)}</span>
                <div style={{ height: 8, background: 'rgba(255,255,255,0.04)', borderRadius: 2, overflow: 'hidden', margin: '0 4px' }}>
                  <div style={{ height: '100%', width: `${Math.round(l.size/maxSize*100)}%`, background: theme.color, opacity: 0.75, borderRadius: 2, transition: 'width 0.3s', boxShadow: `0 0 4px ${theme.glow}` }} />
                </div>
                <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', textAlign: 'right' }}>{l.size.toFixed(1)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Trades tape */}
      <div style={{ borderTop: `0.5px solid ${theme.color}15`, maxHeight: 120, overflowY: 'auto', background: '#060c0a' }}>
        <div style={{ padding: '4px 12px', fontSize: 10, color: 'rgba(255,255,255,0.3)', borderBottom: `0.5px solid ${theme.color}15` }}>Live trades</div>
        {trades.map((t, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '60px 1fr 80px 60px 24px', padding: '3px 12px', fontSize: 11, borderBottom: 'rgba(255,255,255,0.03) solid 0.5px', background: t.qty >= WHALE_THRESHOLD ? (t.isBuy ? `${theme.color}08` : 'rgba(255,68,68,0.06)') : 'transparent' }}>
            <span style={{ color: 'rgba(255,255,255,0.3)' }}>{t.time}</span>
            <span style={{ fontWeight: 600, color: t.isBuy ? theme.color : '#ff4444', textShadow: t.qty >= WHALE_THRESHOLD ? (t.isBuy ? `0 0 6px ${theme.glow}` : '0 0 6px rgba(255,68,68,0.5)') : 'none' }}>${fmt(t.price, 0)}</span>
            <span style={{ textAlign: 'right', color: 'rgba(255,255,255,0.5)' }}>{t.qty.toFixed(3)}</span>
            <span style={{ textAlign: 'right', color: t.isBuy ? theme.color : '#ff4444' }}>{t.isBuy ? 'BUY' : 'SELL'}</span>
            <span style={{ textAlign: 'right', fontSize: 9 }}>{t.qty >= WHALE_THRESHOLD ? '🐋' : ''}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
