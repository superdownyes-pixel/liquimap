// Funções de servidor que mantêm o Supabase em sincronia com o Stripe.
// Usadas pelo webhook (/api/webhook) e pelo botão "Sincronizar com Stripe" do admin.
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
export const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

export const PAID_PLANS = ['starter', 'pro', 'full']
// Status do Stripe que liberam acesso (trialing = 7 dias grátis com cartão cadastrado)
export const ACTIVE_STATUSES = ['active', 'trialing']

export function planFromPriceId(priceId) {
  return {
    [process.env.STRIPE_PRICE_STARTER]: 'starter',
    [process.env.STRIPE_PRICE_PRO]: 'pro',
    [process.env.STRIPE_PRICE_FULL]: 'full',
  }[priceId] || null
}

// Procura o id do usuário no Supabase Auth pelo e-mail (para criar a linha em public.users se faltar)
async function findAuthUserId(email) {
  const target = email.toLowerCase()
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 1000 })
    if (error) { console.error('listUsers error:', error.message); return null }
    const hit = data.users.find(u => (u.email || '').toLowerCase() === target)
    if (hit) return hit
    if (data.users.length < 1000) return null
  }
  return null
}

// Atualiza a linha do usuário em public.users. Se a linha não existir, cria a partir do Supabase Auth.
// Retorna true se achou/criou o usuário, false se o e-mail não tem conta no LiquiMap.
export async function syncUser(email, fields) {
  if (!email) return false
  const { data, error } = await supabaseAdmin.from('users').update(fields).ilike('email', email).select('id')
  if (error) { console.error('syncUser update error:', error.message); return false }
  if (data && data.length > 0) return true

  const authUser = await findAuthUserId(email)
  if (!authUser) { console.warn('syncUser: nenhuma conta com o e-mail', email); return false }
  const { error: insErr } = await supabaseAdmin.from('users').upsert({
    id: authUser.id,
    email: authUser.email,
    name: authUser.user_metadata?.full_name || null,
    created_at: authUser.created_at,
    ...fields,
  }, { onConflict: 'id' })
  if (insErr) { console.error('syncUser insert error:', insErr.message); return false }
  return true
}

// Grava uma assinatura do Stripe nas tabelas subscriptions e users
export async function applySubscription(sub, email, planHint) {
  const plan = planFromPriceId(sub.items?.data?.[0]?.price?.id) || (PAID_PLANS.includes(planHint) ? planHint : 'starter')
  const active = ACTIVE_STATUSES.includes(sub.status)
  const trialEnd = sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null
  const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer?.id

  if (email) {
    const { error } = await supabaseAdmin.from('subscriptions').upsert({
      email,
      plan,
      stripe_subscription_id: sub.id,
      stripe_customer_id: customerId,
      status: sub.status,
      trial_end: trialEnd,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'email' })
    if (error) console.error('subscriptions upsert error:', error.message)
  }

  const found = await syncUser(email, {
    plan: active ? plan : 'cancelled',
    is_paying: active,
    ...(trialEnd ? { trial_end: trialEnd } : {}),
  })
  return { email, plan, status: sub.status, active, found }
}

// Descobre o e-mail do cliente de uma assinatura
export async function emailForSubscription(sub) {
  if (sub.customer && typeof sub.customer === 'object' && sub.customer.email) return sub.customer.email
  const { data } = await supabaseAdmin.from('subscriptions').select('email').eq('stripe_subscription_id', sub.id).maybeSingle()
  if (data?.email) return data.email
  const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer?.id
  if (!customerId) return null
  const customer = await stripe.customers.retrieve(customerId)
  return customer?.deleted ? null : customer.email
}
