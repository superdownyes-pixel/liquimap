export const PLANS = {
  starter: {
    id: 'starter',
    name: 'Starter',
    price: 9,
    priceId: process.env.STRIPE_PRICE_STARTER,
    markets: ['crypto'],
    features: {
      en: ['200+ crypto pairs', 'Live order book heatmap', 'CVD + Buy/Sell pressure', 'Large Lot Tracker 🐋', 'Iceberg Detector 🧊', 'DOM Level 2', 'Bubble chart — liquidity tracking', 'Live volume by lot size'],
      pt: ['200+ pares cripto', 'Mapa de calor ao vivo', 'CVD + Pressão compra/venda', 'Rastreador de Grandes Players 🐋', 'Detector de Iceberg 🧊', 'DOM Nível 2', 'Gráfico de bolhas — liquidez', 'Volume ao vivo por lote'],
    },
    missing: {
      en: ['Forex & Metals', 'Nasdaq / S&P500', 'B3 Brasil'],
      pt: ['Forex e Metais', 'Nasdaq / S&P500', 'B3 Brasil'],
    },
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 29,
    priceId: process.env.STRIPE_PRICE_PRO,
    popular: true,
    markets: ['crypto', 'forex', 'metals'],
    features: {
      en: ['Everything in Starter', 'Forex — 28 pairs', 'Gold, Silver, Platinum', 'Liquidity imbalance indicator', 'Session replay (7 days)', 'Multi-symbol dashboard', 'Export data CSV'],
      pt: ['Tudo do Starter', 'Forex — 28 pares', 'Ouro, Prata, Platina', 'Indicador de desequilíbrio', 'Replay de sessão (7 dias)', 'Dashboard multi-símbolo', 'Exportar dados CSV'],
    },
    missing: {
      en: ['Nasdaq / S&P500', 'B3 Brasil'],
      pt: ['Nasdaq / S&P500', 'B3 Brasil'],
    },
  },
  full: {
    id: 'full',
    name: 'Full',
    price: 49,
    priceId: process.env.STRIPE_PRICE_FULL,
    markets: ['crypto', 'forex', 'metals', 'nasdaq', 'b3'],
    features: {
      en: ['Everything in Pro', 'Nasdaq + NYSE Level 2', 'S&P500 futures ES/NQ', 'B3 Brasil — WIN, WDO, DOL', 'Session replay (30 days)', 'Priority support', 'API access'],
      pt: ['Tudo do Pro', 'Nasdaq + NYSE Nível 2', 'S&P500 futuros ES/NQ', 'B3 Brasil — WIN, WDO, DOL', 'Replay de sessão (30 dias)', 'Suporte prioritário', 'Acesso à API'],
    },
    missing: { en: [], pt: [] },
  },
}

export const PLAN_LIST = ['starter', 'pro', 'full']
