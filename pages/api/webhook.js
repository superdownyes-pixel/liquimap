import { stripe, applySubscription, emailForSubscription, syncUser } from '../../lib/stripeSync'

export const config = { api: { bodyParser: false } }

async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', c => chunks.push(c))
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  // Sem esta variável nenhum pagamento libera acesso — deixa o erro bem visível nos logs da Vercel
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error('STRIPE_WEBHOOK_SECRET não configurada na Vercel — webhook do Stripe ignorado')
    return res.status(500).send('Webhook secret not configured')
  }

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
      if (session.subscription) {
        const sub = await stripe.subscriptions.retrieve(session.subscription)
        const result = await applySubscription(sub, email, session.metadata?.plan)
        console.log('checkout.session.completed', result)
      } else {
        await syncUser(email, { plan: session.metadata?.plan || 'starter', is_paying: true })
      }
    }

    if (event.type === 'customer.subscription.created' || event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
      const sub = event.data.object
      const email = await emailForSubscription(sub)
      const result = await applySubscription(sub, email)
      console.log(event.type, result)
    }
  } catch (err) {
    console.error('Webhook handler error:', err)
    return res.status(500).json({ error: err.message })
  }

  res.json({ received: true })
}
