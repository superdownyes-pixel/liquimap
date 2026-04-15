import { useEffect, useRef, useState } from 'react'

// Simulated demo heatmap — looks exactly like real data
export default function HeatmapDemo({ height = 380 }) {
  const canvasRef = useRef(null)
  const rafRef    = useRef(null)
  const heatRef   = useRef([])
  const tickRef   = useRef(0)

  const [buyPct, setBuyPct]   = useState(52)
  const [cvd, setCvd]         = useState(0)
  const [price, setPrice]     = useState(84320.5)
  const [largeLots, setLargeLots] = useState([])
  const [icebergs, setIcebergs]   = useState([])
  const [trades, setTrades]       = useState([])
  const [domRows, setDomRows]     = useState({ asks: [], bids: [] })

  const fmt    = (n, d = 2) => Number(n).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d })
  const fmtVol = (n) => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : n.toFixed(2)

  useEffect(() => {
    let alive   = true
    let tick    = 0
    let basePrice = 84320.5
    let cvdAcc  = 0
    let buyVolAcc  = 0
    let sellVolAcc = 0

    // Generate realistic order book levels
    function genBook(bp) {
      const asks = Array.from({ length: 14 }, (_, i) => ({
        price: bp + (i + 1) * (bp * 0.00008),
        size:  Math.abs(Math.sin((tick * 0.07 + i * 1.3)) * 18 + Math.random() * 12 + 3)
      }))
      const bids = Array.from({ length: 14 }, (_, i) => ({
        price: bp - (i + 1) * (bp * 0.00008),
        size:  Math.abs(Math.sin((tick * 0.07 + i * 1.7 + 2)) * 18 + Math.random() * 12 + 3)
      }))
      // Inject occasional large wall
      if (tick % 23 < 5) { asks[2].size = 45 + Math.random() * 30 }
      if (tick % 31 < 4) { bids[3].size = 55 + Math.random() * 25 }
      if (tick % 47 < 3) { bids[1].size = 80 + Math.random() * 40 }
      return { asks, bids }
    }

    function simulate() {
      if (!alive) return
      tick++
      tickRef.current = tick

      // Price random walk
      const drift = (Math.random() - 0.495) * 8
      basePrice += drift
      setPrice(parseFloat(basePrice.toFixed(1)))

      // Buy/sell pressure oscillates realistically
      const bp = Math.round(50 + Math.sin(tick * 0.04) * 18 + (Math.random() - 0.5) * 8)
      setBuyPct(Math.max(20, Math.min(80, bp)))

      // CVD
      const delta = (bp - 50) * 0.6 + (Math.random() - 0.5) * 4
      cvdAcc += delta
      setCvd(cvdAcc)

      // Generate book
      const book = genBook(basePrice)
      setDomRows(book)

      // Heatmap snapshot
      const snap = { asks: book.asks.map(l => l.size), bids: book.bids.map(l => l.size) }
      heatRef.current.push(snap)
      if (heatRef.current.length > 120) heatRef.current.shift()

      // Random trades
      if (tick % 3 === 0) {
        const isBuy  = Math.random() > 0.48
        const qty    = Math.random() < 0.05 ? (5 + Math.random() * 15) : (0.01 + Math.random() * 0.8)
        const newTrade = {
          time: new Date().toTimeString().slice(0, 8),
          price: basePrice + (Math.random() - 0.5) * 2,
          qty, isBuy,
        }
        if (isBuy) buyVolAcc += qty; else sellVolAcc += qty
        if (qty >= 5) {
          setLargeLots(prev => [{ ...newTrade, ts: Date.now() }, ...prev].slice(0, 8))
        }
        setTrades(prev => [newTrade, ...prev].slice(0, 40))
      }

      // Random iceberg detection
      if (tick % 37 === 0) {
        const side = Math.random() > 0.5 ? 'ask' : 'bid'
        const ic = { side, price: basePrice + (side === 'ask' ? 1 : -1) * (Math.random() * 50 + 10), size: 20 + Math.random() * 30 }
        setIcebergs(prev => [ic, ...prev].slice(0, 8))
      }
    }

    const interval = setInterval(simulate, 180)

    function draw() {
      const canvas = canvasRef.current
      if (!canvas) { rafRef.current = requestAnimationFrame(draw); return }
      const W = canvas.offsetWidth, H = height
      if (canvas.width !== W) canvas.width = W
      canvas.height = H
      const ctx = canvas.getContext('2d')
      ctx.clearRect(0, 0, W, H)

      const hist = heatRef.current
      if (hist.length < 2) { rafRef.current = requestAnimationFrame(draw); return }

      const cols = hist.length, LEVELS = 14
      const cellW = W / cols, cellH = (H / 2) / LEVELS
      let mx = 1
      hist.forEach(s => { s.asks.forEach(v => { if (v > mx) mx = v }); s.bids.forEach(v => { if (v > mx) mx = v }) })

      for (let c = 0; c < cols; c++) {
        const snap = hist[c]
        for (let r = 0; r < LEVELS; r++) {
          const ai = snap.asks[r] !== undefined ? snap.asks[r] / mx : 0
          ctx.fillStyle = `rgba(224,90,74,${Math.pow(ai, 0.45)})`
          ctx.fillRect(c * cellW, r * cellH, cellW + 1, cellH + 1)
          const bi = snap.bids[r] !== undefined ? snap.bids[r] / mx : 0
          ctx.fillStyle = `rgba(34,201,122,${Math.pow(bi, 0.45)})`
          ctx.fillRect(c * cellW, H / 2 + r * cellH, cellW + 1, cellH + 1)
        }
      }
      // Highlight thick walls
      const latest = hist[hist.length - 1]
      if (latest) {
        latest.asks.forEach((v, r) => { if (v / mx > 0.7) { ctx.fillStyle = 'rgba(255,210,60,0.22)'; ctx.fillRect((cols-1)*cellW, r*cellH, cellW+1, cellH+1) }})
        latest.bids.forEach((v, r) => { if (v / mx > 0.7) { ctx.fillStyle = 'rgba(255,210,60,0.22)'; ctx.fillRect((cols-1)*cellW, H/2+r*cellH, cellW+1, cellH+1) }})
      }
      ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.fillRect(0, H/2-1, W, 2)
      ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.font = '11px sans-serif'
      ctx.fillText('ASKS', 8, 16); ctx.fillText('BIDS', 8, H/2+16)
      ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillText('recent →', W-68, H-6)
      rafRef.current = requestAnimationFrame(draw)
    }
    rafRef.current = requestAnimationFrame(draw)

    return () => {
      alive = false
      clearInterval(interval)
      cancelAnimationFrame(rafRef.current)
    }
  }, [height])

  const sellPct  = 100 - buyPct
  const cvdColor = cvd >= 0 ? 'var(--green2)' : 'var(--red)'
  const maxSize  = Math.max(...domRows.asks.map(l => l?.size || 0), ...domRows.bids.map(l => l?.size || 0), 1)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', background: 'var(--bg2)', borderRadius: 12, overflow: 'hidden', border: '0.5px solid var(--border2)' }}>

      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 14px', borderBottom: '0.5px solid var(--border)', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="dot-live" style={{ background: 'var(--green2)' }} />
          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>BTC/USDT</span>
          <span style={{ fontSize: 11, color: 'var(--text3)' }}>Order Book Heatmap</span>
          <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 4, background: 'rgba(34,201,122,0.1)', color: 'var(--green2)', border: '0.5px solid var(--green)' }}>DEMO</span>
        </div>
        <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--green2)' }}>${fmt(price)}</span>
      </div>

      {/* Flow Indicators */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', borderBottom: '0.5px solid var(--border)', background: 'var(--bg3)' }}>
        <div style={{ padding: '8px 14px', borderRight: '0.5px solid var(--border)' }}>
          <div style={{ fontSize: 9, color: 'var(--text3)', marginBottom: 5, letterSpacing: 0.5 }}>PRESSÃO COMPRA/VENDA</div>
          <div style={{ display: 'flex', gap: 4, alignItems: 'center', marginBottom: 4 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--green2)' }}>{buyPct}%</span>
            <span style={{ fontSize: 10, color: 'var(--text3)' }}>buy</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--red)', marginLeft: 4 }}>{sellPct}%</span>
            <span style={{ fontSize: 10, color: 'var(--text3)' }}>sell</span>
          </div>
          <div style={{ height: 6, borderRadius: 3, background: 'var(--bg2)', overflow: 'hidden', display: 'flex' }}>
            <div style={{ width: `${buyPct}%`, background: 'var(--green2)', transition: 'width 0.4s' }} />
            <div style={{ width: `${sellPct}%`, background: 'var(--red)', transition: 'width 0.4s' }} />
          </div>
        </div>
        <div style={{ padding: '8px 14px', borderRight: '0.5px solid var(--border)' }}>
          <div style={{ fontSize: 9, color: 'var(--text3)', marginBottom: 5, letterSpacing: 0.5 }}>CVD — DELTA ACUMULADO</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: cvdColor }}>{cvd >= 0 ? '+' : ''}{fmtVol(Math.abs(cvd))}</div>
          <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 2 }}>{cvd >= 0 ? '▲ Compradores dominam' : '▼ Vendedores dominam'}</div>
        </div>
        <div style={{ padding: '8px 14px', borderRight: '0.5px solid var(--border)' }}>
          <div style={{ fontSize: 9, color: 'var(--text3)', marginBottom: 5, letterSpacing: 0.5 }}>GRANDES PLAYERS 🐋</div>
          {largeLots.length === 0
            ? <div style={{ fontSize: 11, color: 'var(--text3)' }}>Aguardando lotes...</div>
            : largeLots.slice(0, 3).map((t, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2 }}>
                <span style={{ fontSize: 10, color: t.isBuy ? 'var(--green2)' : 'var(--red)', fontWeight: 600 }}>{t.isBuy ? '▲' : '▼'}</span>
                <span style={{ fontSize: 10, color: 'var(--text2)' }}>${fmt(t.price, 0)}</span>
                <span style={{ fontSize: 10, color: '#e0a84a', fontWeight: 600 }}>{t.qty.toFixed(2)}</span>
              </div>
            ))}
        </div>
        <div style={{ padding: '8px 14px' }}>
          <div style={{ fontSize: 9, color: 'var(--text3)', marginBottom: 5, letterSpacing: 0.5 }}>ICEBERG DETECTOR 🧊</div>
          {icebergs.length === 0
            ? <div style={{ fontSize: 11, color: 'var(--text3)' }}>Monitorando...</div>
            : icebergs.slice(0, 3).map((ic, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2 }}>
                <span style={{ fontSize: 10, color: '#e0a84a', fontWeight: 600 }}>🧊 {ic.side.toUpperCase()}</span>
                <span style={{ fontSize: 10, color: 'var(--text2)' }}>${fmt(ic.price, 0)}</span>
                <span style={{ fontSize: 10, color: 'var(--text3)' }}>{ic.size.toFixed(2)}</span>
              </div>
            ))}
        </div>
      </div>

      {/* Heatmap + DOM */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 210px' }}>
        <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height }} />
        <div style={{ borderLeft: '0.5px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '6px 10px', borderBottom: '0.5px solid var(--border)', fontSize: 10, color: 'var(--text2)' }}>DOM — Level 2</div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {[...domRows.asks].reverse().map((l, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '80px 1fr 44px', padding: '2px 8px', alignItems: 'center' }}>
                <span style={{ fontSize: 10, color: 'var(--red)' }}>${fmt(l.price, 0)}</span>
                <div style={{ height: 8, background: 'var(--bg3)', borderRadius: 2, overflow: 'hidden', margin: '0 4px' }}>
                  <div style={{ height: '100%', width: `${Math.round(l.size/maxSize*100)}%`, background: 'var(--red)', opacity: 0.7, borderRadius: 2, transition: 'width 0.3s' }} />
                </div>
                <span style={{ fontSize: 9, color: 'var(--text3)', textAlign: 'right' }}>{l.size.toFixed(1)}</span>
              </div>
            ))}
            <div style={{ padding: '3px 8px', background: 'var(--bg3)', fontSize: 10, color: 'var(--text2)', textAlign: 'center', borderTop: '0.5px solid var(--border)', borderBottom: '0.5px solid var(--border)' }}>
              Spread: ${domRows.asks[0] && domRows.bids[0] ? fmt(domRows.asks[0].price - domRows.bids[0].price, 1) : '—'}
            </div>
            {domRows.bids.map((l, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '80px 1fr 44px', padding: '2px 8px', alignItems: 'center' }}>
                <span style={{ fontSize: 10, color: 'var(--green2)' }}>${fmt(l.price, 0)}</span>
                <div style={{ height: 8, background: 'var(--bg3)', borderRadius: 2, overflow: 'hidden', margin: '0 4px' }}>
                  <div style={{ height: '100%', width: `${Math.round(l.size/maxSize*100)}%`, background: 'var(--green2)', opacity: 0.7, borderRadius: 2, transition: 'width 0.3s' }} />
                </div>
                <span style={{ fontSize: 9, color: 'var(--text3)', textAlign: 'right' }}>{l.size.toFixed(1)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Trades tape */}
      <div style={{ borderTop: '0.5px solid var(--border)', maxHeight: 130, overflowY: 'auto' }}>
        <div style={{ padding: '4px 12px', fontSize: 10, color: 'var(--text3)', borderBottom: '0.5px solid var(--border)' }}>Live trades</div>
        {trades.map((t, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '60px 1fr 80px 60px 24px', padding: '3px 12px', fontSize: 11, borderBottom: '0.5px solid var(--border)', background: t.qty >= 5 ? (t.isBuy ? 'rgba(34,201,122,0.05)' : 'rgba(224,90,74,0.05)') : 'transparent' }}>
            <span style={{ color: 'var(--text3)' }}>{t.time}</span>
            <span style={{ fontWeight: 500, color: t.isBuy ? 'var(--green2)' : 'var(--red)' }}>${fmt(t.price, 0)}</span>
            <span style={{ textAlign: 'right', color: 'var(--text2)' }}>{t.qty.toFixed(3)}</span>
            <span style={{ textAlign: 'right', color: t.isBuy ? 'var(--green2)' : 'var(--red)' }}>{t.isBuy ? 'BUY' : 'SELL'}</span>
            <span style={{ textAlign: 'right', fontSize: 9 }}>{t.qty >= 5 ? '🐋' : ''}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
