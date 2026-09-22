import { useEffect, useRef } from 'react'

export default function BinanceHeatmapCanvas({ heatData = {}, price = null, height = 340 }) {
  const canvasRef = useRef(null)
  const rafRef = useRef(null)
  const localHeat = useRef({})

  useEffect(() => { localHeat.current = { ...heatData } }, [heatData])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const ROWS = 30

    function render() {
      const W = canvas.width, H = canvas.height
      ctx.clearRect(0, 0, W, H)
      const px = price
      if (!px) {
        ctx.fillStyle = '#080a12'
        ctx.fillRect(0, 0, W, H)
        ctx.fillStyle = '#1e2d4a'
        ctx.font = '13px Inter'
        ctx.textAlign = 'center'
        ctx.fillText('Conectando...', W / 2, H / 2)
        rafRef.current = requestAnimationFrame(render)
        return
      }
      const heat = localHeat.current
      const range = 300, pxMax = px + range, rowH = H / ROWS
      const maxVal = Math.max(...Object.values(heat), 1)
      for (let i = 0; i < ROWS; i++) {
        const rowPx = pxMax - (i / ROWS) * (range * 2)
        const val = heat[Math.round(rowPx / 10) * 10] || 0
        const ratio = Math.min(val / maxVal, 1)
        const isAsk = rowPx > px
        let r, g, b
        if (isAsk) { r = 180 + Math.round(75 * ratio); g = Math.round(40 * (1 - ratio)); b = g }
        else { r = 0; g = Math.round(140 + 115 * ratio); b = Math.round(150 + 105 * ratio) }
        ctx.fillStyle = `rgba(${r},${g},${b},${ratio > 0.05 ? 0.15 + ratio * 0.75 : 0.08})`
        ctx.fillRect(0, i * rowH, W, rowH)
        ctx.fillStyle = 'rgba(30,45,74,0.25)'
        ctx.fillRect(0, i * rowH + rowH - 1, W, 1)
      }
      const priceY = ((pxMax - px) / (range * 2)) * H
      ctx.strokeStyle = 'rgba(255,255,255,0.5)'
      ctx.lineWidth = 1
      ctx.setLineDash([3, 4])
      ctx.beginPath(); ctx.moveTo(0, priceY); ctx.lineTo(W, priceY); ctx.stroke()
      ctx.setLineDash([])
      ctx.font = '10px Inter'; ctx.fillStyle = 'rgba(100,116,139,0.7)'; ctx.textAlign = 'left'
      for (let i = 0; i <= 6; i++) {
        ctx.fillText(`$${Math.round(pxMax - (i / 6) * range * 2).toLocaleString()}`, 4, (i / 6) * H + 10)
      }
      rafRef.current = requestAnimationFrame(render)
    }

    render()
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [price])

  return (
    <canvas ref={canvasRef} width={700} height={height}
      style={{ width: '100%', height, display: 'block', borderRadius: 4 }} />
  )
}
