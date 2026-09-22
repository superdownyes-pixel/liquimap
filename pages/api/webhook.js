import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

export const config = { api: { bodyParser: false } }

const PAID_PLANS = ['starter', 'pro', 'full']
// Status do Stripe que liberam acesso (trialing = 7 dias grátis com cartão cadastrado)
const ACTIVE_STATUSES = ['active', 'trialing']

async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', c => chunks.push(c))
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

// Mantém a tabela `users` (usada pelo painel admin e pelo dashboard) em sincronia com o Stripe
async function syncUser(email, fields) {
  if (!email) return
  const { error } = await supabase.from('users').update(fields).ilike('email', email)
  if (error) console.error('syncUser error:', error.message)
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const sig = req.headers['stripe-signature']
  const body = await getRawBody(req)

  let event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object
      const email = session.customer_email || session.customer_details?.email
      const plan = PAID_PLANS.includes(session.metadata?.plan) ? session.metadata.plan : 'starter'

      let status = 'trialing'
      let trialEnd = null
      if (session.subscription) {
        const sub = await stripe.subscriptions.retrieve(session.subscription)
        status = sub.status
        trialEnd = sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null
      }

      await supabase.from('subscriptions').upsert({
        email,
        plan,
        stripe_subscription_id: session.subscription,
        stripe_customer_id: session.customer,
        status,
        trial_end: trialEnd,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'email' })

      await syncUser(email, {
        plan,
        is_paying: ACTIVE_STATUSES.includes(status),
        ...(trialEnd ? { trial_end: trialEnd } : {}),
      })
    }

    if (event.type === 'customer.subscription.updated') {
      const sub = event.data.object
      const priceId = sub.items?.data?.[0]?.price?.id
      const planFromPrice = {
        [process.env.STRIPE_PRICE_STARTER]: 'starter',
        [process.env.STRIPE_PRICE_PRO]: 'pro',
        [process.env.STRIPE_PRICE_FULL]: 'full',
      }[priceId]

      const { data: row } = await supabase.from('subscriptions').update({
        status: sub.status,
        ...(planFromPrice ? { plan: planFromPrice } : {}),
        updated_at: new Date().toISOString(),
      }).eq('stripe_subscription_id', sub.id).select('email, plan').maybeSingle()

      const active = ACTIVE_STATUSES.includes(sub.status)
      await syncUser(row?.email, {
        is_paying: active,
        plan: active ? (planFromPrice || row?.plan || 'starter') : 'cancelled',
      })
    }

    if (event.type === 'customer.subscription.deleted') {
      const sub = event.data.object
      const { data: row } = await supabase.from('subscriptions').update({
        status: 'canceled',
        updated_at: new Date().toISOString(),
      }).eq('stripe_subscription_id', sub.id).select('email').maybeSingle()

      await syncUser(row?.email, { is_paying: false, plan: 'cancelled' })
    }
  } catch (err) {
    console.error('Webhook handler error:', err)
    return res.status(500).json({ error: err.message })
  }

  res.json({ received: true })
}
