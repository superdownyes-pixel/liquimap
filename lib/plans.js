export const PLANS = {
  starter: {
    id: 'starter',
    name: 'Starter',
    price: 29,
    priceId: process.env.STRIPE_PRICE_STARTER,
    markets: ['crypto'],
    features: {
      en: ['Crypto — 200+ pairs', 'Live order book heatmap', 'Depth of market (DOM)', 'Order flow tape', 'Liquidity alerts'],
      pt: ['Cripto — 200+ pares', 'Mapa de calor ao vivo', 'Profundidade de mercado (DOM)', 'Fluxo de ordens', 'Alertas de liquidez'],
    },
    missing: {
      en: ['Forex & Metals', 'Nasdaq / S&P500', 'B3 Brasil'],
      pt: ['Forex e Metais', 'Nasdaq / S&P500', 'B3 Brasil'],
    },
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 59,
    priceId: process.env.STRIPE_PRICE_PRO,
    popular: true,
    markets: ['crypto', 'forex', 'metals'],
    features: {
      en: ['Everything in Starter', 'Forex — 28 pairs', 'Gold, Silver, Platinum', 'Session replay (7 days)', 'Liquidity imbalance indicator'],
      pt: ['Tudo do Starter', 'Forex — 28 pares', 'Ouro, Prata, Platina', 'Replay de sessão (7 dias)', 'Indicador de desequilíbrio'],
    },
    missing: {
      en: ['Nasdaq / S&P500', 'B3 Brasil'],
      pt: ['Nasdaq / S&P500', 'B3 Brasil'],
    },
  },
  full: {
    id: 'full',
    name: 'Full',
    price: 99,
    priceId: process.env.STRIPE_PRICE_FULL,
    markets: ['crypto', 'forex', 'metals', 'nasdaq', 'b3'],
    features: {
      en: ['Everything in Pro', 'Nasdaq + NYSE L2', 'S&P500 futures ES/NQ', 'B3 Brasil — WIN, WDO', 'Session replay (30 days)', 'Iceberg detection', 'Priority support'],
      pt: ['Tudo do Pro', 'Nasdaq + NYSE L2', 'S&P500 futuros ES/NQ', 'B3 Brasil — WIN, WDO', 'Replay de sessão (30 dias)', 'Detecção de iceberg', 'Suporte prioritário'],
    },
    missing: { en: [], pt: [] },
  },
}

export const PLAN_LIST = ['starter', 'pro', 'full']
