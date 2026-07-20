import { Router } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { config, isStripeConfigured, PRINT_PRICES_USD } from '../config.js'
import { getDesign, getOrder, upsertOrder } from '../store.js'
import { createCheckoutSession } from '../services/stripe.js'
import { fulfillPaidOrder } from '../services/fulfillment.js'
import type { CheckoutRequestBody, Order } from '../types.js'

export const ordersRouter = Router()

ordersRouter.post('/checkout', async (req, res) => {
  try {
    const body = req.body as CheckoutRequestBody
    const { designId, email, shipping } = body

    if (!designId || !email || !shipping?.name || !shipping?.line1 || !shipping?.city) {
      res.status(400).json({ error: 'Missing checkout fields' })
      return
    }

    const design = await getDesign(designId)
    if (!design) {
      res.status(404).json({ error: 'Design not found' })
      return
    }

    const amountCents = PRINT_PRICES_USD[design.printSize]
    const orderId = uuidv4()
    const now = Date.now()

    const order: Order = {
      id: orderId,
      designId,
      email,
      shipping: {
        name: shipping.name,
        line1: shipping.line1,
        line2: shipping.line2,
        city: shipping.city,
        state: shipping.state ?? '',
        postalCode: shipping.postalCode,
        country: shipping.country ?? 'US',
      },
      amountCents,
      currency: 'usd',
      status: 'pending_payment',
      createdAt: now,
      updatedAt: now,
    }

    if (config.mockPayments || !isStripeConfigured()) {
      order.status = 'paid'
      order.stripeSessionId = `mock_session_${orderId}`
      await upsertOrder(order)
      await fulfillPaidOrder(orderId)
      res.json({
        orderId,
        mock: true,
        redirectUrl: `${config.clientOrigin}?order=success&orderId=${orderId}`,
      })
      return
    }

    const label = `Framed print ${design.printSize.replace('x', '×')}" · ${design.frameStyle}`
    const { url, sessionId } = await createCheckoutSession({
      orderId,
      email,
      amountCents,
      label,
      successUrl: `${config.clientOrigin}?order=success&orderId=${orderId}`,
      cancelUrl: `${config.clientOrigin}?order=cancelled&orderId=${orderId}`,
    })

    order.stripeSessionId = sessionId
    await upsertOrder(order)

    res.json({ orderId, checkoutUrl: url })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Checkout failed'
    res.status(500).json({ error: message })
  }
})

ordersRouter.get('/:id', async (req, res) => {
  const order = await getOrder(req.params.id)
  if (!order) {
    res.status(404).json({ error: 'Order not found' })
    return
  }

  res.json({
    id: order.id,
    status: order.status,
    email: order.email,
    amountCents: order.amountCents,
    currency: order.currency,
    printfulOrderId: order.printfulOrderId,
    error: order.error,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  })
})

ordersRouter.post('/:id/confirm-mock', async (req, res) => {
  if (!config.mockPayments) {
    res.status(404).json({ error: 'Not available' })
    return
  }

  const order = await getOrder(req.params.id)
  if (!order) {
    res.status(404).json({ error: 'Order not found' })
    return
  }

  order.status = 'paid'
  order.updatedAt = Date.now()
  await upsertOrder(order)
  await fulfillPaidOrder(order.id)

  res.json({ ok: true, status: order.status })
})
