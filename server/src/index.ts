import express from 'express'
import cors from 'cors'
import { config } from './config.js'
import { designsRouter } from './routes/designs.js'
import { ordersRouter } from './routes/orders.js'
import { stripeWebhookHandler } from './routes/webhooks.js'

const app = express()

app.use(
  cors({
    origin: config.clientOrigin,
    credentials: true,
  }),
)

app.post(
  '/api/webhooks/stripe',
  express.raw({ type: 'application/json' }),
  stripeWebhookHandler,
)

app.use(express.json({ limit: '2mb' }))

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    mockPayments: config.mockPayments,
    mockPrintful: config.mockPrintful,
  })
})

app.use('/api/designs', designsRouter)
app.use('/api/orders', ordersRouter)

app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    console.error(err)
    res.status(500).json({ error: err.message || 'Server error' })
  },
)

app.listen(config.port, () => {
  console.info(`Passage API listening on http://localhost:${config.port}`)
  if (config.mockPayments) {
    console.info('Payments: MOCK mode (set STRIPE_SECRET_KEY to enable Stripe)')
  }
  if (config.mockPrintful) {
    console.info('Printful: MOCK mode (set PRINTFUL_API_KEY to enable fulfillment)')
  }
})
