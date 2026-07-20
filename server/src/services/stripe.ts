import Stripe from 'stripe'
import { config, isStripeConfigured } from '../config.js'

let stripe: Stripe | null = null

function getStripe(): Stripe {
  if (!isStripeConfigured()) {
    throw new Error('Stripe is not configured')
  }
  if (!stripe) {
    stripe = new Stripe(config.stripeSecretKey, { apiVersion: '2025-02-24.acacia' })
  }
  return stripe
}

export interface CreateCheckoutParams {
  orderId: string
  email: string
  amountCents: number
  label: string
  successUrl: string
  cancelUrl: string
}

export async function createCheckoutSession(
  params: CreateCheckoutParams,
): Promise<{ url: string; sessionId: string }> {
  const client = getStripe()
  const session = await client.checkout.sessions.create({
    mode: 'payment',
    customer_email: params.email,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: 'usd',
          unit_amount: params.amountCents,
          product_data: {
            name: params.label,
            description: 'Framed scripture print from Passage',
          },
        },
      },
    ],
    metadata: {
      orderId: params.orderId,
    },
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
  })

  if (!session.url) {
    throw new Error('Stripe did not return a checkout URL')
  }

  return { url: session.url, sessionId: session.id }
}

export function constructWebhookEvent(payload: Buffer, signature: string): Stripe.Event {
  const client = getStripe()
  return client.webhooks.constructEvent(payload, signature, config.stripeWebhookSecret)
}

export async function retrieveCheckoutSession(
  sessionId: string,
): Promise<Stripe.Checkout.Session> {
  const client = getStripe()
  return client.checkout.sessions.retrieve(sessionId)
}
