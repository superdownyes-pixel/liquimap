import { useEffect, useState, useCallback } from 'react'

const FINNHUB_KEY = 'd0bff2hr01qhb45oq4pgd0bff2hr01qhb45oq4q0'

// ── Calendar data ──────────────────────────────────────────────────────────

const CAL_US = [
  { t:'08:15', n:'ADP Payroll — empregos privados',         imp:'high', win:'ALTO', prev:'148K',   atual:'162K',  cons:'150K'  },
  { t:'08:30', n:'Balança Comercial EUA',                   imp:'med',  win:'MED',  prev:'-68,9B', atual:null,    cons:'-70,2B'},
  { t:'09:00', n:'PMI Serviços ISM',                        imp:'high', win:'ALTO', prev:'51,4',   atual:null,    cons:'52,0'  },
  { t:'09:45', n:'PMI Composto S&P Global (final)',         imp:'med',  win:'MED',  prev:'52,1',   atual:null,    cons:'52,3'  },
  { t:'10:00', n:'Pedidos à Indústria (Factory Orders)',    imp:'med',  win:'MED',  prev:'+1,4%',  atual:null,    cons:'+0,8%' },
  { t:'10:30', n:'Estoques de Petróleo EIA',                imp:'med',  win:'MED',  prev:'-2,1M',  atual:null,    cons:'-1,5M' },
  { t:'11:00', n:'Discurso Fed — Membro do FOMC',           imp:'high', win:'ALTO', prev:null,     atual:null,    cons:null    },
  { t:'13:30', n:'Ata do FOMC — última reunião',            imp:'high', win:'ALTO', prev:null,     atual:null,    cons:null    },
  { t:'14:00', n:'Crédito ao Consumidor',                   imp:'low',  win:'BAIXO',prev:'$11,4B', atual:null,    cons:'$15,0B'},
  { t:'15:00', n:'Vendas de Imóveis Pendentes',             imp:'low',  win:'BAIXO',prev:'+0,7%',  atual:null,    cons:'+1,2%' },
  { t:'16:00', n:'Discurso Fed — Presidente do Fed',        imp:'high', win:'ALTO', prev:null,     atual:null,    cons:null    },
]

const CAL_BR = [
  { t:'08:00', n:'IPC-S semanal (FGV)',                     imp:'med',  win:'MED',  prev:'+0,22%', atual:'+0,18%',cons:'+0,21%'},
  { t:'09:00', n:'Nota de Crédito do BCB',                  imp:'high', win:'ALTO', prev:'R$562B', atual:null,    cons:null    },
  { t:'09:30', n:'PMI Composto Brasil (S&P Global)',         imp:'high', win:'ALTO', prev:'52,1',   atual:null,    cons:'52,5'  },
  { t:'10:00', n:'CAGED — Criação de empregos formais',     imp:'high', win:'ALTO', prev:'231K',   atual:null,    cons:'210K'  },
  { t:'11:00', n:'Ata do COPOM — publicação integral',      imp:'high', win:'ALTO', prev:null,     atual:null,    cons:null    },
  { t:'12:00', n:'Relatório de Mercado Focus (BCB)',        imp:'high', win:'ALTO', prev:null,     atual:null,    cons:null    },
  { t:'14:30', n:'Balança Comercial Semanal',               imp:'med',  win:'MED',  prev:'US$1,8B',atual:null,    cons:'US$2,1B'},
  { t:'15:00', n:'Discurso Diretor BCB — Política',        imp:'high', win:'ALTO', prev:null,     atual:null,    cons:null    },
  { t:'16:30', n:'Tesouro Direto — taxas de abertura',      imp:'low',  win:'BAIXO',prev:null,     atual:null,    cons:null    },
  { t:'17:30', n:'IPCA-15 quinzenal (prévia)',              imp:'high', win:'ALTO', prev:'+0,36%', atual:null,    cons:'+0,33%'},
]

// ── Demo news ──────────────────────────────────────────────────────────────

const NEWS_US_DEMO = [
  { t:'07:42', src:'Bloomberg',   h:'Fed Waller sinaliza pausa em corte de juros diante de inflação persistente', imp:'high', tags:['WIN ALTO','DÓLAR'] },
  { t:'07:55', src:'Reuters',     h:'S&P 500 futures sobem após dados de emprego melhores que o esperado',        imp:'high', tags:['WIN ALTO'] },
  { t:'08:10', src:'WSJ',         h:'Goldman Sachs eleva projeção do S&P para 5.800 no fim de 2026',             imp:'med',  tags:['WIN MED'] },
  { t:'08:31', src:'CNBC',        h:'ADP Payroll: +162K empregos em abril, acima do consenso de +150K',          imp:'high', tags:['WIN ALTO','DÓLAR'] },
  { t:'08:48', src:'FT',          h:'Petróleo recua com aumento inesperado de estoques nos EUA',                 imp:'med',  tags:['WIN MED','PETRO'] },
  { t:'09:15', src:'MarketWatch', h:'Nvidia sobe 2,3% no pré-mercado após guidance positivo para IA',            imp:'med',  tags:['NASDAQ'] },
  { t:'09:34', src:'Reuters',     h:'Dólar Index (DXY) cai para mínima de 3 semanas após ADP',                   imp:'high', tags:['WIN MED','WDO ALTO'] },
  { t:'09:52', src:'Bloomberg',   h:'Tesouro americano: yield de 10 anos recua para 4,42%',                      imp:'high', tags:['WIN ALTO'] },
  { t:'10:18', src:'CNBC',        h:'Apple confirma evento em maio — mercado aguarda anúncio de IA on-device',   imp:'low',  tags:['NASDAQ'] },
  { t:'10:45', src:'Reuters',     h:'China anuncia estímulo adicional de US$ 300 bi para infraestrutura',        imp:'high', tags:['WIN ALTO','COMMODITIES'] },
]

const NEWS_BR_DEMO = [
  { t:'07:30', src:'Valor',        h:'Ibovespa deve abrir em alta seguindo futuros americanos positivos',          imp:'high', tags:['WIN'] },
  { t:'07:55', src:'InfoMoney',    h:'Dólar abre em queda com melhora do humor global pós-ADP',                   imp:'high', tags:['WDO','WIN'] },
  { t:'08:20', src:'Bloomberg BR', h:'Ata do COPOM reforça tom hawkish — Selic deve ficar alta por mais tempo',   imp:'high', tags:['WIN MED','JUROS'] },
  { t:'08:45', src:'Valor',        h:'Petrobras: produção do pré-sal supera 3,8 milhões de barris/dia em março',  imp:'med',  tags:['PETR4'] },
  { t:'09:10', src:'Estadão',      h:'CAGED de março deve confirmar mercado de trabalho aquecido',                imp:'high', tags:['WIN'] },
  { t:'09:35', src:'Reuters BR',   h:'Vale anuncia manutenção preventiva em Carajás — produção impactada',        imp:'med',  tags:['VALE3'] },
  { t:'10:00', src:'InfoMoney',    h:'BTG Pactual eleva target do Ibovespa para 155.000 pontos em 2026',          imp:'med',  tags:['WIN'] },
  { t:'10:30', src:'Valor',        h:'IPC-S de abril vem abaixo do esperado, sinalizando desinflação',            imp:'high', tags:['WIN','COPOM'] },
]

// ── Macros ─────────────────────────────────────────────────────────────────

const MACRO_BASE  = { sp:5621, nq:19842, dx:104.21, oil:82.4, gold:2341, vix:14.8 }
const MACRO_CFG   = [
  { id:'sp',   label:'S&P 500',    step:2.5,  dec:0 },
  { id:'nq',   label:'Nasdaq',     step:10,   dec:0 },
  { id:'dx',   label:'DXY',        step:0.05, dec:2 },
  { id:'oil',  label:'WTI',        step:0.18, dec:2 },
  { id:'gold', label:'Ouro',       step:1.2,  dec:0 },
  { id:'vix',  label:'VIX',        step:0.12, dec:1 },
]

// ── Helpers ────────────────────────────────────────────────────────────────

function nowMin() {
  const n = new Date()
  return n.getHours() * 60 + n.getMinutes()
}

function toMin(t) {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

function winCls(w) {
  return w === 'ALTO' ? { bg:'rgba(255,61,90,.18)', color:'#ff3d5a' }
       : w === 'MED'  ? { bg:'rgba(255,210,77,.15)', color:'#ffd24d' }
       :                { bg:'rgba(107,122,150,.15)', color:'#6b7a96' }
}

function impColor(i) {
  return i === 'high' ? '#ff3d5a' : i === 'med' ? '#ffd24d' : 'rgba(255,255,255,.15)'
}

const C = {
  bg:'#0a0d12', bg2:'#111620', bg3:'#181e2a', bg4:'#1e2535',
  border:'rgba(255,255,255,0.07)', border2:'rgba(255,255,255,0.12)',
  text:'#e8edf5', muted:'#6b7a96', muted2:'#8a98b4',
  green:'#00e5a0', red:'#ff3d5a', yellow:'#ffd24d', blue:'#3d9eff', purple:'#a78bfa',
}

// ── Sub-components ─────────────────────────────────────────────────────────

function CalRow({ ev, isNext, passed }) {
  const wc   = winCls(ev.win)
  const dots = [1,2,3].map(x => (
    <div key={x} style={{
      width:5, height:5, borderRadius:'50%',
      background: x <= ({high:3,med:2,low:1}[ev.imp]) ? impColor(ev.imp) : 'rgba(255,255,255,.1)',
    }} />
  ))

  return (
    <div style={{
      display:'flex', alignItems:'stretch', borderBottom:`1px solid ${C.border}`,
      minHeight:44, opacity: passed ? 0.4 : 1,
      background: isNext ? 'rgba(61,158,255,.05)' : 'transparent',
      borderLeft: isNext ? `2px solid ${C.blue}` : '2px solid transparent',
    }}>
      <div style={{ minWidth:50, padding:'10px 0 8px 10px', fontFamily:'monospace', fontSize:10, color:C.muted }}>
        {ev.t}
        {isNext && <div style={{ fontSize:9, color:C.blue }}>PRÓX</div>}
      </div>
      <div style={{ flex:1, padding:'8px 6px 8px 0' }}>
        <div style={{ fontSize:11, color:C.text, lineHeight:1.35, marginBottom:4 }}>{ev.n}</div>
        <div style={{ display:'flex', alignItems:'center', gap:5, flexWrap:'wrap' }}>
          <span style={{ fontFamily:'monospace', fontSize:9, padding:'1px 5px', borderRadius:2, fontWeight:600, background:wc.bg, color:wc.color }}>
            WIN {ev.win}
          </span>
          <div style={{ display:'flex', gap:2 }}>{dots}</div>
        </div>
      </div>
      {(ev.cons || ev.prev || ev.atual !== undefined) && (
        <div style={{ minWidth:90, padding:'8px 10px', display:'flex', flexDirection:'column', justifyContent:'center', gap:3, textAlign:'right' }}>
          {ev.atual != null && (
            <div style={{ display:'flex', justifyContent:'space-between', gap:6 }}>
              <span style={{ fontFamily:'monospace', fontSize:9, color:C.muted }}>real</span>
              <span style={{ fontFamily:'monospace', fontSize:11, fontWeight:600, color:C.green }}>{ev.atual}</span>
            </div>
          )}
          {ev.cons && (
            <div style={{ display:'flex', justifyContent:'space-between', gap:6 }}>
              <span style={{ fontFamily:'monospace', fontSize:9, color:C.muted }}>cons</span>
              <span style={{ fontFamily:'monospace', fontSize:11, color:C.muted2 }}>{ev.cons}</span>
            </div>
          )}
          {ev.prev && !ev.atual && (
            <div style={{ display:'flex', justifyContent:'space-between', gap:6 }}>
              <span style={{ fontFamily:'monospace', fontSize:9, color:C.muted }}>ant</span>
              <span style={{ fontFamily:'monospace', fontSize:11, color:C.muted2 }}>{ev.prev}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function NewsItem({ item }) {
  const wc = winCls(item.imp === 'high' ? 'ALTO' : item.imp === 'med' ? 'MED' : 'BAIXO')
  return (
    <div style={{ padding:'10px 12px', borderBottom:`1px solid ${C.border}`, cursor:'pointer' }}
      onMouseEnter={e => e.currentTarget.style.background = C.bg3}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
      <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
        <span style={{ fontFamily:'monospace', fontSize:10, color:C.muted }}>{item.t}</span>
        <span style={{ fontFamily:'monospace', fontSize:9, padding:'1px 5px', borderRadius:2, background:C.bg3, color:C.muted2 }}>{item.src}</span>
      </div>
      <div style={{ fontSize:12, lineHeight:1.45, color:C.text, marginBottom:5 }}>{item.h}</div>
      <div style={{ display:'flex', alignItems:'center', gap:5, flexWrap:'wrap' }}>
        <span style={{ fontFamily:'monospace', fontSize:9, padding:'1px 6px', borderRadius:2, background:wc.bg, color:wc.color }}>
          {item.imp === 'high' ? 'ALTO IMPACTO' : item.imp === 'med' ? 'MÉDIO' : 'BAIXO'}
        </span>
        {item.tags.map((tag, i) => (
          <span key={i} style={{ fontFamily:'monospace', fontSize:9, padding:'1px 5px', borderRadius:2, background:'rgba(0,229,160,.1)', color:C.green }}>{tag}</span>
        ))}
      </div>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────

export default function MacroPanel() {
  const [clock,    setClock]    = useState('')
  const [macros,   setMacros]   = useState(() => ({ ...MACRO_BASE }))
  const [tab,      setTab]      = useState('cal-us')  // cal-us | cal-br | news-us | news-br
  const [newsUS,   setNewsUS]   = useState(NEWS_US_DEMO)
  const [newsBR,   setNewsBR]   = useState(NEWS_BR_DEMO)
  const [nextEvt,  setNextEvt]  = useState(null)

  // Clock
  useEffect(() => {
    const tick = () => setClock(new Date().toLocaleTimeString('pt-BR'))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  // Macro simulation
  useEffect(() => {
    const id = setInterval(() => {
      setMacros(prev => {
        const next = { ...prev }
        MACRO_CFG.forEach(m => {
          const d = (Math.random() - 0.48) * m.step
          next[m.id] = parseFloat((prev[m.id] + d).toFixed(m.dec))
        })
        return next
      })
    }, 900)
    return () => clearInterval(id)
  }, [])

  // Next event bar
  const computeNext = useCallback(() => {
    const nm  = nowMin()
    const all = [
      ...CAL_US.map(e => ({ ...e, country:'US' })),
      ...CAL_BR.map(e => ({ ...e, country:'BR' })),
    ].sort((a, b) => toMin(a.t) - toMin(b.t))
    const nxt = all.find(e => toMin(e.t) >= nm)
    if (!nxt) { setNextEvt(null); return }
    const diff = toMin(nxt.t) - nm
    const hh   = String(Math.floor(diff / 60)).padStart(2, '0')
    const mm   = String(diff % 60).padStart(2, '0')
    setNextEvt({ ...nxt, countdown: `em ${hh}h${mm}m` })
  }, [])

  useEffect(() => {
    computeNext()
    const id = setInterval(computeNext, 60000)
    return () => clearInterval(id)
  }, [computeNext])

  // Finnhub news
  useEffect(() => {
    async function fetchUS() {
      try {
        const r = await fetch(`https://finnhub.io/api/v1/news?category=general&token=${FINNHUB_KEY}`)
        if (!r.ok) return
        const data = await r.json()
        if (!Array.isArray(data) || data.length === 0) return
        const highKw = ['Fed','FOMC','rate','inflation','payroll','GDP','CPI']
        setNewsUS(data.slice(0, 14).map(n => {
          const dt  = new Date(n.datetime * 1000)
          const t   = dt.toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' })
          const imp = highKw.some(k => n.headline.toLowerCase().includes(k.toLowerCase())) ? 'high' : 'med'
          return { t, src: n.source || 'Finnhub', h: n.headline, imp, tags:['MERCADO'] }
        }))
      } catch (_) {}
    }
    async function fetchBR() {
      try {
        const r = await fetch(`https://finnhub.io/api/v1/news?category=forex&token=${FINNHUB_KEY}`)
        if (!r.ok) return
        const data = await r.json()
        if (!Array.isArray(data) || data.length === 0) return
        setNewsBR(data.slice(0, 12).map(n => {
          const dt = new Date(n.datetime * 1000)
          const t  = dt.toLocaleTimeString('pt-BR', { hour:'2-digit', minute:'2-digit' })
          return { t, src: n.source || 'Finnhub', h: n.headline, imp:'med', tags:['FOREX'] }
        }))
      } catch (_) {}
    }
    fetchUS(); fetchBR()
    const id = setInterval(() => { fetchUS(); fetchBR() }, 120000)
    return () => clearInterval(id)
  }, [])

  const nm = nowMin()
  const nextIdxUS = CAL_US.findIndex(e => toMin(e.t) >= nm)
  const nextIdxBR = CAL_BR.findIndex(e => toMin(e.t) >= nm)

  const tabs = [
    { key:'cal-us',  label:'Cal EUA' },
    { key:'cal-br',  label:'Cal BR'  },
    { key:'news-us', label:'News EUA' },
    { key:'news-br', label:'News BR'  },
  ]

  return (
    <div style={{ background:C.bg2, border:`1px solid ${C.border}`, borderRadius:12, overflow:'hidden', display:'flex', flexDirection:'column', fontFamily:"'Syne', system-ui, sans-serif" }}>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 14px', background:C.bg2, borderBottom:`1px solid ${C.border}` }}>
        <span style={{ fontSize:11, fontWeight:700, color:C.text, letterSpacing:'-0.3px' }}>
          Liqui<span style={{ color:C.green }}>Map</span>
          <span style={{ fontSize:10, color:C.muted, fontWeight:400, marginLeft:5 }}>· Macro</span>
        </span>
        <div style={{ display:'flex', alignItems:'center', gap:6, fontFamily:'monospace', fontSize:10, color:C.muted }}>
          <span style={{ width:6, height:6, borderRadius:'50%', background:C.green, display:'inline-block', animation:'pulse 1.6s infinite' }} />
          <span style={{ color:C.text, fontWeight:600 }}>{clock}</span>
        </div>
      </div>

      {/* Next event bar */}
      {nextEvt && (
        <div style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 12px', background:'rgba(61,158,255,.08)', borderBottom:`1px solid rgba(61,158,255,.2)`, fontFamily:'monospace', fontSize:10 }}>
          <span style={{ color:C.blue, fontWeight:600 }}>PRÓXIMO</span>
          <span style={{ color:C.text, flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{nextEvt.n}</span>
          <span style={{ fontFamily:'monospace', fontSize:9, padding:'1px 5px', borderRadius:2,
            background: nextEvt.win === 'ALTO' ? 'rgba(255,61,90,.18)' : 'rgba(255,210,77,.15)',
            color:       nextEvt.win === 'ALTO' ? C.red : C.yellow }}>WIN {nextEvt.win}</span>
          <span style={{ color:C.text, fontWeight:600, whiteSpace:'nowrap' }}>{nextEvt.countdown}</span>
        </div>
      )}

      {/* Macros grid */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', borderBottom:`1px solid ${C.border}`, background:C.bg }}>
        {MACRO_CFG.map(m => {
          const val  = macros[m.id]
          const chg  = ((val - MACRO_BASE[m.id]) / MACRO_BASE[m.id] * 100)
          const up   = chg >= 0
          return (
            <div key={m.id} style={{ padding:'6px 10px', borderRight:`1px solid ${C.border}` }}>
              <div style={{ fontFamily:'monospace', fontSize:9, color:C.muted, textTransform:'uppercase', letterSpacing:'.05em', marginBottom:2 }}>{m.label}</div>
              <div style={{ fontFamily:'monospace', fontSize:13, fontWeight:600, color: up ? C.green : C.red }}>
                {val.toLocaleString('pt-BR', { minimumFractionDigits: m.dec })}
              </div>
              <div style={{ fontFamily:'monospace', fontSize:9, color: up ? C.green : C.red }}>
                {chg >= 0 ? '+' : ''}{chg.toFixed(2).replace('.', ',')}%
              </div>
            </div>
          )
        })}
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', borderBottom:`1px solid ${C.border}`, background:C.bg2 }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            flex:1, padding:'7px 4px', fontSize:9, fontWeight:600, letterSpacing:'.04em',
            textTransform:'uppercase', color: tab === t.key ? C.text : C.muted,
            background:'transparent', border:'none', cursor:'pointer',
            borderBottom: tab === t.key ? `2px solid ${C.blue}` : '2px solid transparent',
          }}>{t.label}</button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex:1, overflowY:'auto', maxHeight:420 }}>

        {tab === 'cal-us' && CAL_US.map((ev, i) => (
          <CalRow key={i} ev={ev} isNext={i === nextIdxUS} passed={toMin(ev.t) < nm} />
        ))}

        {tab === 'cal-br' && CAL_BR.map((ev, i) => (
          <CalRow key={i} ev={ev} isNext={i === nextIdxBR} passed={toMin(ev.t) < nm} />
        ))}

        {tab === 'news-us' && newsUS.map((item, i) => (
          <NewsItem key={i} item={item} />
        ))}

        {tab === 'news-br' && newsBR.map((item, i) => (
          <NewsItem key={i} item={item} />
        ))}
      </div>

      {/* Legend */}
      <div style={{ display:'flex', alignItems:'center', gap:10, padding:'5px 12px', borderTop:`1px solid ${C.border}`, background:C.bg2, fontFamily:'monospace', fontSize:9, color:C.muted }}>
        <span><span style={{ width:7, height:7, borderRadius:'50%', background:C.red, display:'inline-block', marginRight:3 }}/>Alto WIN</span>
        <span><span style={{ width:7, height:7, borderRadius:'50%', background:C.yellow, display:'inline-block', marginRight:3 }}/>Médio</span>
        <span><span style={{ width:7, height:7, borderRadius:'50%', background:'rgba(255,255,255,.2)', display:'inline-block', marginRight:3 }}/>Baixo</span>
        <span style={{ marginLeft:'auto', color:C.blue }}>▶ Próximo</span>
      </div>
    </div>
  )
}
