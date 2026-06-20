/**
 * Billing API — Stripe subscriptions, token packs, billing portal.
 * Requires STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET env vars.
 */
import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { db } from '../db/index.js'
import { subscriptions, purchases, users } from '../db/schema.js'
import { eq, and, desc } from 'drizzle-orm'
import { grantTokens } from '../middleware/tokens.js'

const router = Router()

// Lazy-load Stripe to avoid crash if key not set
let stripe: any = null
function getStripe() {
  if (!stripe && process.env.STRIPE_SECRET_KEY) {
    const Stripe = require('stripe')
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' })
  }
  return stripe
}

// ── Plans & Pricing ─────────────────────────────────────────────────────────

const PLANS: Record<string, { name: string; price: number; tokens: number; features: string[] }> = {
  free: { name: 'Free', price: 0, tokens: 100, features: ['100 AI tokens', 'All core features', 'Local Ollama AI'] },
  starter: { name: 'Starter', price: 1900, tokens: 1000, features: ['1,000 tokens/mo', 'Priority support', 'API access'] },
  pro: { name: 'Pro', price: 4900, tokens: 5000, features: ['5,000 tokens/mo', 'Team collaboration', 'Advanced analytics', 'API access'] },
  elite: { name: 'Founder Elite', price: 9900, tokens: 15000, features: ['15,000 tokens/mo', 'Unlimited teams', 'Priority AI', 'Dedicated support', 'White-label'] },
  enterprise: { name: 'Enterprise', price: 29900, tokens: 50000, features: ['50,000 tokens/mo', 'Custom models', 'SLA', 'Dedicated infra', 'On-prem option'] },
}

const TOKEN_PACKS: Record<string, { tokens: number; price: number }> = {
  pack_1000: { tokens: 1000, price: 999 },
  pack_5000: { tokens: 5000, price: 3999 },
  pack_10000: { tokens: 10000, price: 6999 },
  pack_50000: { tokens: 50000, price: 24999 },
}

// GET /api/billing/plans — list available plans
router.get('/plans', (_req, res) => {
  res.json(PLANS)
})

// GET /api/billing/token-packs — list token packs
router.get('/token-packs', (_req, res) => {
  res.json(TOKEN_PACKS)
})

// GET /api/billing/subscription — current subscription
router.get('/subscription', requireAuth, async (req, res) => {
  const user = (req as any).user
  try {
    const [sub] = await db.select().from(subscriptions)
      .where(eq(subscriptions.userId, user.id))
      .limit(1)

    const recentPurchases = await db.select().from(purchases)
      .where(eq(purchases.userId, user.id))
      .orderBy(desc(purchases.createdAt))
      .limit(10)

    res.json({
      subscription: sub || { plan: 'free', status: 'active', tokenAllowance: 100 },
      purchases: recentPurchases,
    })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/billing/checkout — create Stripe checkout session
router.post('/checkout', requireAuth, async (req, res) => {
  const stripe = getStripe()
  if (!stripe) return res.status(503).json({ error: 'Billing not configured. Set STRIPE_SECRET_KEY.' })

  const user = (req as any).user
  const { planId, packId } = req.body

  try {
    // Get or create Stripe customer
    const [existingSub] = await db.select().from(subscriptions)
      .where(eq(subscriptions.userId, user.id))
      .limit(1)

    let customerId = existingSub?.stripeCustomerId

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        metadata: { userId: user.id },
      })
      customerId = customer.id

      // Save customer ID
      if (existingSub) {
        await db.update(subscriptions)
          .set({ stripeCustomerId: customerId })
          .where(eq(subscriptions.userId, user.id))
      } else {
        await db.insert(subscriptions).values({
          userId: user.id,
          stripeCustomerId: customerId,
          plan: 'free',
          status: 'active',
        })
      }
    }

    let sessionConfig: any = {
      customer: customerId,
      mode: 'payment',
      success_url: `${process.env.CLIENT_URL || 'http://localhost:5173'}/settings?billing=success`,
      cancel_url: `${process.env.CLIENT_URL || 'http://localhost:5173'}/settings?billing=cancel`,
      metadata: { userId: user.id },
    }

    if (planId && PLANS[planId] && planId !== 'free') {
      // Subscription checkout
      const plan = PLANS[planId]
      sessionConfig.mode = 'subscription'
      sessionConfig.line_items = [{
        price_data: {
          currency: 'usd',
          product_data: { name: `OneFounder ${plan.name}`, description: plan.features.join(', ') },
          unit_amount: plan.price,
          recurring: { interval: 'month' },
        },
        quantity: 1,
      }]
      sessionConfig.metadata.planId = planId
    } else if (packId && TOKEN_PACKS[packId]) {
      // Token pack checkout
      const pack = TOKEN_PACKS[packId]
      sessionConfig.line_items = [{
        price_data: {
          currency: 'usd',
          product_data: { name: `${pack.tokens.toLocaleString()} AI Tokens`, description: 'One-time token purchase for OneFounder AI' },
          unit_amount: pack.price,
        },
        quantity: 1,
      }]
      sessionConfig.metadata.packId = packId
    } else {
      return res.status(400).json({ error: 'Invalid planId or packId' })
    }

    const session = await stripe.checkout.sessions.create(sessionConfig)
    res.json({ url: session.url, sessionId: session.id })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/billing/portal — create Stripe billing portal session
router.post('/portal', requireAuth, async (req, res) => {
  const stripe = getStripe()
  if (!stripe) return res.status(503).json({ error: 'Billing not configured' })

  const user = (req as any).user
  try {
    const [sub] = await db.select().from(subscriptions)
      .where(eq(subscriptions.userId, user.id))
      .limit(1)

    if (!sub?.stripeCustomerId) {
      return res.status(400).json({ error: 'No billing account' })
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: sub.stripeCustomerId,
      return_url: `${process.env.CLIENT_URL || 'http://localhost:5173'}/settings`,
    })

    res.json({ url: session.url })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/billing/webhook — Stripe webhook handler
router.post('/webhook', async (req, res) => {
  const stripe = getStripe()
  if (!stripe) return res.status(503).json({ error: 'Billing not configured' })

  const sig = req.headers['stripe-signature']
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!webhookSecret) return res.status(500).json({ error: 'Webhook secret not configured' })

  let event: any
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret)
  } catch (err: any) {
    return res.status(400).json({ error: `Webhook Error: ${err.message}` })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        const userId = session.metadata?.userId
        if (!userId) break

        if (session.mode === 'subscription') {
          const planId = session.metadata?.planId || 'starter'
          const plan = PLANS[planId]

          await db.update(subscriptions)
            .set({
              stripeSubscriptionId: session.subscription,
              plan: planId,
              status: 'active',
              tokenAllowance: plan?.tokens || 1000,
              currentPeriodStart: new Date(),
              currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              updatedAt: new Date(),
            })
            .where(eq(subscriptions.userId, userId))

          // Grant tokens
          if (plan) await grantTokens(userId, plan.tokens, `Subscribed to ${plan.name}`)
        } else if (session.mode === 'payment') {
          const packId = session.metadata?.packId
          const pack = packId ? TOKEN_PACKS[packId] : null

          await db.insert(purchases).values({
            userId,
            stripePaymentIntentId: session.payment_intent,
            type: 'token_pack',
            description: pack ? `${pack.tokens.toLocaleString()} tokens` : 'Token purchase',
            amount: session.amount_total || 0,
            tokensGranted: pack?.tokens || 0,
            status: 'completed',
          })

          if (pack) await grantTokens(userId, pack.tokens, `Purchased ${pack.tokens.toLocaleString()} tokens`)
        }
        break
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object
        await db.update(subscriptions)
          .set({
            status: sub.status,
            currentPeriodStart: new Date(sub.current_period_start * 1000),
            currentPeriodEnd: new Date(sub.current_period_end * 1000),
            cancelAt: sub.cancel_at ? new Date(sub.cancel_at * 1000) : null,
            updatedAt: new Date(),
          })
          .where(eq(subscriptions.stripeSubscriptionId, sub.id))
        break
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object
        await db.update(subscriptions)
          .set({
            status: 'canceled',
            canceledAt: new Date(),
            plan: 'free',
            tokenAllowance: 100,
            updatedAt: new Date(),
          })
          .where(eq(subscriptions.stripeSubscriptionId, sub.id))
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object
        await db.update(subscriptions)
          .set({ status: 'past_due', updatedAt: new Date() })
          .where(eq(subscriptions.stripeCustomerId, invoice.customer))
        break
      }
    }

    res.json({ received: true })
  } catch (err: any) {
    console.error('[Webhook] Handler error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

// GET /api/billing/revenue — admin revenue dashboard
router.get('/revenue', requireAuth, async (req, res) => {
  const user = (req as any).user
  if (!user?.isAdmin) return res.status(403).json({ error: 'Admin only' })

  try {
    const allPurchases = await db.select().from(purchases).orderBy(desc(purchases.createdAt))
    const allSubs = await db.select().from(subscriptions)

    const totalRevenue = allPurchases
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + (p.amount || 0), 0)

    const activeSubs = allSubs.filter(s => s.status === 'active' && s.plan !== 'free')
    const mrr = activeSubs.reduce((sum, s) => {
      const plan = PLANS[s.plan || 'free']
      return sum + (plan?.price || 0)
    }, 0)

    const byPlan: Record<string, number> = {}
    for (const s of allSubs) {
      byPlan[s.plan || 'free'] = (byPlan[s.plan || 'free'] || 0) + 1
    }

    res.json({
      totalRevenue: totalRevenue / 100, // Convert cents to dollars
      mrr: mrr / 100,
      activeSubscriptions: activeSubs.length,
      totalSubscriptions: allSubs.length,
      byPlan,
      recentPurchases: allPurchases.slice(0, 20),
    })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

export default router
