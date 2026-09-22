import { useState } from 'react'
import { useBinanceFeed } from '../lib/useBinanceFeed'
import BinanceHeatmapCanvas from './BinanceHeatmapCanvas'

const SYMBOLS = ['BTCUSDT','ETHUSDT','SOLUSDT','BNBUSDT','XRPUSDT']
const LABELS = { BTCUSDT:'BTC/USDT', ETHUSDT:'ETH/USDT', SOLUSDT:'SOL/USDT', BNBUSDT:'BNB/USDT', XRPUSDT:'XRP/USDT' }

export default function HeatmapDemoLive() {
  const [sym, setSym] = useState('BTCUSDT')
  const { price, priceDir, change24h, buyPct, cvd, trades, whales, icebergs, domAsks, domBids, heatData, status } = useBinanceFeed(sym)

  const fmt = n => n == null ? '—' : Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const fmtQty = q => q >= 1 ? q.toFixed(2) : q.toFixed(4)
  const maxDom = Math.max(...domAsks.map(d => d.qty), ...domBids.map(d => d.qty), 0.001)
  const cvdColor = cvd >= 0 ? '#22d3a0' : '#e05a4a'
  const priceColor = priceDir > 0 ? '#22d3a0' : priceDir < 0 ? '#e05a4a' : '#e2e8f0'
  const stColor = status === 'live' ? '#22d3a0' : status === 'reconnecting' ? '#facc15' : '#64748b'

  return (
    <div style={{ background:'#0a0c14', border:'1px solid #1e2d4a', borderRadius:12, overflow:'hidden', fontFamily:"'Inter',sans-serif", maxWidth:960, margin:'0 auto' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 16px', background:'#0b0f1e', borderBottom:'1px solid #1e2d4a', flexWrap:'wrap', gap:8 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:8, height:8, borderRadius:'50%', background:stColor, boxShadow: status==='live' ? `0 0 6px ${stColor}` : 'none' }} />
          <select value={sym} onChange={e => setSym(e.target.value)}
            style={{ background:'#111827', border:'1px solid #1e2d4a', color:'#e2e8f0', borderRadius:6, padding:'4px 8px', fontSize:13, fontWeight:700, cursor:'pointer' }}>
            {SYMBOLS.map(s => <option key={s} value={s}>{LABELS[s]}</option>)}
          </select>
          <span style={{ fontSize:11, color:'#64748b' }}>Order Book Heatmap</span>
          <span style={{ background:`${stColor}20`, color:stColor, fontSize:10, fontWeight:700, padding:'2px 7px', borderRadius:4, letterSpacing:1 }}>
            {status === 'live' ? '🔴 LIVE' : status === 'reconnecting' ? '⏳ Reconectando' : 'Conectando...'}
          </span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:14 }}>
          {change24h !== null && <span style={{ fontSize:12, color: change24h >= 0 ? '#22d3a0' : '#e05a4a' }}>{change24h >= 0 ? '+' : ''}{change24h?.toFixed(2)}% 24h</span>}
          <span style={{ fontSize:20, fontWeight:800, color:priceColor }}>{price ? `$${fmt(price)}` : '—'}</span>
        </div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', padding:'10px 16px', gap:8, background:'#080a11', borderBottom:'1px solid #1e2d4a' }}>
        <div>
          <div style={{ fontSize:9, color:'#64748b', textTransform:'uppercase', letterSpacing:1, marginBottom:5 }}>Pressão Compra/Venda</div>
          <div style={{ fontSize:12, fontWeight:700, marginBottom:5 }}>
            <span style={{ color:'#22d3a0' }}>{buyPct}% buy</span> <span style={{ color:'#e05a4a' }}>{100-buyPct}% sell</span>
          </div>
          <div style={{ background:'#1e2d4a', borderRadius:4, height:4, overflow:'hidden' }}>
            <div style={{ width:`${buyPct}%`, height:'100%', background:'linear-gradient(90deg,#22d3a0,#60efcc)', transition:'width .4s' }} />
          </div>
        </div>
        <div>
          <div style={{ fontSize:9, color:'#64748b', textTransform:'uppercase', letterSpacing:1, marginBottom:5 }}>CVD — Delta Acumulado</div>
          <div style={{ fontSize:18, fontWeight:800, color:cvdColor }}>{cvd >= 0 ? '+' : ''}{cvd.toFixed(3)}</div>
          <div style={{ fontSize:10, color:cvdColor, marginTop:2 }}>{cvd >= 0 ? '▲ Compradores dominam' : '▼ Vendedores dominam'}</div>
        </div>
        <div>
          <div style={{ fontSize:9, color:'#64748b', textTransform:'uppercase', letterSpacing:1, marginBottom:5 }}>Grandes Players 🐋</div>
          {whales.length === 0
            ? <div style={{ fontSize:11, color:'#475569' }}>Aguardando lotes...</div>
            : whales.slice(0,2).map((w,i) => <div key={i} style={{ fontSize:11, color: w.isBuy ? '#22d3a0' : '#e05a4a', marginBottom:2 }}>{w.isBuy ? '▲ BUY' : '▼ SELL'} ${fmt(w.price)} × {fmtQty(w.qty)}</div>)
          }
        </div>
        <div>
          <div style={{ fontSize:9, color:'#64748b', textTransform:'uppercase', letterSpacing:1, marginBottom:5 }}>Iceberg 🧊</div>
          {icebergs.length === 0
            ? <div style={{ fontSize:11, color:'#475569' }}>Monitorando...</div>
            : icebergs.slice(0,2).map((w,i) => <div key={i} style={{ fontSize:11, color:'#60a5fa', marginBottom:2 }}>🧊 {w.isBuy ? 'BID' : 'ASK'} ${fmt(w.price)} {fmtQty(w.qty)}</div>)
          }
        </div>
      </div>
      <div style={{ display:'flex', height:340 }}>
        <div style={{ flex:1, position:'relative', background:'#080a11' }}>
          <BinanceHeatmapCanvas heatData={heatData} price={price} height={340} />
          <div style={{ position:'absolute', top:8, left:10, fontSize:9, color:'rgba(224,90,74,0.6)', fontWeight:700, letterSpacing:1 }}>ASK</div>
          <div style={{ position:'absolute', bottom:8, left:10, fontSize:9, color:'rgba(34,211,160,0.6)', fontWeight:700, letterSpacing:1 }}>BID</div>
        </div>
        <div style={{ width:170, borderLeft:'1px solid #1e2d4a', background:'#080a11', display:'flex', flexDirection:'column' }}>
          <div style={{ fontSize:9, color:'#64748b', fontWeight:700, textTransform:'uppercase', letterSpacing:1, padding:'6px 10px', borderBottom:'1px solid #1e2d4a' }}>DOM — Level 2</div>
          <div style={{ flex:1, overflowY:'auto' }}>
            {[...domAsks].reverse().map((a,i) => (
              <div key={`a${i}`} style={{ display:'flex', justifyContent:'space-between', padding:'2px 10px', fontSize:11, position:'relative' }}>
                <div style={{ position:'absolute', right:0, top:0, bottom:0, width:`${(a.qty/maxDom)*100}%`, background:'rgba(224,90,74,0.12)' }} />
                <span style={{ color:'#e05a4a', fontWeight:600, zIndex:1 }}>${fmt(a.price)}</span>
                <span style={{ color:'#94a3b8', fontSize:10, zIndex:1 }}>{fmtQty(a.qty)}</span>
              </div>
            ))}
            {domAsks[0] && domBids[0] && (
              <div style={{ padding:'3px 10px', background:'#0f1929', borderTop:'1px solid #1e2d4a', borderBottom:'1px solid #1e2d4a', fontSize:9, color:'#64748b', textAlign:'center' }}>
                spread ${(domAsks[0].price - domBids[0].price).toFixed(2)}
              </div>
            )}
            {domBids.map((b,i) => (
              <div key={`b${i}`} style={{ display:'flex', justifyContent:'space-between', padding:'2px 10px', fontSize:11, position:'relative' }}>
                <div style={{ position:'absolute', right:0, top:0, bottom:0, width:`${(b.qty/maxDom)*100}%`, background:'rgba(34,211,160,0.1)' }} />
                <span style={{ color:'#22d3a0', fontWeight:600, zIndex:1 }}>${fmt(b.price)}</span>
                <span style={{ color:'#94a3b8', fontSize:10, zIndex:1 }}>{fmtQty(b.qty)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div style={{ borderTop:'1px solid #1e2d4a', padding:'8px 16px', background:'#080a11' }}>
        <div style={{ fontSize:9, color:'#64748b', textTransform:'uppercase', letterSpacing:1, marginBottom:6 }}>Live Trades</div>
        <div style={{ display:'flex', gap:14, overflowX:'auto' }}>
          {trades.slice(0,10).map(t => (
            <div key={t.id} style={{ display:'flex', flexDirection:'column', gap:2, minWidth:80, fontSize:11, flexShrink:0 }}>
              <span style={{ color:'#64748b' }}>{t.time}</span>
              <span style={{ color: t.isBuy ? '#22d3a0' : '#e05a4a', fontWeight:700 }}>${fmt(t.price)}</span>
              <span style={{ color:'#94a3b8' }}>{fmtQty(t.qty)}</span>
              <div style={{ display:'flex', gap:3 }}>
                <span style={{ color: t.isBuy ? '#22d3a0' : '#e05a4a', fontSize:10 }}>{t.isBuy ? 'BUY' : 'SELL'}</span>
                {t.isWhale && <span>🐋</span>}
                {t.isIceberg && <span>🧊</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ padding:'6px 16px', borderTop:'1px solid #1e2d4a', fontSize:10, color:'#334155', display:'flex', justifyContent:'space-between', flexWrap:'wrap', gap:4 }}>
        <span>🔴 Dados reais Binance · Gratuito para crypto · Sem API key</span>
        <span>Planos pagos: B3 WIN/WDO · ES/NQ · Forex · 200+ pares</span>
      </div>
    </div>
  )
}
