import { useEffect, useState } from 'react'

const FALLBACK_NEWS = [
  { headline: 'Fed mantém taxas estáveis; mercados reagem com volatilidade', source: 'Reuters', datetime: Date.now() / 1000 - 600, url: '#' },
  { headline: 'Bitcoin supera resistência com volume institucional forte', source: 'CoinDesk', datetime: Date.now() / 1000 - 1800, url: '#' },
  { headline: 'Tensões geopolíticas no Oriente Médio afetam commodities', source: 'Bloomberg', datetime: Date.now() / 1000 - 3600, url: '#' },
  { headline: 'Dados de inflação dos EUA saem abaixo do esperado', source: 'WSJ', datetime: Date.now() / 1000 - 5400, url: '#' },
  { headline: 'BCE sinaliza possível corte de juros em junho', source: 'FT', datetime: Date.now() / 1000 - 7200, url: '#' },
  { headline: 'Goldman Sachs eleva previsão do S&P 500 para 2026', source: 'GS Research', datetime: Date.now() / 1000 - 9000, url: '#' },
  { headline: 'China injeta liquidez no mercado para estabilizar yuan', source: 'Reuters', datetime: Date.now() / 1000 - 10800, url: '#' },
  { headline: 'Ações de tecnologia lideram alta após balanços positivos', source: 'CNBC', datetime: Date.now() / 1000 - 12600, url: '#' },
]

const FALLBACK_CALENDAR = [
  { time: '08:30', event: 'US CPI MoM', actual: null, forecast: '0.3%', previous: '0.2%', impact: 'high', country: '🇺🇸' },
  { time: '08:30', event: 'US CPI YoY', actual: null, forecast: '3.1%', previous: '3.2%', impact: 'high', country: '🇺🇸' },
  { time: '10:00', event: 'US NAHB Housing Market Index', actual: null, forecast: '37', previous: '38', impact: 'medium', country: '🇺🇸' },
  { time: '10:30', event: 'EIA Crude Oil Inventories', actual: null, forecast: '-1.9M', previous: '3.08M', impact: 'high', country: '🛢️' },
  { time: '13:00', event: "Fed's Beige Book", actual: null, forecast: '—', previous: '—', impact: 'high', country: '🇺🇸' },
  { time: '14:00', event: "ECB's Cipollone Speaks", actual: null, forecast: '—', previous: '—', impact: 'medium', country: '🇪🇺' },
  { time: '02:45', event: 'French CPI YoY NSA', actual: null, forecast: '0.9%', previous: '0.9%', impact: 'medium', country: '🇫🇷' },
  { time: '05:00', event: 'Eurozone Industrial Production YoY', actual: null, forecast: '-1%', previous: '-1.2%', impact: 'medium', country: '🇪🇺' },
]

function timeAgo(ts) {
  const diff = Math.floor((Date.now() / 1000) - ts)
  if (diff < 60) return `${diff}s`
  if (diff < 3600) return `${Math.floor(diff / 60)}m`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  return `${Math.floor(diff / 86400)}d`
}

const impactLabel = { high: '🔴', medium: '🟡', low: '🟢' }

export default function NewsCalendar({ lang = 'pt' }) {
  const [news, setNews] = useState(FALLBACK_NEWS)
  const [activeTab, setActiveTab] = useState('news')
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    async function fetchNews() {
      try {
        const res = await fetch('https://finnhub.io/api/v1/news?category=general&token=d0bff2hr01qhb45oq4pgd0bff2hr01qhb45oq4q0')
        if (res.ok) {
          const data = await res.json()
          if (Array.isArray(data) && data.length > 0) {
            setNews(data.slice(0, 20).map(n => ({ headline: n.headline, source: n.source, datetime: n.datetime, url: n.url })))
          }
        }
      } catch (_) {}
    }
    fetchNews()
    const interval = setInterval(fetchNews, 60000)
    return () => clearInterval(interval)
  }, [])

  const filteredCalendar = filter === 'all' ? FALLBACK_CALENDAR : FALLBACK_CALENDAR.filter(e => e.impact === filter)
  const l = { news: lang === 'pt' ? 'Notícias' : 'News', calendar: lang === 'pt' ? 'Calendário' : 'Calendar' }

  return (
    <div style={{ background: 'var(--bg2)', border: '0.5px solid var(--border)', borderRadius: 12, overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 420 }}>
      <div style={{ display: 'flex', borderBottom: '0.5px solid var(--border)', background: 'var(--bg3)' }}>
        {['news', 'calendar'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            flex: 1, padding: '10px 0', fontSize: 12, fontWeight: 500,
            background: activeTab === tab ? 'var(--bg2)' : 'transparent',
            color: activeTab === tab ? 'var(--text)' : 'var(--text3)',
            border: 'none', borderBottom: activeTab === tab ? '2px solid var(--green2)' : '2px solid transparent', cursor: 'pointer',
          }}>
            {tab === 'news' ? `📰 ${l.news}` : `📅 ${l.calendar}`}
          </button>
        ))}
      </div>

      {activeTab === 'calendar' && (
        <div style={{ display: 'flex', gap: 6, padding: '8px 12px', borderBottom: '0.5px solid var(--border)' }}>
          {['all', 'high', 'medium'].map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              fontSize: 10, padding: '3px 10px', borderRadius: 4, cursor: 'pointer',
              background: filter === f ? 'var(--green3)' : 'transparent',
              color: filter === f ? 'var(--green2)' : 'var(--text3)',
              border: filter === f ? '0.5px solid var(--green)' : '0.5px solid var(--border2)',
            }}>
              {f === 'all' ? 'Todos' : f === 'high' ? '🔴 Alto' : '🟡 Médio'}
            </button>
          ))}
        </div>
      )}

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {activeTab === 'news' && news.map((item, i) => (
          <a key={i} href={item.url} target="_blank" rel="noopener noreferrer" style={{ display: 'block', padding: '10px 14px', borderBottom: '0.5px solid var(--border)', textDecoration: 'none' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg3)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
              <span style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.45, flex: 1 }}>{item.headline}</span>
              <span style={{ fontSize: 10, color: 'var(--text3)', whiteSpace: 'nowrap' }}>{timeAgo(item.datetime)}</span>
            </div>
            <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 3, background: 'var(--bg3)', color: 'var(--text3)', marginTop: 4, display: 'inline-block' }}>{item.source}</span>
          </a>
        ))}

        {activeTab === 'calendar' && (
          <div>
            <div style={{ padding: '6px 14px', fontSize: 10, fontWeight: 600, color: 'var(--green2)', background: 'var(--bg3)', borderBottom: '0.5px solid var(--border)', letterSpacing: 1 }}>
              HOJE — {new Date().toLocaleDateString('pt-BR', { weekday: 'long', month: 'long', day: 'numeric' })}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '55px 20px 1fr 60px 60px 60px', padding: '5px 14px', borderBottom: '0.5px solid var(--border)', gap: 6 }}>
              {['Hora', '', 'Evento', 'Real', 'Prev.', 'Ant.'].map((h, i) => (
                <span key={i} style={{ fontSize: 9, color: 'var(--text3)', fontWeight: 600 }}>{h}</span>
              ))}
            </div>
            {filteredCalendar.map((ev, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '55px 20px 1fr 60px 60px 60px', padding: '7px 14px', borderBottom: '0.5px solid var(--border)', gap: 6, alignItems: 'center' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg3)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <span style={{ fontSize: 11, color: 'var(--text2)', fontFamily: 'monospace' }}>{ev.time}</span>
                <span style={{ fontSize: 12 }}>{impactLabel[ev.impact]}</span>
                <span style={{ fontSize: 11, color: 'var(--text)' }}>{ev.country} {ev.event}</span>
                <span style={{ fontSize: 11, fontWeight: 600, textAlign: 'right', color: ev.actual ? 'var(--green2)' : 'var(--text3)' }}>{ev.actual || '—'}</span>
                <span style={{ fontSize: 11, color: 'var(--text3)', textAlign: 'right' }}>{ev.forecast}</span>
                <span style={{ fontSize: 11, color: 'var(--text3)', textAlign: 'right' }}>{ev.previous}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
