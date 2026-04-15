import { useEffect, useRef, useState } from 'react'

const SYMBOLS = {
  'BTC/USDT': 'btcusdt', 'ETH/USDT': 'ethusdt',
  'SOL/USDT': 'solusdt', 'BNB/USDT': 'bnbusdt', 'XRP/USDT': 'xrpusdt',
}
const LOT_THRESHOLDS = {
  'BTC/USDT': 5, 'ETH/USDT': 50, 'SOL/USDT': 5000, 'BNB/USDT': 500, 'XRP/USDT': 100000,
}

export default function HeatmapCanvas({ symbol = 'BTC/USDT', height = 380 }) {
  const canvasRef = useRef(null)
  const heatRef   = useRef([])
  const wsDepth   = useRef(null)
  const wsTrades  = useRef(null)
  const rafRef    = useRef(null)
  const bookRef   = useRef({ asks: [], bids: [] })
  const cvdRef    = useRef(0)

  const [price, setPrice]         = useState(null)
  const [status, setStatus]       = useState('connecting')
  const [trades, setTrades]       = useState([])
  const [domRows, setDomRows]     = useState({ asks: [], bids: [] })
  const [cvd, setCvd]             = useState(0)
  const [buyVol, setBuyVol]       = useState(0)
  const [sellVol, setSellVol]     = useState(0)
  const [largeLots, setLargeLots] = useState([])
  const [icebergs, setIcebergs]   = useState([])

  const sym       = SYMBOLS[symbol] || 'btcusdt'
  const lotThresh = LOT_THRESHOLDS[symbol] || 5

  useEffect(() => {
    let alive = true
    let buyVolAcc = 0, sellVolAcc = 0
    let prevBook = { asks: [], bids: [] }

    function connect() {
      if (!alive) return
      setStatus('connecting')
      cvdRef.current = 0; buyVolAcc = 0; sellVolAcc = 0

      const wd = new WebSocket(`wss://stream.binance.com:9443/ws/${sym}@depth20@100ms`)
      wsDepth.current = wd
      wd.onopen  = () => alive && setStatus('live')
      wd.onerror = () => alive && setStatus('error')
      wd.onclose = () => alive && setTimeout(connect, 3000)
      wd.onmessage = (e) => {
        if (!alive) return
        const d    = JSON.parse(e.data)
        const asks = d.asks.slice(0, 14).map(([p, q]) => ({ price: +p, size: +q })).sort((a, b) => a.price - b.price)
        const bids = d.bids.slice(0, 14).map(([p, q]) => ({ price: +p, size: +q })).sort((a, b) => b.price - a.price)
        bookRef.current = { asks, bids }
        setDomRows({ asks, bids })
        const newIcebergs = []
        asks.forEach(a => { const prev = prevBook.asks.find(p => p.price === a.price); if (prev && prev.size < a.size * 0.6 && a.size > lotThresh * 0.5) newIcebergs.push({ side: 'ask', price: a.price, size: a.size }) })
        bids.forEach(b => { const prev = prevBook.bids.find(p => p.price === b.price); if (prev && prev.size < b.size * 0.6 && b.size > lotThresh * 0.5) newIcebergs.push({ side: 'bid', price: b.price, size: b.size }) })
        if (newIcebergs.length > 0) setIcebergs(prev => [...newIcebergs, ...prev].slice(0, 10))
        prevBook = { asks, bids }
        const snap = { asks: asks.map(l => l.size), bids: bids.map(l => l.size) }
        heatRef.current.push(snap)
        if (heatRef.current.length > 120) heatRef.current.shift()
      }

      const wt = new WebSocket(`wss://stream.binance.com:9443/ws/${sym}@aggTrade`)
      wsTrades.current = wt
      wt.onmessage = (e) => {
        if (!alive) return
        const d = JSON.parse(e.data)
        const isBuy = !d.m, qty = +d.q, px = +d.p
        setPrice(px)
        if (isBuy) { cvdRef.current += qty; buyVolAcc += qty } else { cvdRef.current -= qty; sellVolAcc += qty }
        setCvd(cvdRef.current); setBuyVol(buyVolAcc); setSellVol(sellVolAcc)
        const trade = { time: new Date().toTimeString().slice(0, 8), price: px, qty, isBuy }
        if (qty >= lotThresh) setLargeLots(prev => [{ ...trade, ts: Date.now() }, ...prev].slice(0, 8))
        setTrades(prev => [trade, ...prev].slice(0, 40))
      }
    }
    connect()

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
      const cols = hist.length, LEVELS = hist[0].asks.length || 14
      const cellW = W / cols, cellH = (H / 2) / LEVELS
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
      const latest = hist[hist.length - 1]
      if (latest) {
        latest.asks.forEach((v, r) => { if (v / mx > 0.75) { ctx.fillStyle = 'rgba(255,210,60,0.2)'; ctx.fillRect((cols-1)*cellW, r*cellH, cellW+1, cellH+1) } })
        latest.bids.forEach((v, r) => { if (v / mx > 0.75) { ctx.fillStyle = 'rgba(255,210,60,0.2)'; ctx.fillRect((cols-1)*cellW, H/2+r*cellH, cellW+1, cellH+1) } })
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
      cancelAnimationFrame(rafRef.current)
      try { wsDepth.current?.close() } catch (_) {}
      try { wsTrades.current?.close() } catch (_) {}
    }
  }, [sym, height])

  const fmt    = (n, d = 2) => Number(n).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d })
  const fmtVol = (n) => n >= 1000 ? `${(n/1000).toFixed(1)}k` : n.toFixed(2)
  const maxSize  = Math.max(...domRows.asks.map(l => l.size), ...domRows.bids.map(l => l.size), 1)
  const totalVol = buyVol + sellVol
  const buyPct   = totalVol > 0 ? Math.round((buyVol / totalVol) * 100) : 50
  const sellPct  = 100 - buyPct
  const cvdColor = cvd >= 0 ? 'var(--green2)' : 'var(--red)'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', background: 'var(--bg2)', borderRadius: 12, overflow: 'hidden', border: '0.5px solid var(--border2)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 14px', borderBottom: '0.5px solid var(--border)', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="dot-live" style={{ background: status === 'live' ? 'var(--green2)' : status === 'error' ? 'var(--red)' : '#e0a84a' }} />
          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{symbol}</span>
          <span style={{ fontSize: 11, color: 'var(--text3)' }}>Order Book Heatmap</span>
        </div>
        <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--green2)' }}>{price ? `$${fmt(price)}` : '—'}</span>
      </div>

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
            <div style={{ width: `${buyPct}%`, background: 'var(--green2)', transition: 'width 0.5s' }} />
            <div style={{ width: `${sellPct}%`, background: 'var(--red)', transition: 'width 0.5s' }} />
          </div>
        </div>
        <div style={{ padding: '8px 14px', borderRight: '0.5px solid var(--border)' }}>
          <div style={{ fontSize: 9, color: 'var(--text3)', marginBottom: 5, letterSpacing: 0.5 }}>CVD — DELTA ACUMULADO</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: cvdColor }}>{cvd >= 0 ? '+' : ''}{fmtVol(cvd)}</div>
          <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 2 }}>{cvd >= 0 ? '▲ Compradores dominam' : '▼ Vendedores dominam'}</div>
        </div>
        <div style={{ padding: '8px 14px', borderRight: '0.5px solid var(--border)' }}>
          <div style={{ fontSize: 9, color: 'var(--text3)', marginBottom: 5, letterSpacing: 0.5 }}>GRANDES PLAYERS 🐋</div>
          {largeLots.length === 0 ? <div style={{ fontSize: 11, color: 'var(--text3)' }}>Aguardando lotes...</div>
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
          {icebergs.length === 0 ? <div style={{ fontSize: 11, color: 'var(--text3)' }}>Monitorando...</div>
            : icebergs.slice(0, 3).map((ic, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2 }}>
                <span style={{ fontSize: 10, color: '#e0a84a', fontWeight: 600 }}>🧊 {ic.side.toUpperCase()}</span>
                <span style={{ fontSize: 10, color: 'var(--text2)' }}>${fmt(ic.price, 0)}</span>
                <span style={{ fontSize: 10, color: 'var(--text3)' }}>{ic.size.toFixed(2)}</span>
              </div>
            ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 210px' }}>
        <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height }} />
        <div style={{ borderLeft: '0.5px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '6px 10px', borderBottom: '0.5px solid var(--border)', fontSize: 10, color: 'var(--text2)' }}>DOM — Level 2</div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {[...domRows.asks].reverse().map((l, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '80px 1fr 44px', padding: '2px 8px', alignItems: 'center' }}>
                <span style={{ fontSize: 10, color: 'var(--red)' }}>${fmt(l.price)}</span>
                <div style={{ height: 8, background: 'var(--bg3)', borderRadius: 2, overflow: 'hidden', margin: '0 4px' }}>
                  <div style={{ height: '100%', width: `${Math.round(l.size/maxSize*100)}%`, background: 'var(--red)', opacity: 0.7, borderRadius: 2 }} />
                </div>
                <span style={{ fontSize: 9, color: 'var(--text3)', textAlign: 'right' }}>{l.size.toFixed(2)}</span>
              </div>
            ))}
            <div style={{ padding: '3px 8px', background: 'var(--bg3)', fontSize: 10, color: 'var(--text2)', textAlign: 'center', borderTop: '0.5px solid var(--border)', borderBottom: '0.5px solid var(--border)' }}>
              Spread: ${domRows.asks[0] && domRows.bids[0] ? fmt(domRows.asks[0].price - domRows.bids[0].price) : '—'}
            </div>
            {domRows.bids.map((l, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '80px 1fr 44px', padding: '2px 8px', alignItems: 'center' }}>
                <span style={{ fontSize: 10, color: 'var(--green2)' }}>${fmt(l.price)}</span>
                <div style={{ height: 8, background: 'var(--bg3)', borderRadius: 2, overflow: 'hidden', margin: '0 4px' }}>
                  <div style={{ height: '100%', width: `${Math.round(l.size/maxSize*100)}%`, background: 'var(--green2)', opacity: 0.7, borderRadius: 2 }} />
                </div>
                <span style={{ fontSize: 9, color: 'var(--text3)', textAlign: 'right' }}>{l.size.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ borderTop: '0.5px solid var(--border)', maxHeight: 140, overflowY: 'auto' }}>
        <div style={{ padding: '4px 12px', fontSize: 10, color: 'var(--text3)', borderBottom: '0.5px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
          <span>Live trades</span>
          <span>Compra: <span style={{ color: 'var(--green2)' }}>{fmtVol(buyVol)}</span>{'  '}Venda: <span style={{ color: 'var(--red)' }}>{fmtVol(sellVol)}</span></span>
        </div>
        {trades.map((t, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '60px 1fr 80px 60px 24px', padding: '3px 12px', fontSize: 11, borderBottom: '0.5px solid var(--border)', background: t.qty >= lotThresh ? (t.isBuy ? 'rgba(34,201,122,0.05)' : 'rgba(224,90,74,0.05)') : 'transparent' }}>
            <span style={{ color: 'var(--text3)' }}>{t.time}</span>
            <span style={{ fontWeight: 500, color: t.isBuy ? 'var(--green2)' : 'var(--red)' }}>${fmt(t.price)}</span>
            <span style={{ textAlign: 'right', color: 'var(--text2)' }}>{t.qty.toFixed(4)}</span>
            <span style={{ textAlign: 'right', color: t.isBuy ? 'var(--green2)' : 'var(--red)' }}>{t.isBuy ? 'BUY' : 'SELL'}</span>
            <span style={{ textAlign: 'right', fontSize: 9 }}>{t.qty >= lotThresh ? '🐋' : ''}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
