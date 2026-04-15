import { useEffect, useRef, useState } from 'react'

const SYMBOLS = { 'BTC/USDT': 'btcusdt', 'ETH/USDT': 'ethusdt', 'SOL/USDT': 'solusdt', 'BNB/USDT': 'bnbusdt', 'XRP/USDT': 'xrpusdt' }

export default function BubbleChart({ symbol = 'BTC/USDT', height = 260, demo = false }) {
  const canvasRef = useRef(null)
  const rafRef    = useRef(null)
  const bubblesRef = useRef([])
  const wsRef     = useRef(null)
  const [status, setStatus] = useState(demo ? 'live' : 'connecting')
  const [price, setPrice]   = useState(null)
  const [lotMode, setLotMode] = useState('all') // all | large | whale

  const sym = SYMBOLS[symbol] || 'btcusdt'

  useEffect(() => {
    let alive = true

    if (demo) {
      // Demo mode: generate fake bubbles
      const interval = setInterval(() => {
        if (!alive) return
        const isBuy = Math.random() > 0.47
        const qty   = Math.random() < 0.03 ? 10 + Math.random() * 40
                    : Math.random() < 0.12 ? 2 + Math.random() * 8
                    : 0.1 + Math.random() * 1.5
        const px    = 84300 + (Math.random() - 0.5) * 200
        setPrice(parseFloat((84300 + (Math.random()-0.5)*50).toFixed(1)))
        bubblesRef.current.push({
          x: Math.random(),
          y: 0.1 + Math.random() * 0.8,
          r: Math.min(Math.sqrt(qty) * 6, 55),
          isBuy, qty, price: px,
          opacity: 1, born: Date.now(),
          vx: (Math.random() - 0.5) * 0.002,
          vy: (Math.random() - 0.5) * 0.001,
        })
        if (bubblesRef.current.length > 120) bubblesRef.current.shift()
      }, 200)
      return () => { alive = false; clearInterval(interval) }
    }

    // Real mode
    function connect() {
      if (!alive) return
      setStatus('connecting')
      const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${sym}@aggTrade`)
      wsRef.current = ws
      ws.onopen  = () => alive && setStatus('live')
      ws.onerror = () => alive && setStatus('error')
      ws.onclose = () => alive && setTimeout(connect, 3000)
      ws.onmessage = (e) => {
        if (!alive) return
        const d     = JSON.parse(e.data)
        const isBuy = !d.m
        const qty   = +d.q
        const px    = +d.p
        setPrice(px)
        bubblesRef.current.push({
          x: Math.random(),
          y: 0.15 + Math.random() * 0.7,
          r: Math.min(Math.sqrt(qty) * 8, 60),
          isBuy, qty, price: px,
          opacity: 1, born: Date.now(),
          vx: (Math.random() - 0.5) * 0.0015,
          vy: (Math.random() - 0.5) * 0.0008,
        })
        if (bubblesRef.current.length > 150) bubblesRef.current.shift()
      }
    }
    connect()
    return () => { alive = false; try { wsRef.current?.close() } catch(_){} }
  }, [sym, demo])

  useEffect(() => {
    let alive = true
    const LOT_FILTER = { all: 0, large: 2, whale: 10 }

    function draw() {
      const canvas = canvasRef.current
      if (!canvas) { rafRef.current = requestAnimationFrame(draw); return }
      const W = canvas.offsetWidth
      const H = height
      if (canvas.width !== W) canvas.width = W
      canvas.height = H
      const ctx = canvas.getContext('2d')

      // Background
      ctx.fillStyle = '#080d09'
      ctx.fillRect(0, 0, W, H)

      // Grid lines
      ctx.strokeStyle = 'rgba(255,255,255,0.04)'
      ctx.lineWidth = 1
      for (let i = 1; i < 5; i++) {
        ctx.beginPath(); ctx.moveTo(W * i / 5, 0); ctx.lineTo(W * i / 5, H); ctx.stroke()
        ctx.beginPath(); ctx.moveTo(0, H * i / 5); ctx.lineTo(W, H * i / 5); ctx.stroke()
      }

      const now = Date.now()
      const minQty = LOT_FILTER[lotMode] || 0

      bubblesRef.current.forEach(b => {
        if (b.qty < minQty) return
        // Fade over 8s
        const age = (now - b.born) / 8000
        b.opacity = Math.max(0, 1 - age)
        b.x += b.vx
        b.y += b.vy
        if (b.opacity <= 0) return

        const cx = b.x * W
        const cy = b.y * H

        // Glow
        const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, b.r * 1.8)
        if (b.isBuy) {
          glow.addColorStop(0, `rgba(34,210,130,${b.opacity * 0.25})`)
          glow.addColorStop(1, 'rgba(34,210,130,0)')
        } else {
          glow.addColorStop(0, `rgba(255,70,50,${b.opacity * 0.25})`)
          glow.addColorStop(1, 'rgba(255,70,50,0)')
        }
        ctx.beginPath(); ctx.arc(cx, cy, b.r * 1.8, 0, Math.PI * 2)
        ctx.fillStyle = glow; ctx.fill()

        // Bubble fill
        const grad = ctx.createRadialGradient(cx - b.r*0.3, cy - b.r*0.3, 0, cx, cy, b.r)
        if (b.isBuy) {
          grad.addColorStop(0, `rgba(60,230,150,${b.opacity * 0.85})`)
          grad.addColorStop(1, `rgba(20,160,90,${b.opacity * 0.6})`)
        } else {
          grad.addColorStop(0, `rgba(255,100,80,${b.opacity * 0.85})`)
          grad.addColorStop(1, `rgba(200,40,20,${b.opacity * 0.6})`)
        }
        ctx.beginPath(); ctx.arc(cx, cy, b.r, 0, Math.PI * 2)
        ctx.fillStyle = grad; ctx.fill()

        // Border
        ctx.strokeStyle = b.isBuy ? `rgba(34,210,130,${b.opacity * 0.6})` : `rgba(255,70,50,${b.opacity * 0.6})`
        ctx.lineWidth = b.qty >= 10 ? 2 : 1
        ctx.stroke()

        // Label for big bubbles
        if (b.r > 18 && b.opacity > 0.4) {
          ctx.fillStyle = `rgba(255,255,255,${b.opacity * 0.9})`
          ctx.font = `bold ${Math.min(b.r * 0.45, 13)}px sans-serif`
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText(b.qty >= 1 ? b.qty.toFixed(1) : b.qty.toFixed(3), cx, cy)
        }

        // Whale crown
        if (b.qty >= 10) {
          ctx.font = `${Math.min(b.r * 0.5, 14)}px sans-serif`
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText('🐋', cx, cy - b.r - 8)
        }
      })

      // Labels
      ctx.font = 'bold 10px sans-serif'
      ctx.textAlign = 'left'
      ctx.textBaseline = 'top'
      ctx.fillStyle = 'rgba(34,210,130,0.7)'; ctx.fillText('● COMPRA', 8, 8)
      ctx.fillStyle = 'rgba(255,70,50,0.7)';  ctx.fillText('● VENDA', 80, 8)
      ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillText('tamanho = volume do lote', W - 160, 8)

      rafRef.current = requestAnimationFrame(draw)
    }
    rafRef.current = requestAnimationFrame(draw)
    return () => { alive = false; cancelAnimationFrame(rafRef.current) }
  }, [height, lotMode])

  const fmt = (n, d=2) => Number(n).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', background: '#080d09', borderRadius: 12, overflow: 'hidden', border: '0.5px solid var(--border2)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 14px', borderBottom: '0.5px solid var(--border)', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="dot-live" style={{ background: status === 'live' ? 'var(--green2)' : '#e0a84a' }} />
          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{symbol}</span>
          <span style={{ fontSize: 11, color: 'var(--text3)' }}>Rastreio de Liquidez — Bolhas</span>
          {demo && <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 4, background: 'rgba(34,201,122,0.1)', color: 'var(--green2)', border: '0.5px solid var(--green)' }}>DEMO</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {['all', 'large', 'whale'].map(m => (
            <button key={m} onClick={() => setLotMode(m)} style={{
              fontSize: 10, padding: '3px 10px', borderRadius: 4, cursor: 'pointer',
              background: lotMode === m ? 'var(--green3)' : 'transparent',
              color: lotMode === m ? 'var(--green2)' : 'var(--text3)',
              border: lotMode === m ? '0.5px solid var(--green)' : '0.5px solid var(--border2)',
            }}>
              {m === 'all' ? 'Todos' : m === 'large' ? '🔶 Grandes' : '🐋 Whales'}
            </button>
          ))}
          {price && <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--green2)' }}>${fmt(price)}</span>}
        </div>
      </div>
      <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height }} />
    </div>
  )
}
