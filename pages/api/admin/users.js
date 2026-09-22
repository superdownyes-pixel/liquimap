// API do painel admin — roda no servidor com a service role (ignora RLS).
// Só responde para e-mails da lista ADMIN_EMAILS, verificados pelo token do Supabase.
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

export const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || 'superdownyes@gmail.com,moises@liquimap.com.br,admin@liquimap.com.br')
  .split(',').map(e => e.trim().toLowerCase()).filter(Boolean)

const PLANS = ['trial', 'starter', 'pro', 'full', 'cancelled']

async function getAdmin(req) {
  const token = (req.headers.authorization || '').replace('Bearer ', '')
  if (!token) return null
  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data?.user) return null
  return ADMIN_EMAILS.includes((data.user.email || '').toLowerCase()) ? data.user : null
}

export default async function handler(req, res) {
  const admin = await getAdmin(req)
  if (!admin) return res.status(403).json({ error: 'Acesso negado' })

  if (req.method === 'GET') {
    const { data, error } = await supabase.from('users').select('*').order('created_at', { ascending: false })
    if (error) return res.status(500).json({ error: error.message })
    return res.json({ users: data || [] })
  }

  if (req.method === 'PATCH') {
    const { id, plan } = req.body || {}
    if (!id || !PLANS.includes(plan)) return res.status(400).json({ error: 'Dados inválidos' })
    const is_paying = !['trial', 'cancelled'].includes(plan)
    const { error } = await supabase.from('users').update({ plan, is_paying }).eq('id', id)
    if (error) return res.status(500).json({ error: error.message })
    return res.json({ ok: true, plan, is_paying })
  }

  res.status(405).end()
}
