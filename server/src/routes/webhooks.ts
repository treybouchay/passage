import type { Request, Response } from 'express'
import type Stripe from 'stripe'
import { isStripeConfigured } from '../config.js'
import { constructWebhookEvent } from '../services/stripe.js'
import { getOrder, getOrderByStripeSession, upsertOrder } from '../store.js'
import { fulfillPaidOrder } from '../services/fulfillment.js'

export async function stripeWebhookHandler(req: Request, res: Response): Promise<void> {
  if (!isStripeConfigured()) {
    res.status(503).json({ error: 'Stripe not configured' })
    return
  }

  const signature = req.headers['stripe-signature']
  if (!signature || typeof signature !== 'string') {
    res.status(400).json({ error: 'Missing stripe-signature header' })
    return
  }

  let event: Stripe.Event
  try {
    event = constructWebhookEvent(req.body as Buffer, signature)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid signature'
    res.status(400).json({ error: message })
    return
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session
      const orderId = session.metadata?.orderId
      const order =
        (orderId ? await getOrder(orderId) : undefined) ??
        (await getOrderByStripeSession(session.id))

      if (order && order.status === 'pending_payment') {
        order.status = 'paid'
        order.stripePaymentIntentId =
          typeof session.payment_intent === 'string' ? session.payment_intent : undefined
        order.updatedAt = Date.now()
        await upsertOrder(order)
        await fulfillPaidOrder(order.id)
      }
    }

    res.json({ received: true })
  } catch (error) {
    console.error('[stripe webhook]', error)
    res.status(500).json({ error: 'Webhook handler failed' })
  }
}
