import { useEffect, useRef, useState, useCallback } from 'react'

const THRESHOLDS = { btcusdt: 0.5, ethusdt: 5, solusdt: 500, bnbusdt: 50, xrpusdt: 50000 }
const getThreshold = sym => THRESHOLDS[sym.toLowerCase()] || 1

export function useBinanceFeed(symbol = 'BTCUSDT') {
  const sym = symbol.toLowerCase()
  const [price, setPrice] = useState(null)
  const [priceDir, setPriceDir] = useState(0)
  const [change24h, setChange24h] = useState(null)
  const [buyPct, setBuyPct] = useState(50)
  const [cvd, setCvd] = useState(0)
  const [trades, setTrades] = useState([])
  const [whales, setWhales] = useState([])
  const [icebergs, setIcebergs] = useState([])
  const [domAsks, setDomAsks] = useState([])
  const [domBids, setDomBids] = useState([])
  const [heatData, setHeatData] = useState({})
  const [status, setStatus] = useState('connecting')

  const alive = useRef(true)
  const wsTrade = useRef(null)
  const wsBook = useRef(null)
  const wsTicker = useRef(null)
  const lastPx = useRef(null)
  const cvdRef = useRef(0)
  const buyRef = useRef(0)
  const totRef = useRef(0)
  const recent = useRef([])
  const heatRef = useRef({})
  const snap = p => Math.round(p / 10) * 10

  function detectIceberg(px, qty) {
    const thr = getThreshold(sym)
    if (qty >= thr) return false
    const now = Date.now()
    recent.current.push({ key: snap(px), qty, ts: now })
    recent.current = recent.current.filter(t => now - t.ts < 4000)
    const cluster = recent.current.filter(t => t.key === snap(px))
    return cluster.length >= 5 && cluster.reduce((a, b) => a + b.qty, 0) >= thr * 0.6
  }

  const connectTrades = useCallback(() => {
    if (!alive.current) return
    const ws = new WebSocket(`wss://stream.binance.com/ws/${sym}@aggTrade`)
    wsTrade.current = ws
    ws.onopen = () => alive.current && setStatus('live')
    ws.onmessage = (e) => {
      if (!alive.current) return
      const d = JSON.parse(e.data)
      const px = parseFloat(d.p), qty = parseFloat(d.q), isBuy = !d.m
      if (lastPx.current !== null) setPriceDir(px > lastPx.current ? 1 : px < lastPx.current ? -1 : 0)
      lastPx.current = px
      setPrice(px)
      const ps = snap(px)
      heatRef.current[ps] = (heatRef.current[ps] || 0) + Math.min(qty * 2, 10)
      setHeatData({ ...heatRef.current })
      cvdRef.current += isBuy ? qty : -qty
      setCvd(cvdRef.current)
      totRef.current++
      if (isBuy) buyRef.current++
      setBuyPct(Math.round((buyRef.current / totRef.current) * 100))
      const isWhale = qty >= getThreshold(sym)
      const isIceberg = !isWhale && detectIceberg(px, qty)
      const trade = {
        id: d.t,
        time: new Date(d.T).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        price: px, qty, isBuy, isWhale, isIceberg,
      }
      setTrades(p => [trade, ...p].slice(0, 100))
      if (isWhale) setWhales(p => [trade, ...p].slice(0, 20))
      if (isIceberg) setIcebergs(p => [trade, ...p].slice(0, 20))
    }
    ws.onerror = () => { setStatus('error'); ws.close() }
    ws.onclose = () => { if (!alive.current) return; setStatus('reconnecting'); setTimeout(connectTrades, 3000) }
  }, [sym])

  const connectBook = useCallback(() => {
    if (!alive.current) return
    const ws = new WebSocket(`wss://stream.binance.com/ws/${sym}@depth20@100ms`)
    wsBook.current = ws
    ws.onmessage = (e) => {
      if (!alive.current) return
      const d = JSON.parse(e.data)
      setDomAsks(d.asks.slice(0, 15).map(([p, q]) => ({ price: parseFloat(p), qty: parseFloat(q) })))
      setDomBids(d.bids.slice(0, 15).map(([p, q]) => ({ price: parseFloat(p), qty: parseFloat(q) })))
      ;[...d.asks, ...d.bids].forEach(([p, q]) => {
        const qf = parseFloat(q)
        if (qf > 0.5) { const ps = snap(parseFloat(p)); heatRef.current[ps] = (heatRef.current[ps] || 0) + qf * 0.2 }
      })
    }
    ws.onclose = () => { if (alive.current) setTimeout(connectBook, 3000) }
  }, [sym])

  const connectTicker = useCallback(() => {
    if (!alive.current) return
    const ws = new WebSocket(`wss://stream.binance.com/ws/${sym}@ticker`)
    wsTicker.current = ws
    ws.onmessage = (e) => { if (!alive.current) return; const d = JSON.parse(e.data); setChange24h(parseFloat(d.P)) }
    ws.onclose = () => { if (alive.current) setTimeout(connectTicker, 5000) }
  }, [sym])

  useEffect(() => {
    alive.current = true
    cvdRef.current = 0; buyRef.current = 0; totRef.current = 0; heatRef.current = {}
    setStatus('connecting')
    connectTrades(); connectBook(); connectTicker()
    return () => { alive.current = false; wsTrade.current?.close(); wsBook.current?.close(); wsTicker.current?.close() }
  }, [sym, connectTrades, connectBook, connectTicker])

  useEffect(() => {
    const id = setInterval(() => {
      const h = heatRef.current
      for (const k in h) { h[k] *= 0.94; if (h[k] < 0.05) delete h[k] }
      setHeatData({ ...h })
    }, 200)
    return () => clearInterval(id)
  }, [])

  return { price, priceDir, change24h, buyPct, cvd, trades, whales, icebergs, domAsks, domBids, heatData, status, symbol }
}
