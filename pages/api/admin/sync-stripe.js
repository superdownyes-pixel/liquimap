// Botão "Sincronizar com Stripe" do painel admin.
// Lê todas as assinaturas do Stripe e corrige o acesso de quem paga no Supabase
// (útil para membros que pagaram enquanto o webhook não funcionava).
import { ADMIN_EMAILS } from './users'
import { stripe, supabaseAdmin, applySubscription, emailForSubscription } from '../../../lib/stripeSync'

async function getAdmin(req) {
  const token = (req.headers.authorization || '').replace('Bearer ', '')
  if (!token) return null
  const { data, error } = await supabaseAdmin.auth.getUser(token)
  if (error || !data?.user) return null
  return ADMIN_EMAILS.includes((data.user.email || '').toLowerCase()) ? data.user : null
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const admin = await getAdmin(req)
  if (!admin) return res.status(403).json({ error: 'Acesso negado' })

  try {
    const results = []
    for await (const sub of stripe.subscriptions.list({ status: 'all', limit: 100, expand: ['data.customer'] })) {
      // Ignora assinaturas antigas já encerradas há muito tempo que não tenham cliente com e-mail
      const email = await emailForSubscription(sub)
      if (!email) continue
      results.push(await applySubscription(sub, email))
    }

    // Se um cliente tiver mais de uma assinatura, a ativa prevalece: reaplica as ativas por último
    for (const r of results.filter(r => r.active)) {
      await supabaseAdmin.from('users').update({ plan: r.plan, is_paying: true }).ilike('email', r.email)
    }

    const active = results.filter(r => r.active)
    return res.json({
      total: results.length,
      ativos: active.length,
      liberados: active.filter(r => r.found).map(r => `${r.email} (${r.plan})`),
      semConta: active.filter(r => !r.found).map(r => r.email),
    })
  } catch (err) {
    console.error('sync-stripe error:', err)
    return res.status(500).json({ error: err.message })
  }
}
