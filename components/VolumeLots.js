import { useEffect, useRef, useState } from 'react'

const SYMBOLS = { 'BTC/USDT': 'btcusdt', 'ETH/USDT': 'ethusdt', 'SOL/USDT': 'solusdt', 'BNB/USDT': 'bnbusdt', 'XRP/USDT': 'xrpusdt' }
const BUCKETS = [
  { label: '0–0.1',  min: 0,    max: 0.1,  color: '#334' },
  { label: '0.1–0.5',min: 0.1,  max: 0.5,  color: '#2a4a3a' },
  { label: '0.5–1',  min: 0.5,  max: 1,    color: '#1a5a3a' },
  { label: '1–5',    min: 1,    max: 5,    color: '#1a7a4a' },
  { label: '5–10',   min: 5,    max: 10,   color: '#e0a84a' },
  { label: '10–50',  min: 10,   max: 50,   color: '#e07030' },
  { label: '50+',    min: 50,   max: 99999, color: '#e04030' },
]

export default function VolumeLots({ symbol = 'BTC/USDT', demo = false }) {
  const wsRef  = useRef(null)
  const [buys,  setBuys]  = useState(BUCKETS.map(() => 0))
  const [sells, setSells] = useState(BUCKETS.map(() => 0))
  const [total, setTotal] = useState({ buy: 0, sell: 0 })
  const sym = SYMBOLS[symbol] || 'btcusdt'

  useEffect(() => {
    let alive = true
    let buyAcc  = BUCKETS.map(() => 0)
    let sellAcc = BUCKETS.map(() => 0)
    let totalBuy = 0, totalSell = 0

    function addTrade(qty, isBuy) {
      const idx = BUCKETS.findIndex(b => qty >= b.min && qty < b.max)
      if (idx < 0) return
      if (isBuy) { buyAcc  = buyAcc.map((v,i)  => i===idx ? v+qty : v); totalBuy  += qty }
      else        { sellAcc = sellAcc.map((v,i) => i===idx ? v+qty : v); totalSell += qty }
      setBuys([...buyAcc]); setSells([...sellAcc])
      setTotal({ buy: totalBuy, sell: totalSell })
    }

    if (demo) {
      const interval = setInterval(() => {
        if (!alive) return
        const isBuy = Math.random() > 0.47
        const qty   = Math.random() < 0.02 ? 50 + Math.random() * 50
                    : Math.random() < 0.06 ? 10 + Math.random() * 40
                    : Math.random() < 0.15 ? 1  + Math.random() * 9
                    : Math.random() * 1
        addTrade(qty, isBuy)
      }, 150)
      return () => { alive = false; clearInterval(interval) }
    }

    function connect() {
      if (!alive) return
      const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${sym}@aggTrade`)
      wsRef.current = ws
      ws.onclose = () => alive && setTimeout(connect, 3000)
      ws.onmessage = (e) => {
        if (!alive) return
        const d = JSON.parse(e.data)
        addTrade(+d.q, !d.m)
      }
    }
    connect()
    return () => { alive = false; try { wsRef.current?.close() } catch(_){} }
  }, [sym, demo])

  const maxVal = Math.max(...buys, ...sells, 1)
  const fmt = (n) => n >= 1000 ? `${(n/1000).toFixed(1)}k` : n.toFixed(1)
  const totalVol = total.buy + total.sell
  const buyPct   = totalVol > 0 ? Math.round(total.buy / totalVol * 100) : 50

  return (
    <div style={{ background: 'var(--bg2)', borderRadius: 12, overflow: 'hidden', border: '0.5px solid var(--border2)', padding: '0 0 8px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 14px', borderBottom: '0.5px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="dot-live" style={{ background: 'var(--green2)' }} />
          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{symbol}</span>
          <span style={{ fontSize: 11, color: 'var(--text3)' }}>Volume por Lote</span>
          {demo && <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 4, background: 'rgba(34,201,122,0.1)', color: 'var(--green2)', border: '0.5px solid var(--green)' }}>DEMO</span>}
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <span style={{ fontSize: 11, color: 'var(--green2)', fontWeight: 600 }}>▲ {fmt(total.buy)} ({buyPct}%)</span>
          <span style={{ fontSize: 11, color: 'var(--red)', fontWeight: 600 }}>▼ {fmt(total.sell)} ({100-buyPct}%)</span>
        </div>
      </div>

      <div style={{ padding: '10px 14px 4px', display: 'flex', flexDirection: 'column', gap: 5 }}>
        {/* Header */}
        <div style={{ display: 'grid', gridTemplateColumns: '70px 1fr 60px 1fr 60px', gap: 4, marginBottom: 4 }}>
          <span style={{ fontSize: 9, color: 'var(--text3)', textAlign: 'right' }}>LOTE</span>
          <span style={{ fontSize: 9, color: 'var(--green2)', textAlign: 'right' }}>COMPRA</span>
          <span />
          <span style={{ fontSize: 9, color: 'var(--red)' }}>VENDA</span>
          <span style={{ fontSize: 9, color: 'var(--text3)', textAlign: 'right' }}>LOTE</span>
        </div>
        {BUCKETS.map((b, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '70px 1fr 60px 1fr 60px', gap: 4, alignItems: 'center' }}>
            {/* Buy side */}
            <span style={{ fontSize: 10, color: 'var(--green2)', textAlign: 'right', fontFamily: 'monospace' }}>{fmt(buys[i])}</span>
            <div style={{ height: 10, background: 'var(--bg3)', borderRadius: 2, overflow: 'hidden', display: 'flex', justifyContent: 'flex-end' }}>
              <div style={{ height: '100%', width: `${Math.round(buys[i]/maxVal*100)}%`, background: 'var(--green2)', opacity: 0.75, borderRadius: 2, transition: 'width 0.3s' }} />
            </div>
            {/* Label */}
            <span style={{ fontSize: 9, color: b.min >= 10 ? '#e0a84a' : b.min >= 1 ? 'var(--text2)' : 'var(--text3)', textAlign: 'center', fontWeight: b.min >= 5 ? 700 : 400 }}>
              {b.min >= 50 ? '🐋' : b.min >= 10 ? '🔶' : ''}{b.label}
            </span>
            {/* Sell side */}
            <div style={{ height: 10, background: 'var(--bg3)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${Math.round(sells[i]/maxVal*100)}%`, background: 'var(--red)', opacity: 0.75, borderRadius: 2, transition: 'width 0.3s' }} />
            </div>
            <span style={{ fontSize: 10, color: 'var(--red)', textAlign: 'left', fontFamily: 'monospace' }}>{fmt(sells[i])}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
