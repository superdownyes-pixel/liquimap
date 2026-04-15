import { useEffect, useRef, useState } from 'react'

const THEMES = {
  'BTC/USDT': { ask: [255, 80,  40],  bid: [0,   243, 255], glow: 'rgba(0,243,255,0.4)',   label: '#00f3ff' },
  'ETH/USDT': { ask: [255, 60,  180], bid: [188, 19,  254], glow: 'rgba(188,19,254,0.4)',  label: '#bc13fe' },
  'SOL/USDT': { ask: [255, 140, 0],   bid: [0,   255, 136], glow: 'rgba(0,255,136,0.4)',   label: '#00ff88' },
  'BNB/USDT': { ask: [255, 180, 0],   bid: [240, 185, 11],  glow: 'rgba(240,185,11,0.4)',  label: '#f0b90b' },
  'XRP/USDT': { ask: [255, 60,  60],  bid: [100, 180, 255], glow: 'rgba(100,180,255,0.4)', label: '#64b4ff' },
}
const DEFAULT_THEME = THEMES['BTC/USDT']

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

  const theme = THEMES[symbol] || DEFAULT_THEME
  const fmt    = (n, d = 2) => Number(n).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d })
  const fmtVol = (n) => n >= 1000 ? `${(n/1000).toFixed(1)}k` : n.toFixed(2)

  // Base price per symbol
  const BASE_PRICES = { 'BTC/USDT': 84320, 'ETH/USDT': 3180, 'SOL/USDT': 148, 'BNB/USDT': 605, 'XRP/USDT': 2.14 }
  const WHALE_THRESH = { 'BTC/USDT': 5, 'ETH/USDT': 50, 'SOL/USDT': 5000, 'BNB/USDT': 500, 'XRP/USDT': 100000 }

  useEffect(() => {
    let alive = true, tick = 0
    let basePrice  = BASE_PRICES[symbol] || 84320
    let cvdAcc = 0

    function genBook(bp) {
      const step = bp * 0.00008
      const asks = Array.from({ length: 14 }, (_, i) => ({
        price: bp + (i+1)*step,
        size:  Math.abs(Math.sin(tick*0.07 + i*1.3)*18 + Math.random()*12 + 3)
      }))
      const bids = Array.from({ length: 14 }, (_, i) => ({
        price: bp - (i+1)*step,
        size:  Math.abs(Math.sin(tick*0.07 + i*1.7+2)*18 + Math.random()*12 + 3)
      }))
      if (tick%23<5) asks[2].size = 45+Math.random()*30
      if (tick%31<4) bids[3].size = 55+Math.random()*25
      if (tick%47<3) bids[1].size = 80+Math.random()*40
      return { asks, bids }
    }

    function simulate() {
      if (!alive) return
      tick++
      basePrice += (Math.random()-0.495) * (basePrice * 0.0001)
      setPrice(parseFloat(basePrice.toFixed(symbol === 'XRP/USDT' ? 4 : 1)))
      const bp = Math.round(50 + Math.sin(tick*0.04)*18 + (Math.random()-0.5)*8)
      setBuyPct(Math.max(20, Math.min(80, bp)))
      cvdAcc += (bp-50)*0.6 + (Math.random()-0.5)*4
      setCvd(cvdAcc)
      const book = genBook(basePrice)
      setDomRows(book)
      heatRef.current.push({ asks: book.asks.map(l=>l.size), bids: book.bids.map(l=>l.size) })
      if (heatRef.current.length > 120) heatRef.current.shift()
      if (tick%3===0) {
        const wt = WHALE_THRESH[symbol] || 5
        const isBuy = Math.random() > 0.48
        const qty   = Math.random()<0.05 ? wt+(Math.random()*wt*2) : 0.01+Math.random()*0.8
        const t = { time: new Date().toTimeString().slice(0,8), price: basePrice+(Math.random()-0.5)*2, qty, isBuy }
        if (qty >= wt) setLargeLots(prev => [{...t, ts:Date.now()}, ...prev].slice(0,8))
        setTrades(prev => [t, ...prev].slice(0,40))
      }
      if (tick%37===0) {
        const side = Math.random()>0.5?'ask':'bid'
        setIcebergs(prev => [{side, price: basePrice+(side==='ask'?1:-1)*(Math.random()*50+10), size:20+Math.random()*30}, ...prev].slice(0,8))
      }
    }

    const interval = setInterval(simulate, 180)
    return () => { alive=false; clearInterval(interval) }
  }, [symbol])

  useEffect(() => {
    let alive = true
    const th = THEMES[symbol] || DEFAULT_THEME

    function draw() {
      const canvas = canvasRef.current
      if (!canvas) { rafRef.current = requestAnimationFrame(draw); return }
      const W = canvas.offsetWidth, H = height
      if (canvas.width !== W) canvas.width = W
      canvas.height = H
      const ctx = canvas.getContext('2d')

      ctx.fillStyle = '#060a08'
      ctx.fillRect(0, 0, W, H)

      // Subtle grid
      ctx.strokeStyle = 'rgba(255,255,255,0.03)'
      ctx.lineWidth = 1
      for (let i=1; i<8; i++) {
        ctx.beginPath(); ctx.moveTo(W*i/8,0); ctx.lineTo(W*i/8,H); ctx.stroke()
      }
      ctx.beginPath(); ctx.moveTo(0,H/2); ctx.lineTo(W,H/2); ctx.stroke()

      const hist = heatRef.current
      if (hist.length < 2) { rafRef.current = requestAnimationFrame(draw); return }

      const cols = hist.length, LEVELS = 14
      const cellW = W/cols, cellH = (H/2)/LEVELS
      let mx = 1
      hist.forEach(s => { s.asks.forEach(v=>{if(v>mx)mx=v}); s.bids.forEach(v=>{if(v>mx)mx=v}) })

      const wt = (WHALE_THRESH[symbol]||5)

      for (let c=0; c<cols; c++) {
        const snap = hist[c]
        const isLatest = c === cols-1

        for (let r=0; r<LEVELS; r++) {
          // ASKS — theme ask color
          if (snap.asks[r] !== undefined) {
            const intensity = Math.pow(snap.asks[r]/mx, 0.42)
            if (intensity > 0.04) {
              const [R,G,B] = th.ask
              ctx.fillStyle = `rgba(${R},${G},${B},${intensity * 0.9})`
              ctx.fillRect(c*cellW, r*cellH, cellW+0.5, cellH+0.5)
              // Whale glow
              if (isLatest && snap.asks[r] > mx*0.7) {
                ctx.shadowBlur = 8
                ctx.shadowColor = `rgb(${R},${G},${B})`
                ctx.fillRect(c*cellW, r*cellH, cellW+0.5, cellH+0.5)
                ctx.shadowBlur = 0
              }
            }
          }
          // BIDS — theme bid color
          if (snap.bids[r] !== undefined) {
            const intensity = Math.pow(snap.bids[r]/mx, 0.42)
            if (intensity > 0.04) {
              const [R,G,B] = th.bid
              ctx.fillStyle = `rgba(${R},${G},${B},${intensity * 0.88})`
              ctx.fillRect(c*cellW, H/2+r*cellH, cellW+0.5, cellH+0.5)
              // Whale glow
              if (isLatest && snap.bids[r] > mx*0.7) {
                ctx.shadowBlur = 8
                ctx.shadowColor = `rgb(${R},${G},${B})`
                ctx.fillRect(c*cellW, H/2+r*cellH, cellW+0.5, cellH+0.5)
                ctx.shadowBlur = 0
              }
            }
          }
        }
      }

      // Midline glow with theme color
      const [BR,BG,BB] = th.bid
      const grad = ctx.createLinearGradient(0, H/2-4, 0, H/2+4)
      grad.addColorStop(0, 'rgba(255,255,255,0)')
      grad.addColorStop(0.5, `rgba(${BR},${BG},${BB},0.35)`)
      grad.addColorStop(1, 'rgba(255,255,255,0)')
      ctx.fillStyle = grad
      ctx.fillRect(0, H/2-4, W, 8)

      // Labels with theme colors
      const [AR,AG,AB] = th.ask
      ctx.font = 'bold 10px sans-serif'; ctx.textBaseline = 'top'
      ctx.fillStyle = `rgba(${AR},${AG},${AB},0.8)`; ctx.fillText('ASKS', 8, 6)
      ctx.fillStyle = `rgba(${BR},${BG},${BB},0.8)`; ctx.fillText('BIDS', 8, H/2+6)
      ctx.fillStyle = 'rgba(255,255,255,0.2)'; ctx.font='10px sans-serif'
      ctx.fillText('recent →', W-65, H-14)

      rafRef.current = requestAnimationFrame(draw)
    }
    rafRef.current = requestAnimationFrame(draw)
    return () => { alive=false; cancelAnimationFrame(rafRef.current) }
  }, [symbol, height])

  const sellPct  = 100 - buyPct
  const cvdColor = cvd >= 0 ? theme.label : '#ff5030'
  const maxSize  = Math.max(...domRows.asks.map(l=>l?.size||0), ...domRows.bids.map(l=>l?.size||0), 1)
  const [BR,BG,BB] = theme.bid
  const [AR,AG,AB] = theme.ask

  return (
    <div style={{ display:'flex', flexDirection:'column', background:'#060a08', borderRadius:12, overflow:'hidden', border:`0.5px solid rgba(${BR},${BG},${BB},0.3)`, boxShadow:`0 0 20px rgba(${BR},${BG},${BB},0.08)` }}>

      {/* Top bar */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 14px', borderBottom:`0.5px solid rgba(${BR},${BG},${BB},0.15)`, flexWrap:'wrap', gap:8 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span className="dot-live" style={{ background: theme.label }} />
          <span style={{ fontSize:13, fontWeight:500, color:'var(--text)' }}>{symbol}</span>
          <span style={{ fontSize:11, color:'var(--text3)' }}>Order Book Heatmap</span>
          <span style={{ fontSize:10, padding:'2px 7px', borderRadius:4, background:`rgba(${BR},${BG},${BB},0.1)`, color:theme.label, border:`0.5px solid rgba(${BR},${BG},${BB},0.4)` }}>DEMO</span>
        </div>
        <span style={{ fontSize:16, fontWeight:600, color: theme.label }}>${fmt(price)}</span>
      </div>

      {/* Flow Indicators */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', borderBottom:`0.5px solid rgba(${BR},${BG},${BB},0.15)`, background:'rgba(0,0,0,0.3)' }}>
        <div style={{ padding:'8px 14px', borderRight:`0.5px solid rgba(255,255,255,0.05)` }}>
          <div style={{ fontSize:9, color:'var(--text3)', marginBottom:5, letterSpacing:0.5 }}>PRESSÃO COMPRA/VENDA</div>
          <div style={{ display:'flex', gap:4, alignItems:'center', marginBottom:4 }}>
            <span style={{ fontSize:12, fontWeight:600, color:`rgb(${BR},${BG},${BB})` }}>{buyPct}%</span>
            <span style={{ fontSize:10, color:'var(--text3)' }}>buy</span>
            <span style={{ fontSize:12, fontWeight:600, color:`rgb(${AR},${AG},${AB})`, marginLeft:4 }}>{sellPct}%</span>
            <span style={{ fontSize:10, color:'var(--text3)' }}>sell</span>
          </div>
          <div style={{ height:6, borderRadius:3, background:'rgba(255,255,255,0.05)', overflow:'hidden', display:'flex' }}>
            <div style={{ width:`${buyPct}%`, background:`rgb(${BR},${BG},${BB})`, transition:'width 0.4s' }} />
            <div style={{ width:`${sellPct}%`, background:`rgb(${AR},${AG},${AB})`, transition:'width 0.4s' }} />
          </div>
        </div>
        <div style={{ padding:'8px 14px', borderRight:`0.5px solid rgba(255,255,255,0.05)` }}>
          <div style={{ fontSize:9, color:'var(--text3)', marginBottom:5, letterSpacing:0.5 }}>CVD — DELTA ACUMULADO</div>
          <div style={{ fontSize:16, fontWeight:700, color: cvd>=0 ? `rgb(${BR},${BG},${BB})` : `rgb(${AR},${AG},${AB})` }}>
            {cvd>=0?'+':''}{fmtVol(Math.abs(cvd))}
          </div>
          <div style={{ fontSize:10, color:'var(--text3)', marginTop:2 }}>{cvd>=0?'▲ Compradores dominam':'▼ Vendedores dominam'}</div>
        </div>
        <div style={{ padding:'8px 14px', borderRight:`0.5px solid rgba(255,255,255,0.05)` }}>
          <div style={{ fontSize:9, color:'var(--text3)', marginBottom:5, letterSpacing:0.5 }}>GRANDES PLAYERS 🐋</div>
          {largeLots.length===0
            ? <div style={{ fontSize:11, color:'var(--text3)' }}>Aguardando lotes...</div>
            : largeLots.slice(0,3).map((t,i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:5, marginBottom:2 }}>
                <span style={{ fontSize:10, color: t.isBuy?`rgb(${BR},${BG},${BB})`:`rgb(${AR},${AG},${AB})`, fontWeight:600 }}>{t.isBuy?'▲':'▼'}</span>
                <span style={{ fontSize:10, color:'var(--text2)' }}>${fmt(t.price,0)}</span>
                <span style={{ fontSize:10, color:'#e0a84a', fontWeight:600 }}>{t.qty.toFixed(2)}</span>
              </div>
            ))}
        </div>
        <div style={{ padding:'8px 14px' }}>
          <div style={{ fontSize:9, color:'var(--text3)', marginBottom:5, letterSpacing:0.5 }}>ICEBERG 🧊</div>
          {icebergs.length===0
            ? <div style={{ fontSize:11, color:'var(--text3)' }}>Monitorando...</div>
            : icebergs.slice(0,3).map((ic,i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:5, marginBottom:2 }}>
                <span style={{ fontSize:10, color:'#e0a84a', fontWeight:600 }}>🧊 {ic.side.toUpperCase()}</span>
                <span style={{ fontSize:10, color:'var(--text2)' }}>${fmt(ic.price,0)}</span>
                <span style={{ fontSize:10, color:'var(--text3)' }}>{ic.size.toFixed(1)}</span>
              </div>
            ))}
        </div>
      </div>

      {/* Heatmap + DOM */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 210px' }}>
        <canvas ref={canvasRef} style={{ display:'block', width:'100%', height }} />
        <div style={{ borderLeft:`0.5px solid rgba(${BR},${BG},${BB},0.15)`, display:'flex', flexDirection:'column', background:'#060a08' }}>
          <div style={{ padding:'6px 10px', borderBottom:`0.5px solid rgba(255,255,255,0.05)`, fontSize:10, color:'var(--text2)' }}>DOM — Level 2</div>
          <div style={{ flex:1, overflowY:'auto' }}>
            {[...domRows.asks].reverse().map((l,i) => (
              <div key={i} style={{ display:'grid', gridTemplateColumns:'80px 1fr 44px', padding:'2px 8px', alignItems:'center' }}>
                <span style={{ fontSize:10, color:`rgb(${AR},${AG},${AB})` }}>${fmt(l.price,0)}</span>
                <div style={{ height:8, background:'rgba(255,255,255,0.04)', borderRadius:2, overflow:'hidden', margin:'0 4px' }}>
                  <div style={{ height:'100%', width:`${Math.round(l.size/maxSize*100)}%`, background:`rgb(${AR},${AG},${AB})`, opacity:0.7, borderRadius:2, transition:'width 0.3s' }} />
                </div>
                <span style={{ fontSize:9, color:'var(--text3)', textAlign:'right' }}>{l.size.toFixed(1)}</span>
              </div>
            ))}
            <div style={{ padding:'3px 8px', background:'rgba(255,255,255,0.03)', fontSize:10, color:theme.label, textAlign:'center', borderTop:`0.5px solid rgba(255,255,255,0.05)`, borderBottom:`0.5px solid rgba(255,255,255,0.05)` }}>
              Spread: ${domRows.asks[0]&&domRows.bids[0] ? fmt(domRows.asks[0].price-domRows.bids[0].price,1) : '—'}
            </div>
            {domRows.bids.map((l,i) => (
              <div key={i} style={{ display:'grid', gridTemplateColumns:'80px 1fr 44px', padding:'2px 8px', alignItems:'center' }}>
                <span style={{ fontSize:10, color:`rgb(${BR},${BG},${BB})` }}>${fmt(l.price,0)}</span>
                <div style={{ height:8, background:'rgba(255,255,255,0.04)', borderRadius:2, overflow:'hidden', margin:'0 4px' }}>
                  <div style={{ height:'100%', width:`${Math.round(l.size/maxSize*100)}%`, background:`rgb(${BR},${BG},${BB})`, opacity:0.7, borderRadius:2, transition:'width 0.3s' }} />
                </div>
                <span style={{ fontSize:9, color:'var(--text3)', textAlign:'right' }}>{l.size.toFixed(1)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Trades */}
      <div style={{ borderTop:`0.5px solid rgba(${BR},${BG},${BB},0.15)`, maxHeight:120, overflowY:'auto', background:'#060a08' }}>
        <div style={{ padding:'4px 12px', fontSize:10, color:'var(--text3)', borderBottom:`0.5px solid rgba(255,255,255,0.05)` }}>Live trades</div>
        {trades.map((t,i) => (
          <div key={i} style={{ display:'grid', gridTemplateColumns:'60px 1fr 80px 60px 24px', padding:'3px 12px', fontSize:11, borderBottom:'0.5px solid rgba(255,255,255,0.03)' }}>
            <span style={{ color:'var(--text3)' }}>{t.time}</span>
            <span style={{ fontWeight:500, color: t.isBuy?`rgb(${BR},${BG},${BB})`:`rgb(${AR},${AG},${AB})` }}>${fmt(t.price,0)}</span>
            <span style={{ textAlign:'right', color:'var(--text2)' }}>{t.qty.toFixed(3)}</span>
            <span style={{ textAlign:'right', color: t.isBuy?`rgb(${BR},${BG},${BB})`:`rgb(${AR},${AG},${AB})` }}>{t.isBuy?'BUY':'SELL'}</span>
            <span style={{ textAlign:'right', fontSize:9 }}>{t.qty>=(WHALE_THRESH[symbol]||5)?'🐋':''}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
