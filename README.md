# FlowMap 🟢

Real-time order book heatmap platform — Crypto, Forex, Metals, Nasdaq and B3 Brasil.

## Tech Stack
- **Frontend**: Next.js 14 + React 18
- **Styling**: Tailwind CSS + CSS Variables
- **Auth + DB**: Supabase
- **Payments**: Stripe (with 7-day trial)
- **Deploy**: Vercel (free)
- **Data**: Binance WebSocket (crypto, free)

---

## 🚀 Quick Start (5 steps)

### 1. Clone and install
```bash
git clone https://github.com/youruser/flowmap
cd flowmap
npm install
```

### 2. Setup Supabase
1. Create account at https://supabase.com
2. Create a new project
3. Run this SQL in the Supabase SQL editor:

```sql
create table subscriptions (
  id uuid default gen_random_uuid() primary key,
  email text not null,
  plan text not null default 'starter',
  stripe_subscription_id text,
  status text default 'trialing',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table subscriptions enable row level security;

create policy "Users can read own subscription"
  on subscriptions for select
  using (email = auth.jwt() ->> 'email');
```

### 3. Setup Stripe
1. Create account at https://stripe.com
2. Create 3 products in the dashboard:
   - **FlowMap Starter** — $29/mo recurring → copy Price ID
   - **FlowMap Pro** — $59/mo recurring → copy Price ID
   - **FlowMap Full** — $99/mo recurring → copy Price ID
3. Go to Developers → Webhooks → Add endpoint:
   - URL: `https://yourdomain.com/api/webhook`
   - Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`

### 4. Configure environment variables
```bash
cp .env.local.example .env.local
```
Fill in `.env.local` with your keys from Supabase and Stripe.

### 5. Run locally
```bash
npm run dev
# Open http://localhost:3000
```

---

## 🌐 Deploy to Vercel (free)

```bash
npm install -g vercel
vercel
```

Or connect your GitHub repo at https://vercel.com/new and it deploys automatically on every push.

Add all environment variables in Vercel dashboard → Settings → Environment Variables.

---

## 📁 Project Structure

```
flowmap/
├── pages/
│   ├── index.js          # Landing page
│   ├── login.js          # Login
│   ├── signup.js         # Register + plan selection + Stripe
│   ├── dashboard.js      # Main app with live heatmap
│   ├── _app.js           # App context (auth + lang)
│   └── api/
│       ├── create-checkout.js   # Stripe checkout session
│       └── webhook.js           # Stripe webhook handler
├── components/
│   ├── Navbar.js         # Navigation + language toggle
│   └── HeatmapCanvas.js  # Core: live heatmap + DOM + trades
├── lib/
│   ├── supabase.js       # Supabase client
│   ├── plans.js          # Plan definitions (Starter/Pro/Full)
│   └── i18n.js           # EN/PT translations + auto-detect
├── styles/
│   └── globals.css       # Global styles + CSS variables
├── .env.local.example    # Environment variables template
├── next.config.js
├── tailwind.config.js
└── package.json
```

---

## 🔌 Adding More Data Feeds (Phase 2+)

### Forex + Metals (Polygon.io — $29/mo)
1. Sign up at https://polygon.io
2. Add to `.env.local`:
   ```
   POLYGON_API_KEY=your_key
   ```
3. Create `/pages/api/forex-stream.js` as a WebSocket proxy

### B3 Brasil (Cedro Technologies)
1. Contact: https://cedrotech.com
2. Request: Market Data API for B3
3. Negotiate per-user pricing model

---

## 💰 Revenue Model

| Plan    | Price  | Markets included              |
|---------|--------|-------------------------------|
| Starter | $29/mo | Crypto (200+ pairs)           |
| Pro     | $59/mo | Crypto + Forex + Metals       |
| Full    | $99/mo | All above + Nasdaq + B3 BR    |

Break-even: 1 client (Starter), 9 clients (Pro), 18 clients (Full)

---

## 🛡️ Security Notes
- Never commit `.env.local` to git
- Stripe webhook signature is verified server-side
- Supabase RLS (Row Level Security) protects user data
- API keys stay server-side only

---

Built with ❤️ — FlowMap © 2025
