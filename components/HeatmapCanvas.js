import { useEffect, useRef, useState } from 'react'

const SYMBOLS = {
  'BTC/USDT': 'btcusdt', 'ETH/USDT': 'ethusdt',
  'SOL/USDT': 'solusdt', 'BNB/USDT': 'bnbusdt', 'XRP/USDT': 'xrpusdt',
}

export default function HeatmapCanvas({ symbol = 'BTC/USDT', height = 320 }) {
  const canvasRef = useRef(null)
  const heatRef   = useRef([])
  const wsDepth   = useRef(null)
  const wsTrades  = useRef(null)
  const rafRef    = useRef(null)
  const bookRef   = useRef({ asks: [], bids: [] })

  const [price, setPrice]   = useState(null)
  const [status, setStatus] = useState('connecting')
  const [trades, setTrades] = useState([])
  const [domRows, setDomRows] = useState({ asks: [], bids: [] })

  const sym = SYMBOLS[symbol] || 'btcusdt'

  useEffect(() => {
    let alive = true

    function connect() {
      if (!alive) return
      setStatus('connecting')

      // Depth WebSocket
      const wd = new WebSocket(`wss://stream.binance.com:9443/ws/${sym}@depth20@100ms`)
      wsDepth.current = wd
      wd.onopen = () => alive && setStatus('live')
      wd.onerror = () => alive && setStatus('error')
      wd.onclose = () => alive && setTimeout(connect, 3000)
      wd.onmessage = (e) => {
        if (!alive) return
        const d = JSON.parse(e.data)
        const asks = d.asks.slice(0, 14).map(([p, q]) => ({ price: +p, size: +q })).sort((a, b) => a.price - b.price)
        const bids = d.bids.slice(0, 14).map(([p, q]) => ({ price: +p, size: +q })).sort((a, b) => b.price - a.price)
        bookRef.current = { asks, bids }
        setDomRows({ asks, bids })

        // Capture heatmap snapshot
        const snap = { asks: asks.map(l => l.size), bids: bids.map(l => l.size) }
        heatRef.current.push(snap)
        if (heatRef.current.length > 90) heatRef.current.shift()
      }

      // Trades WebSocket
      const wt = new WebSocket(`wss://stream.binance.com:9443/ws/${sym}@aggTrade`)
      wsTrades.current = wt
      wt.onmessage = (e) => {
        if (!alive) return
        const d = JSON.parse(e.data)
        setPrice(+d.p)
        const trade = {
          time: new Date().toTimeString().slice(0, 8),
          price: +d.p,
          qty: +d.q,
          isBuy: !d.m,
        }
        setTrades(prev => [trade, ...prev].slice(0, 40))
      }
    }

    connect()

    // Draw loop
    function draw() {
      const canvas = canvasRef.current
      if (!canvas) { rafRef.current = requestAnimationFrame(draw); return }
      const W = canvas.offsetWidth
      const H = height
      if (canvas.width !== W) canvas.width = W
      canvas.height = H
      const ctx = canvas.getContext('2d')
      ctx.clearRect(0, 0, W, H)

      const hist = heatRef.current
      if (hist.length < 2) { rafRef.current = requestAnimationFrame(draw); return }

      const cols = hist.length
      const LEVELS = hist[0].asks.length || 14
      const cellW = W / cols
      const cellH = (H / 2) / LEVELS

      let mx = 1
      hist.forEach(s => { s.asks.forEach(v => { if (v > mx) mx = v }); s.bids.forEach(v => { if (v > mx) mx = v }) })

      for (let c = 0; c < cols; c++) {
        const snap = hist[c]
        for (let r = 0; r < LEVELS; r++) {
          const ai = snap.asks[r] !== undefined ? snap.asks[r] / mx : 0
          ctx.fillStyle = `rgba(224,90,74,${Math.pow(ai, 0.55)})`
          ctx.fillRect(c * cellW, r * cellH, cellW + 1, cellH + 1)

          const bi = snap.bids[r] !== undefined ? snap.bids[r] / mx : 0
          ctx.fillStyle = `rgba(34,201,122,${Math.pow(bi, 0.55)})`
          ctx.fillRect(c * cellW, H / 2 + r * cellH, cellW + 1, cellH + 1)
        }
      }

      // Midline
      ctx.fillStyle = 'rgba(255,255,255,0.15)'
      ctx.fillRect(0, H / 2 - 1, W, 2)

      // Labels
      ctx.fillStyle = 'rgba(255,255,255,0.6)'
      ctx.font = '11px sans-serif'
      ctx.fillText('ASKS', 8, 16)
      ctx.fillText('BIDS', 8, H / 2 + 16)
      ctx.fillStyle = 'rgba(255,255,255,0.3)'
      ctx.fillText('recent →', W - 68, H - 6)

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

  const fmt = (n, d = 2) => Number(n).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d })
  const maxSize = Math.max(...domRows.asks.map(l => l.size), ...domRows.bids.map(l => l.size), 1)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', background: 'var(--bg2)', borderRadius: 12, overflow: 'hidden', border: '0.5px solid var(--border2)' }}>
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 14px', borderBottom: '0.5px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="dot-live" style={{ background: status === 'live' ? 'var(--green2)' : status === 'error' ? 'var(--red)' : '#e0a84a' }} />
          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{symbol}</span>
          <span style={{ fontSize: 11, color: 'var(--text3)' }}>Order Book Heatmap</span>
        </div>
        <span style={{ fontSize: 16, fontWeight: 500, color: 'var(--green2)' }}>
          {price ? `$${fmt(price)}` : '—'}
        </span>
      </div>

      {/* Main grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px' }}>
        {/* Heatmap */}
        <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height }} />

        {/* DOM */}
        <div style={{ borderLeft: '0.5px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '6px 10px', borderBottom: '0.5px solid var(--border)', fontSize: 10, color: 'var(--text2)' }}>DOM — Level 2</div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {[...domRows.asks].reverse().map((l, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '80px 1fr 44px', padding: '2px 8px', alignItems: 'center' }}>
                <span style={{ fontSize: 10, color: 'var(--red)' }}>${fmt(l.price)}</span>
                <div style={{ height: 8, background: 'var(--bg3)', borderRadius: 2, overflow: 'hidden', margin: '0 4px' }}>
                  <div style={{ height: '100%', width: `${Math.round(l.size / maxSize * 100)}%`, background: 'var(--red)', opacity: 0.7, borderRadius: 2 }} />
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
                  <div style={{ height: '100%', width: `${Math.round(l.size / maxSize * 100)}%`, background: 'var(--green2)', opacity: 0.7, borderRadius: 2 }} />
                </div>
                <span style={{ fontSize: 9, color: 'var(--text3)', textAlign: 'right' }}>{l.size.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Trades tape */}
      <div style={{ borderTop: '0.5px solid var(--border)', maxHeight: 140, overflowY: 'auto' }}>
        <div style={{ padding: '4px 12px', fontSize: 10, color: 'var(--text3)', borderBottom: '0.5px solid var(--border)' }}>Live trades</div>
        {trades.map((t, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '60px 1fr 80px 60px', padding: '3px 12px', fontSize: 11, borderBottom: '0.5px solid var(--border)' }}>
            <span style={{ color: 'var(--text3)' }}>{t.time}</span>
            <span style={{ fontWeight: 500, color: t.isBuy ? 'var(--green2)' : 'var(--red)' }}>${fmt(t.price)}</span>
            <span style={{ textAlign: 'right', color: 'var(--text2)' }}>{t.qty.toFixed(4)}</span>
            <span style={{ textAlign: 'right', color: t.isBuy ? 'var(--green2)' : 'var(--red)' }}>{t.isBuy ? 'BUY' : 'SELL'}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
