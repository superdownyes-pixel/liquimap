import { useState, useEffect, useRef } from 'react'

// ── Constantes ────────────────────────────────────────────────────────────────
const INSTRUMENTS = {
  WIN: { name: 'WIN — Mini Índice', pointValue: 0.20, unit: 'pts', defaultStop: 200 },
  WDO: { name: 'WDO — Mini Dólar', pointValue: 10.00, unit: 'pts', defaultStop: 5  },
}
const MAX_CONSEC   = 3
const LOCK_MS      = 60 * 60 * 1000
const PAUSE_MS     = 15 * 60 * 1000
const CYAN  = '#00f3ff'
const GREEN = '#22c97a'
const RED   = '#e05a4a'
const AMBER = '#e0a84a'

// ── Áudio via Web Audio API ───────────────────────────────────────────────────
function playTone(notes, vol = 0.25) {
  try {
    const ctx  = new (window.AudioContext || window.webkitAudioContext)()
    let time   = ctx.currentTime
    notes.forEach(([freq, dur, type = 'sine']) => {
      const osc  = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain); gain.connect(ctx.destination)
      osc.frequency.value = freq; osc.type = type
      gain.gain.setValueAtTime(vol, time)
      gain.gain.exponentialRampToValueAtTime(0.001, time + dur)
      osc.start(time); osc.stop(time + dur)
      time += dur * 0.9
    })
  } catch (_) {}
}
const SFX = {
  win:  () => playTone([[523,0.12],[659,0.12],[784,0.22]]),
  loss: () => playTone([[400,0.15],[300,0.25]],'square'),
  lock: () => playTone([[880,0.08],[880,0.08],[880,0.08],[440,0.4]],'sawtooth', 0.15),
  pause:() => playTone([[600,0.15],[500,0.25]]),
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtBRL  = (n) => `R$\u00A0${Number(n).toFixed(2).replace('.', ',')}`
const fmtTime = (ms) => new Date(ms).toTimeString().slice(0, 5)
const fmtDate = (ms) => new Date(ms).toLocaleDateString('pt-BR')
const pad2    = (n)  => String(n).padStart(2, '0')

// ── Estilos compartilhados ───────────────────────────────────────────────────
const S = {
  panel: { borderRadius: 10, padding: '14px 16px' },
  label: { fontSize: 9, fontFamily: 'Share Tech Mono, monospace', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#1a6e7e' },
  val:   { fontFamily: 'Share Tech Mono, monospace', textShadow: '0 0 8px currentColor' },
  input: { width: '100%', padding: '8px 10px', borderRadius: 6, background: 'transparent', border: '1px solid #1a2e3e', color: CYAN, fontSize: 15, fontFamily: 'Share Tech Mono, monospace', outline: 'none', textShadow: `0 0 5px ${CYAN}50` },
}

// ── Sub-tab: Calculadora ─────────────────────────────────────────────────────
function TabCalc({ shared }) {
  const { instrument, setInstrument, accountBal, setAccountBal,
    riskPerTrade, setRiskPerTrade, dailyLimit, setDailyLimit,
    stopPoints, setStopPoints, consecLosses, lockUntil, dailyLoss,
    now, trades, registerResult, resetDay, alertSounds } = shared

  const inst      = INSTRUMENTS[instrument]
  const isLocked  = lockUntil && now < lockUntil
  const lockLeft  = isLocked ? Math.ceil((lockUntil - now) / 1000) : 0
  const contratos = Math.max(0, Math.floor(riskPerTrade / (stopPoints * inst.pointValue)))
  const riscoReal = contratos * stopPoints * inst.pointValue
  const riskPct   = accountBal > 0 ? (riskPerTrade / accountBal) * 100 : 0
  const dailyPct  = dailyLimit > 0 ? (dailyLoss / dailyLimit) * 100 : 0
  const riskColor = riskPct < 1 ? GREEN : riskPct < 2 ? AMBER : RED
  const riskLabel = riskPct < 1 ? 'CONSERVADOR' : riskPct < 2 ? 'MODERADO' : 'AGRESSIVO'

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
      {/* Esquerda: configuração */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Instrumento */}
        <div className="lcd-panel" style={S.panel}>
          <div style={{ ...S.label, marginBottom: 8 }}>&gt; INSTRUMENTO</div>
          <div style={{ position: 'relative', zIndex: 2, display: 'flex', gap: 8 }}>
            {Object.entries(INSTRUMENTS).map(([k, v]) => (
              <button key={k} onClick={() => { setInstrument(k); setStopPoints(v.defaultStop) }}
                className={k === instrument ? 'glow-btn-green' : ''}
                style={{ flex: 1, padding: '9px 0', borderRadius: 7, fontSize: 13, fontWeight: 700, cursor: 'pointer', letterSpacing: 2, fontFamily: 'Share Tech Mono, monospace',
                  background: instrument === k ? 'rgba(34,201,122,0.1)' : 'rgba(0,0,0,0.4)',
                  color: instrument === k ? GREEN : '#2a4a3a',
                  border: instrument === k ? `1px solid ${GREEN}` : '1px solid #1a2e3e',
                  textShadow: instrument === k ? `0 0 8px ${GREEN}` : 'none' }}>{k}</button>
            ))}
          </div>
          <div style={{ ...S.label, marginTop: 6 }}>{inst.name} · {fmtBRL(inst.pointValue)}/ponto/contrato</div>
        </div>

        {/* Inputs */}
        {[
          { label: 'CAPITAL_CONTA (R$)',       value: accountBal,   set: setAccountBal,   min: 1000 },
          { label: 'RISCO_OPERACAO (R$)',       value: riskPerTrade, set: setRiskPerTrade, min: 10   },
          { label: 'LIMITE_PERDA_DIARIA (R$)', value: dailyLimit,   set: setDailyLimit,   min: 50   },
          { label: `STOP_TECNICO (${inst.unit})`, value: stopPoints, set: setStopPoints,  min: 1    },
        ].map(({ label, value, set, min }) => (
          <div key={label} className="lcd-panel" style={S.panel}>
            <div style={{ ...S.label, marginBottom: 5 }}>&gt; {label}</div>
            <div style={{ position: 'relative', zIndex: 2 }}>
              <input type="number" min={min} value={value}
                onChange={e => set(Math.max(min, Number(e.target.value)))}
                style={S.input} />
            </div>
          </div>
        ))}
      </div>

      {/* Direita: resultado + monitor */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* LCD Contratos */}
        <div className="lcd-panel" style={{ ...S.panel, border: `1px solid ${riskColor}50` }}>
          <div style={{ ...S.label, marginBottom: 10 }}>&gt; UNITS_ALLOCATED</div>
          <div style={{ position: 'relative', zIndex: 2 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 14 }}>
              <span style={{ ...S.val, fontSize: 60, fontWeight: 700, color: riskColor, lineHeight: 1 }}>
                {pad2(contratos)}
              </span>
              <div>
                <div style={{ fontSize: 12, color: riskColor, fontFamily: 'Share Tech Mono, monospace', letterSpacing: 1 }}>{instrument}</div>
                <div style={S.label}>contratos</div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={S.label}>RISCO_REAL</span>
              <span style={{ ...S.val, fontSize: 13, color: riskColor }}>{fmtBRL(riscoReal)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
              <span style={S.label}>RISK_LEVEL</span>
              <span style={{ ...S.label, color: riskColor, textShadow: `0 0 6px ${riskColor}` }}>{riskLabel} · {riskPct.toFixed(1)}%</span>
            </div>
            <div style={{ height: 5, borderRadius: 3, background: '#0a1520', border: '1px solid #1a2e3e', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${Math.min(100, riskPct * 25)}%`, background: riskColor, boxShadow: `0 0 8px ${riskColor}`, borderRadius: 3, transition: 'width 0.4s' }} />
            </div>
            {contratos === 0 && (
              <div style={{ ...S.label, color: AMBER, background: 'rgba(224,168,74,0.08)', border: `1px solid ${AMBER}30`, padding: '5px 8px', borderRadius: 6, marginTop: 8 }}>
                ⚠ STOP_AMPLO — AJUSTE PARÂMETROS
              </div>
            )}
          </div>
        </div>

        {/* Monitor diário */}
        <div className="lcd-panel" style={S.panel}>
          <div style={{ ...S.label, marginBottom: 8 }}>&gt; MONITOR_DIARIO</div>
          <div style={{ position: 'relative', zIndex: 2 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={S.label}>PERDA_ACUM</span>
              <span style={{ ...S.val, fontSize: 12, color: dailyLoss > 0 ? RED : GREEN }}>{fmtBRL(dailyLoss)} / {fmtBRL(dailyLimit)}</span>
            </div>
            <div style={{ height: 4, borderRadius: 3, background: '#0a1520', border: '1px solid #1a2e3e', overflow: 'hidden', marginBottom: 10 }}>
              <div style={{ height: '100%', width: `${Math.min(100, dailyPct)}%`, background: dailyPct > 80 ? RED : dailyPct > 50 ? AMBER : GREEN, borderRadius: 3, transition: 'width 0.4s' }} />
            </div>
            <div style={{ ...S.label, marginBottom: 5 }}>STREAK_LOSS · TRAVA EM {MAX_CONSEC}</div>
            <div style={{ display: 'flex', gap: 5, marginBottom: 10 }}>
              {Array.from({ length: MAX_CONSEC }).map((_, i) => (
                <div key={i} style={{ flex: 1, height: 28, borderRadius: 5, background: i < consecLosses ? 'rgba(224,90,74,0.15)' : 'rgba(0,0,0,0.4)', border: `1px solid ${i < consecLosses ? RED : '#1a2e3e'}`, boxShadow: i < consecLosses ? `0 0 8px ${RED}50` : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: i < consecLosses ? RED : '#1a2e3e', fontFamily: 'Share Tech Mono, monospace', transition: 'all 0.3s' }}>
                  {i < consecLosses ? '✗' : '○'}
                </div>
              ))}
            </div>
            {!isLocked ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <button onClick={() => registerResult('win')} className="glow-btn-green" style={{ padding: '10px', borderRadius: 7, fontSize: 13, fontWeight: 700, cursor: 'pointer', background: 'rgba(34,201,122,0.08)', color: GREEN, border: `1px solid ${GREEN}50`, fontFamily: 'Share Tech Mono, monospace', letterSpacing: 1 }}>✓ WIN</button>
                <button onClick={() => registerResult('loss')} className="glow-btn-red" style={{ padding: '10px', borderRadius: 7, fontSize: 13, fontWeight: 700, cursor: 'pointer', background: 'rgba(224,90,74,0.08)', color: RED, border: `1px solid ${RED}50`, fontFamily: 'Share Tech Mono, monospace', letterSpacing: 1 }}>✗ LOSS</button>
              </div>
            ) : (
              <div style={{ background: `rgba(224,90,74,0.06)`, border: `1px solid ${RED}40`, borderRadius: 8, padding: '12px', textAlign: 'center' }}>
                <div style={{ ...S.label, color: RED, marginBottom: 4 }}>🔒 OVERTRADING_LOCK · ATIVO</div>
                <div style={{ ...S.val, fontSize: 34, color: RED, letterSpacing: 4 }}>{pad2(Math.floor(lockLeft / 60))}:{pad2(lockLeft % 60)}</div>
                <div style={{ ...S.label, color: '#4a1a1a', marginTop: 4 }}>NOVAS_ENTRADAS BLOQUEADAS</div>
              </div>
            )}
          </div>
        </div>

        {/* Histórico rápido */}
        {trades.length > 0 && (
          <div className="lcd-panel" style={S.panel}>
            <div style={{ position: 'relative', zIndex: 2 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={S.label}>&gt; LOG_OPERACOES</span>
                <button onClick={resetDay} style={{ fontSize: 9, color: '#1a4a5a', background: 'transparent', border: '1px solid #1a2e3e', padding: '2px 7px', borderRadius: 4, cursor: 'pointer', fontFamily: 'Share Tech Mono, monospace', letterSpacing: 1 }}>RESET_DIA</button>
              </div>
              {trades.slice(0, 6).map((t, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '45px 1fr 90px', fontSize: 10, padding: '2px 0', borderBottom: '1px solid #0a1520', fontFamily: 'Share Tech Mono, monospace' }}>
                  <span style={{ color: '#1a3a4a' }}>{fmtTime(t.time)}</span>
                  <span style={{ color: t.result === 'win' ? GREEN : RED }}>{t.result === 'win' ? '✓_WIN' : '✗_LOSS'}</span>
                  <span style={{ textAlign: 'right', color: t.result === 'win' ? GREEN : RED }}>{t.result === 'win' ? '+' : '-'}{fmtBRL(t.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Sub-tab: R/R Simulador ───────────────────────────────────────────────────
function TabRR({ shared }) {
  const { instrument, riskPerTrade, stopPoints } = shared
  const inst = INSTRUMENTS[instrument]
  const [entryPrice, setEntryPrice] = useState(instrument === 'WIN' ? 130000 : 5800)
  const [direction, setDirection]   = useState('buy')
  const [customStop, setCustomStop] = useState(stopPoints)

  useEffect(() => { setCustomStop(stopPoints) }, [stopPoints])

  const contratos = Math.max(0, Math.floor(riskPerTrade / (customStop * inst.pointValue)))
  const dir       = direction === 'buy' ? 1 : -1
  const targets   = [1, 2, 3].map(rr => ({
    rr,
    points: customStop * rr,
    price:  entryPrice + dir * customStop * rr,
    profit: contratos * customStop * rr * inst.pointValue,
  }))

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div className="lcd-panel" style={S.panel}>
          <div style={{ ...S.label, marginBottom: 8 }}>&gt; PARAMETROS_RR</div>
          <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* Direção */}
            <div>
              <div style={{ ...S.label, marginBottom: 5 }}>DIRECAO</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {['buy', 'sell'].map(d => (
                  <button key={d} onClick={() => setDirection(d)} className={d === direction ? 'glow-btn-green' : ''}
                    style={{ flex: 1, padding: '8px 0', borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Share Tech Mono, monospace', letterSpacing: 2, background: direction === d ? (d === 'buy' ? 'rgba(34,201,122,0.1)' : 'rgba(224,90,74,0.1)') : 'rgba(0,0,0,0.4)', color: direction === d ? (d === 'buy' ? GREEN : RED) : '#2a4a3a', border: direction === d ? `1px solid ${d === 'buy' ? GREEN : RED}` : '1px solid #1a2e3e' }}>
                    {d === 'buy' ? '▲ COMPRA' : '▼ VENDA'}
                  </button>
                ))}
              </div>
            </div>
            {[
              { label: 'PRECO_ENTRADA', value: entryPrice, set: setEntryPrice, step: 1 },
              { label: `STOP (${inst.unit})`,  value: customStop, set: setCustomStop, step: 1, min: 1 },
            ].map(({ label, value, set, step, min = 0 }) => (
              <div key={label}>
                <div style={{ ...S.label, marginBottom: 4 }}>{label}</div>
                <input type="number" step={step} min={min} value={value} onChange={e => set(Number(e.target.value))} style={S.input} />
              </div>
            ))}
            <div style={{ padding: '8px 10px', background: '#0a1520', borderRadius: 6, border: '1px solid #1a2e3e' }}>
              <div style={{ ...S.label, marginBottom: 2 }}>CONTRATOS CALCULADOS</div>
              <div style={{ ...S.val, fontSize: 22, color: GREEN }}>{pad2(contratos)} {instrument}</div>
              <div style={{ ...S.label, color: '#1a4a5a' }}>risco: {fmtBRL(contratos * customStop * inst.pointValue)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Alvos */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {targets.map(({ rr, points, price, profit }) => {
          const color = rr === 1 ? AMBER : rr === 2 ? GREEN : CYAN
          return (
            <div key={rr} className="lcd-panel" style={{ ...S.panel, border: `1px solid ${color}40` }}>
              <div style={{ position: 'relative', zIndex: 2 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ ...S.label, color }}>ALVO R:{rr} · {rr === 1 ? 'MÍNIMO' : rr === 2 ? 'PADRÃO' : 'ÓTIMO'}</span>
                  <span style={{ fontSize: 10, padding: '1px 7px', borderRadius: 10, background: `${color}15`, color, border: `0.5px solid ${color}50`, fontFamily: 'Share Tech Mono, monospace' }}>1:{rr}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={S.label}>PRECO_ALVO</span>
                  <span style={{ ...S.val, fontSize: 14, color }}>{price.toFixed(instrument === 'WIN' ? 0 : 2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={S.label}>PONTOS</span>
                  <span style={{ ...S.val, fontSize: 13, color }}>{points} {inst.unit}</span>
                </div>
                <div style={{ height: 1, background: '#1a2e3e', margin: '6px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={S.label}>LUCRO ESTIMADO</span>
                  <span style={{ ...S.val, fontSize: 16, color, textShadow: `0 0 10px ${color}` }}>+{fmtBRL(profit)}</span>
                </div>
              </div>
            </div>
          )
        })}

        {/* Linha de custo/benefício */}
        <div className="lcd-panel" style={{ ...S.panel, border: `1px solid ${CYAN}20` }}>
          <div style={{ ...S.label, marginBottom: 8, color: CYAN }}>&gt; RESUMO_OPERACAO</div>
          <div style={{ position: 'relative', zIndex: 2 }}>
            {[
              { label: 'Risco máximo',  val: `-${fmtBRL(riskPerTrade)}`,            color: RED   },
              { label: 'Alvo 1:1',      val: `+${fmtBRL(targets[0].profit)}`,       color: AMBER },
              { label: 'Alvo 1:2',      val: `+${fmtBRL(targets[1].profit)}`,       color: GREEN },
              { label: 'Alvo 1:3',      val: `+${fmtBRL(targets[2].profit)}`,       color: CYAN  },
            ].map(({ label, val, color }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', fontSize: 11, fontFamily: 'Share Tech Mono, monospace' }}>
                <span style={{ color: '#1a4a5a' }}>{label}</span>
                <span style={{ color }}>{val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Sub-tab: Diário ──────────────────────────────────────────────────────────
function TabDiary({ shared }) {
  const { trades } = shared
  const canvasRef  = useRef(null)
  const [note, setNote]  = useState('')
  const [filter, setFilter] = useState('all')

  // Equity curve
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || trades.length === 0) return
    const W = canvas.offsetWidth; const H = 120
    canvas.width = W; canvas.height = H
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, W, H)
    ctx.fillStyle = '#050a0f'; ctx.fillRect(0, 0, W, H)

    let equity = 0
    const points = trades.slice().reverse().map(t => {
      equity += t.result === 'win' ? t.amount : -t.amount
      return equity
    })
    if (points.length < 2) return
    const min = Math.min(...points, 0)
    const max = Math.max(...points, 0)
    const range = max - min || 1
    const toY = (v) => H - 10 - ((v - min) / range) * (H - 20)
    const toX = (i) => (i / (points.length - 1)) * (W - 10) + 5

    // Zero line
    ctx.strokeStyle = '#1a2e3e'; ctx.lineWidth = 1
    ctx.setLineDash([4, 4])
    ctx.beginPath(); ctx.moveTo(0, toY(0)); ctx.lineTo(W, toY(0)); ctx.stroke()
    ctx.setLineDash([])

    // Gradient fill
    const grad = ctx.createLinearGradient(0, 0, 0, H)
    const lastVal = points[points.length - 1]
    if (lastVal >= 0) {
      grad.addColorStop(0, 'rgba(34,201,122,0.3)')
      grad.addColorStop(1, 'rgba(34,201,122,0)')
    } else {
      grad.addColorStop(0, 'rgba(224,90,74,0)')
      grad.addColorStop(1, 'rgba(224,90,74,0.25)')
    }
    ctx.beginPath()
    ctx.moveTo(toX(0), toY(0))
    points.forEach((v, i) => ctx.lineTo(toX(i), toY(v)))
    ctx.lineTo(toX(points.length - 1), toY(0))
    ctx.closePath(); ctx.fillStyle = grad; ctx.fill()

    // Line
    ctx.strokeStyle = lastVal >= 0 ? GREEN : RED
    ctx.lineWidth = 2; ctx.shadowColor = lastVal >= 0 ? GREEN : RED; ctx.shadowBlur = 6
    ctx.beginPath()
    points.forEach((v, i) => i === 0 ? ctx.moveTo(toX(i), toY(v)) : ctx.lineTo(toX(i), toY(v)))
    ctx.stroke()
  }, [trades])

  const equity = trades.reduce((acc, t) => acc + (t.result === 'win' ? t.amount : -t.amount), 0)
  const filtered = filter === 'all' ? trades : trades.filter(t => t.result === filter)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Equity curve */}
      <div className="lcd-panel" style={S.panel}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={S.label}>&gt; EQUITY_CURVE</span>
          <span style={{ ...S.val, fontSize: 16, color: equity >= 0 ? GREEN : RED }}>
            {equity >= 0 ? '+' : ''}{fmtBRL(equity)}
          </span>
        </div>
        <div style={{ position: 'relative', zIndex: 2 }}>
          {trades.length >= 2
            ? <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: 120 }} />
            : <div style={{ height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', ...S.label }}>AGUARDANDO_DADOS · REGISTRE TRADES</div>
          }
        </div>
      </div>

      {/* Filtros + lista */}
      <div className="lcd-panel" style={S.panel}>
        <div style={{ ...S.label, marginBottom: 8 }}>&gt; HISTORICO_OPERACOES</div>
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
            {['all', 'win', 'loss'].map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{ fontSize: 10, padding: '3px 10px', borderRadius: 4, cursor: 'pointer', fontFamily: 'Share Tech Mono, monospace', letterSpacing: 1, background: filter === f ? (f === 'win' ? 'rgba(34,201,122,0.1)' : f === 'loss' ? 'rgba(224,90,74,0.1)' : 'rgba(0,243,255,0.05)') : 'transparent', color: filter === f ? (f === 'win' ? GREEN : f === 'loss' ? RED : CYAN) : '#1a4a5a', border: `1px solid ${filter === f ? (f === 'win' ? GREEN : f === 'loss' ? RED : CYAN) : '#1a2e3e'}` }}>
                {f === 'all' ? 'TODOS' : f === 'win' ? '✓ WINS' : '✗ LOSSES'}
              </button>
            ))}
          </div>

          <div style={{ maxHeight: 280, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
            {filtered.length === 0 && (
              <div style={{ ...S.label, color: '#1a2e3e', padding: '20px 0', textAlign: 'center' }}>SEM_REGISTROS</div>
            )}
            {filtered.map((t, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '45px 55px 1fr 90px', fontSize: 10, padding: '5px 8px', borderRadius: 5, background: 'rgba(0,0,0,0.3)', fontFamily: 'Share Tech Mono, monospace', gap: 4 }}>
                <span style={{ color: '#1a3a4a' }}>{fmtTime(t.time)}</span>
                <span style={{ color: t.result === 'win' ? GREEN : RED }}>{t.result === 'win' ? '✓_WIN' : '✗_LOSS'}</span>
                <span style={{ color: '#1a4a5a' }}>{t.note || '—'}</span>
                <span style={{ textAlign: 'right', color: t.result === 'win' ? GREEN : RED, fontWeight: 700 }}>
                  {t.result === 'win' ? '+' : '-'}{fmtBRL(t.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Sub-tab: Relatório ───────────────────────────────────────────────────────
function TabReport({ shared }) {
  const { trades } = shared
  if (trades.length === 0) return (
    <div className="lcd-panel" style={{ ...S.panel, padding: '60px', textAlign: 'center' }}>
      <div style={{ ...S.label, color: '#1a2e3e', fontSize: 11 }}>SEM_DADOS · REGISTRE OPERAÇÕES NA ABA CALCULADORA</div>
    </div>
  )

  const wins      = trades.filter(t => t.result === 'win')
  const losses    = trades.filter(t => t.result === 'loss')
  const winRate   = trades.length > 0 ? (wins.length / trades.length * 100).toFixed(1) : 0
  const avgWin    = wins.length  > 0 ? wins.reduce((a, t) => a + t.amount, 0) / wins.length : 0
  const avgLoss   = losses.length > 0 ? losses.reduce((a, t) => a + t.amount, 0) / losses.length : 0
  const totalPnL  = trades.reduce((a, t) => a + (t.result === 'win' ? t.amount : -t.amount), 0)

  // Max drawdown
  let peak = 0, equity = 0, maxDD = 0
  trades.slice().reverse().forEach(t => {
    equity += t.result === 'win' ? t.amount : -t.amount
    if (equity > peak) peak = equity
    const dd = peak - equity
    if (dd > maxDD) maxDD = dd
  })

  // Análise por hora
  const byHour = {}
  trades.forEach(t => {
    const h = new Date(t.time).getHours()
    if (!byHour[h]) byHour[h] = { wins: 0, losses: 0 }
    byHour[h][t.result === 'win' ? 'wins' : 'losses']++
  })
  const hourStats = Object.entries(byHour).map(([h, v]) => ({
    hour: Number(h), total: v.wins + v.losses,
    winRate: ((v.wins / (v.wins + v.losses)) * 100).toFixed(0),
  })).sort((a, b) => b.winRate - a.winRate)

  const bestHour  = hourStats[0]
  const worstHour = hourStats[hourStats.length - 1]

  const metrics = [
    { label: 'WIN_RATE',       val: `${winRate}%`,          color: Number(winRate) >= 50 ? GREEN : RED },
    { label: 'TOTAL_OPERACOES',val: `${trades.length}`,      color: CYAN  },
    { label: 'WINS / LOSSES',  val: `${wins.length} / ${losses.length}`, color: AMBER },
    { label: 'MEDIA_WIN',      val: fmtBRL(avgWin),          color: GREEN },
    { label: 'MEDIA_LOSS',     val: fmtBRL(avgLoss),         color: RED   },
    { label: 'MAX_DRAWDOWN',   val: fmtBRL(maxDD),           color: maxDD > 200 ? RED : AMBER },
    { label: 'PNL_TOTAL',      val: `${totalPnL >= 0 ? '+' : ''}${fmtBRL(totalPnL)}`, color: totalPnL >= 0 ? GREEN : RED },
    { label: 'FATOR_LUCRO',    val: avgLoss > 0 ? (avgWin / avgLoss).toFixed(2) : '—', color: CYAN },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {metrics.map(({ label, val, color }) => (
          <div key={label} className="lcd-panel" style={{ ...S.panel, padding: '12px 14px' }}>
            <div style={{ ...S.label, marginBottom: 4 }}>{label}</div>
            <div style={{ ...S.val, fontSize: 20, color, lineHeight: 1 }}>{val}</div>
          </div>
        ))}
      </div>

      {hourStats.length > 0 && (
        <div className="lcd-panel" style={S.panel}>
          <div style={{ ...S.label, marginBottom: 10 }}>&gt; ANALISE_HORARIO</div>
          <div style={{ position: 'relative', zIndex: 2, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
            <div style={{ padding: '8px 10px', background: 'rgba(34,201,122,0.06)', border: `1px solid ${GREEN}30`, borderRadius: 7 }}>
              <div style={{ ...S.label, color: GREEN, marginBottom: 4 }}>MELHOR_HORARIO</div>
              <div style={{ ...S.val, fontSize: 22, color: GREEN }}>{pad2(bestHour?.hour)}:00</div>
              <div style={{ ...S.label, color: '#1a6e7e' }}>win rate {bestHour?.winRate}% · {bestHour?.total} trades</div>
            </div>
            <div style={{ padding: '8px 10px', background: 'rgba(224,90,74,0.06)', border: `1px solid ${RED}30`, borderRadius: 7 }}>
              <div style={{ ...S.label, color: RED, marginBottom: 4 }}>PIOR_HORARIO</div>
              <div style={{ ...S.val, fontSize: 22, color: RED }}>{pad2(worstHour?.hour)}:00</div>
              <div style={{ ...S.label, color: '#4a1a1a' }}>win rate {worstHour?.winRate}% · {worstHour?.total} trades</div>
            </div>
          </div>

          {/* Barras por hora */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {hourStats.slice(0, 6).map(({ hour, winRate, total }) => (
              <div key={hour} style={{ display: 'grid', gridTemplateColumns: '50px 1fr 40px', gap: 8, alignItems: 'center', fontSize: 10, fontFamily: 'Share Tech Mono, monospace' }}>
                <span style={{ color: '#1a4a5a' }}>{pad2(hour)}:00</span>
                <div style={{ height: 6, background: '#0a1520', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${winRate}%`, background: winRate >= 50 ? GREEN : RED, borderRadius: 3 }} />
                </div>
                <span style={{ color: winRate >= 50 ? GREEN : RED, textAlign: 'right' }}>{winRate}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Sub-tab: Alertas ─────────────────────────────────────────────────────────
function TabAlerts({ shared }) {
  const { alertSounds, setAlertSounds } = shared
  const toggle = (key) => setAlertSounds(prev => ({ ...prev, [key]: !prev[key] }))

  const alerts = [
    { key: 'win',   label: 'SOM_WIN',          desc: 'Toca ao registrar uma vitória',            sfx: SFX.win,   color: GREEN },
    { key: 'loss',  label: 'SOM_LOSS',          desc: 'Toca ao registrar uma perda',              sfx: SFX.loss,  color: RED   },
    { key: 'lock',  label: 'ALARME_TRAVA',      desc: 'Alarme ao ativar o bloqueio de overtrading', sfx: SFX.lock, color: AMBER },
    { key: 'pause', label: 'ALERTA_PAUSA',      desc: 'Som de aviso ao sugerir pausa (2 losses)', sfx: SFX.pause, color: CYAN  },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 560 }}>
      <div className="lcd-panel" style={S.panel}>
        <div style={{ ...S.label, marginBottom: 4 }}>&gt; CONFIGURACAO_ALERTAS_SONOROS</div>
        <div style={{ ...S.label, color: '#1a3a4a', marginBottom: 12 }}>sons gerados via web audio api · sem arquivos externos</div>
        <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {alerts.map(({ key, label, desc, sfx, color }) => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: alertSounds[key] ? `${color}08` : 'rgba(0,0,0,0.3)', border: `1px solid ${alertSounds[key] ? color + '40' : '#1a2e3e'}`, borderRadius: 8, transition: 'all 0.2s' }}>
              <button onClick={() => toggle(key)} style={{ width: 36, height: 20, borderRadius: 10, background: alertSounds[key] ? color : '#1a2e3e', border: 'none', cursor: 'pointer', position: 'relative', flexShrink: 0, boxShadow: alertSounds[key] ? `0 0 8px ${color}60` : 'none', transition: 'all 0.3s' }}>
                <div style={{ width: 14, height: 14, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: alertSounds[key] ? 19 : 3, transition: 'left 0.2s' }} />
              </button>
              <div style={{ flex: 1 }}>
                <div style={{ ...S.label, color: alertSounds[key] ? color : '#1a4a5a' }}>{label}</div>
                <div style={{ fontSize: 10, color: '#1a3a4a', fontFamily: 'Share Tech Mono, monospace', marginTop: 2 }}>{desc}</div>
              </div>
              <button onClick={() => sfx()} style={{ fontSize: 10, padding: '4px 10px', borderRadius: 5, cursor: 'pointer', background: 'transparent', border: `1px solid ${color}30`, color, fontFamily: 'Share Tech Mono, monospace', letterSpacing: 1 }}>▶ TEST</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Sub-tab: Timer ───────────────────────────────────────────────────────────
function TabTimer({ shared }) {
  const { consecLosses, isLocked, lockUntil, now } = shared
  const [pauseUntil,  setPauseUntil]  = useState(null)
  const [isPausing,   setIsPausing]   = useState(false)

  const pauseLeft   = pauseUntil && now < pauseUntil ? Math.ceil((pauseUntil - now) / 1000) : 0
  const lockLeft    = isLocked ? Math.ceil((lockUntil - now) / 1000) : 0

  function startPause() { setPauseUntil(Date.now() + PAUSE_MS); setIsPausing(true); SFX.pause() }
  function skipPause()  { setPauseUntil(null); setIsPausing(false) }

  const stages = [
    { losses: 0, label: 'OPERANDO_NORMALMENTE', color: GREEN,  desc: 'Sem perdas consecutivas. Foco total.' },
    { losses: 1, label: 'ATENCAO_1_LOSS',       color: AMBER,  desc: '1 perda. Mantenha o processo.' },
    { losses: 2, label: 'ALERTA_2_LOSSES',      color: AMBER,  desc: '2 seguidas. Considere pausa de 15 min antes do próximo trade.' },
    { losses: 3, label: 'TRAVA_ATIVADA',        color: RED,    desc: '3 seguidas. Sistema bloqueado por 1 hora.' },
  ]
  const currentStage = stages[Math.min(consecLosses, 3)]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 560 }}>
      {/* Status atual */}
      <div className="lcd-panel" style={{ ...S.panel, border: `1px solid ${currentStage.color}40` }}>
        <div style={{ ...S.label, marginBottom: 8 }}>&gt; STATUS_EMOCIONAL</div>
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ ...S.val, fontSize: 15, color: currentStage.color, marginBottom: 6, letterSpacing: 2 }}>
            {currentStage.label}
          </div>
          <div style={{ fontSize: 11, color: '#1a4a5a', fontFamily: 'Share Tech Mono, monospace', marginBottom: 14 }}>
            {currentStage.desc}
          </div>
          {/* Indicadores de losses */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
            {Array.from({ length: MAX_CONSEC }).map((_, i) => (
              <div key={i} style={{ flex: 1, height: 36, borderRadius: 6, background: i < consecLosses ? `${RED}15` : 'rgba(0,0,0,0.4)', border: `1px solid ${i < consecLosses ? RED : '#1a2e3e'}`, boxShadow: i < consecLosses ? `0 0 10px ${RED}50` : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: i < consecLosses ? RED : '#1a2e3e', fontFamily: 'Share Tech Mono', transition: 'all 0.3s' }}>
                {i < consecLosses ? '✗' : '○'}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pausa inteligente (2 losses) */}
      {consecLosses >= 2 && !isLocked && (
        <div className="lcd-panel" style={{ ...S.panel, border: `1px solid ${AMBER}40` }}>
          <div style={{ ...S.label, color: AMBER, marginBottom: 8 }}>&gt; PAUSA_INTELIGENTE_SUGERIDA</div>
          <div style={{ position: 'relative', zIndex: 2 }}>
            {!pauseLeft ? (
              <>
                <div style={{ fontSize: 11, color: '#1a4a5a', fontFamily: 'Share Tech Mono, monospace', marginBottom: 12 }}>
                  Você tem 2 perdas seguidas. Pesquisas mostram que pausas de 15 min reduzem overtrading em até 40%.
                </div>
                <button onClick={startPause} className="glow-btn-green" style={{ width: '100%', padding: '11px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', background: 'rgba(224,168,74,0.1)', color: AMBER, border: `1px solid ${AMBER}50`, fontFamily: 'Share Tech Mono, monospace', letterSpacing: 2 }}>
                  ⏱ INICIAR PAUSA 15_MIN
                </button>
              </>
            ) : (
              <div style={{ textAlign: 'center' }}>
                <div style={{ ...S.label, color: AMBER, marginBottom: 6 }}>PAUSA_ATIVA · RESPIRE</div>
                <div style={{ ...S.val, fontSize: 48, color: AMBER, letterSpacing: 6, marginBottom: 8 }}>
                  {pad2(Math.floor(pauseLeft / 60))}:{pad2(pauseLeft % 60)}
                </div>
                <div style={{ width: '100%', height: 4, background: '#0a1520', borderRadius: 3, overflow: 'hidden', marginBottom: 12 }}>
                  <div style={{ height: '100%', width: `${(1 - pauseLeft / (PAUSE_MS / 1000)) * 100}%`, background: AMBER, boxShadow: `0 0 8px ${AMBER}`, borderRadius: 3, transition: 'width 1s linear' }} />
                </div>
                <button onClick={skipPause} style={{ fontSize: 10, padding: '5px 16px', borderRadius: 5, cursor: 'pointer', background: 'transparent', border: '1px solid #1a2e3e', color: '#1a4a5a', fontFamily: 'Share Tech Mono, monospace', letterSpacing: 1 }}>PULAR_PAUSA</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Trava ativa */}
      {isLocked && (
        <div className="lcd-panel" style={{ ...S.panel, border: `1px solid ${RED}50`, textAlign: 'center' }}>
          <div style={{ ...S.label, color: RED, marginBottom: 8 }}>&gt; OVERTRADING_LOCK · SISTEMA_BLOQUEADO</div>
          <div style={{ position: 'relative', zIndex: 2 }}>
            <div style={{ ...S.val, fontSize: 52, color: RED, letterSpacing: 6, marginBottom: 8, textShadow: `0 0 20px ${RED}` }}>
              {pad2(Math.floor(lockLeft / 60))}:{pad2(lockLeft % 60)}
            </div>
            <div style={{ width: '100%', height: 5, background: '#0a1520', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${(1 - lockLeft / (LOCK_MS / 1000)) * 100}%`, background: RED, boxShadow: `0 0 8px ${RED}`, borderRadius: 3, transition: 'width 1s linear' }} />
            </div>
            <div style={{ ...S.label, color: '#4a1a1a', marginTop: 10 }}>USE ESSE TEMPO: ANALISE SEUS TRADES NO DIÁRIO</div>
          </div>
        </div>
      )}

      {/* Dicas */}
      {consecLosses === 0 && !isLocked && (
        <div className="lcd-panel" style={S.panel}>
          <div style={{ ...S.label, color: GREEN, marginBottom: 10 }}>&gt; PROTOCOLO_ANTI_OVERTRADING</div>
          <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              { n: '01', txt: '2 losses seguidos → sugestão de pausa 15 min' },
              { n: '02', txt: '3 losses seguidos → bloqueio automático 1 hora' },
              { n: '03', txt: 'Limite diário atingido → bloqueio automático 1 hora' },
              { n: '04', txt: 'Use o diário para identificar padrões de perda' },
            ].map(({ n, txt }) => (
              <div key={n} style={{ display: 'flex', gap: 8, fontSize: 10, fontFamily: 'Share Tech Mono, monospace' }}>
                <span style={{ color: '#1a6e7e', flexShrink: 0 }}>[{n}]</span>
                <span style={{ color: '#1a4a5a' }}>{txt}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Componente principal ─────────────────────────────────────────────────────
export default function LiquiMind() {
  const [activeTab,    setActiveTab]    = useState('calc')
  const [instrument,   setInstrument]   = useState('WIN')
  const [accountBal,   setAccountBal]   = useState(10000)
  const [riskPerTrade, setRiskPerTrade] = useState(100)
  const [dailyLimit,   setDailyLimit]   = useState(300)
  const [stopPoints,   setStopPoints]   = useState(200)
  const [consecLosses, setConsecLosses] = useState(0)
  const [lockUntil,    setLockUntil]    = useState(null)
  const [dailyLoss,    setDailyLoss]    = useState(0)
  const [trades,       setTrades]       = useState([])
  const [now,          setNow]          = useState(Date.now())
  const [alertSounds,  setAlertSounds]  = useState({ win: true, loss: true, lock: true, pause: true })

  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem('liquimind') || '{}')
      if (s.instrument)    setInstrument(s.instrument)
      if (s.accountBal)    setAccountBal(s.accountBal)
      if (s.riskPerTrade)  setRiskPerTrade(s.riskPerTrade)
      if (s.dailyLimit)    setDailyLimit(s.dailyLimit)
      if (s.stopPoints)    setStopPoints(s.stopPoints)
      if (s.consecLosses !== undefined) setConsecLosses(s.consecLosses)
      if (s.lockUntil)     setLockUntil(s.lockUntil)
      if (s.dailyLoss)     setDailyLoss(s.dailyLoss)
      if (s.trades)        setTrades(s.trades)
      if (s.alertSounds)   setAlertSounds(s.alertSounds)
    } catch (_) {}
  }, [])

  useEffect(() => {
    localStorage.setItem('liquimind', JSON.stringify({
      instrument, accountBal, riskPerTrade, dailyLimit, stopPoints,
      consecLosses, lockUntil, dailyLoss, trades, alertSounds,
    }))
  }, [instrument, accountBal, riskPerTrade, dailyLimit, stopPoints,
      consecLosses, lockUntil, dailyLoss, trades, alertSounds])

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  const isLocked = lockUntil && now < lockUntil

  function registerResult(result) {
    if (isLocked) return
    const newTrades = [{ result, amount: riskPerTrade, time: Date.now() }, ...trades].slice(0, 100)
    setTrades(newTrades)
    if (result === 'win') {
      if (alertSounds.win) SFX.win()
      setConsecLosses(0)
    } else {
      if (alertSounds.loss) SFX.loss()
      const nc = consecLosses + 1
      const nl = dailyLoss + riskPerTrade
      setConsecLosses(nc)
      setDailyLoss(nl)
      if (nc >= MAX_CONSEC || nl >= dailyLimit) {
        if (alertSounds.lock) SFX.lock()
        setLockUntil(Date.now() + LOCK_MS)
      }
    }
  }

  function resetDay() {
    setConsecLosses(0); setLockUntil(null); setDailyLoss(0); setTrades([])
  }

  const shared = {
    instrument, setInstrument, accountBal, setAccountBal,
    riskPerTrade, setRiskPerTrade, dailyLimit, setDailyLimit,
    stopPoints, setStopPoints, consecLosses, lockUntil, dailyLoss,
    now, trades, registerResult, resetDay, alertSounds, setAlertSounds,
    isLocked,
  }

  const TABS = [
    { key: 'calc',    label: '🧮 Calculadora' },
    { key: 'rr',      label: '📐 R/R' },
    { key: 'diary',   label: '📓 Diário' },
    { key: 'report',  label: '📊 Relatório' },
    { key: 'alerts',  label: '🔔 Alertas' },
    { key: 'timer',   label: '⏱ Timer' },
  ]

  return (
    <div style={{ fontFamily: "'Share Tech Mono', monospace" }}>
      {/* Header */}
      <div className="lcd-panel" style={{ borderRadius: 12, padding: '12px 20px', marginBottom: 14 }}>
        <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <span style={{ ...S.val, fontSize: 17, fontWeight: 700, color: CYAN, letterSpacing: 2 }}>LIQUIMIND_AI</span>
            <span style={{ ...S.label, color: '#1a4a5a', marginLeft: 10 }}>v2.0 · COPILOTO DE RISCO</span>
          </div>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            {isLocked && (
              <span style={{ ...S.label, color: RED, textShadow: `0 0 8px ${RED}` }}>🔒 BLOQUEADO</span>
            )}
            <span style={{ ...S.label, color: '#1a4a5a' }}>{new Date(now).toTimeString().slice(0, 8)}</span>
          </div>
        </div>
      </div>

      {/* Sub-tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 14, flexWrap: 'wrap' }}>
        {TABS.map(({ key, label }) => (
          <button key={key} onClick={() => setActiveTab(key)} style={{
            padding: '7px 14px', borderRadius: 7, fontSize: 11, cursor: 'pointer',
            fontFamily: 'Share Tech Mono, monospace', letterSpacing: 1,
            background: activeTab === key ? 'rgba(0,243,255,0.08)' : 'rgba(0,0,0,0.4)',
            color: activeTab === key ? CYAN : '#1a4a5a',
            border: activeTab === key ? `1px solid ${CYAN}40` : '1px solid #1a2e3e',
            boxShadow: activeTab === key ? `0 0 10px ${CYAN}20` : 'none',
            transition: 'all 0.2s',
          }}>{label}</button>
        ))}
      </div>

      {/* Conteúdo */}
      {activeTab === 'calc'   && <TabCalc   shared={shared} />}
      {activeTab === 'rr'     && <TabRR     shared={shared} />}
      {activeTab === 'diary'  && <TabDiary  shared={shared} />}
      {activeTab === 'report' && <TabReport shared={shared} />}
      {activeTab === 'alerts' && <TabAlerts shared={shared} />}
      {activeTab === 'timer'  && <TabTimer  shared={shared} />}
    </div>
  )
}
