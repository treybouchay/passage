import { config as loadEnv } from 'dotenv'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { FrameStyle, PrintSize } from './types.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
loadEnv({ path: resolve(__dirname, '../../.env') })

export const config = {
  port: Number(process.env.PORT ?? 3001),
  clientOrigin: process.env.CLIENT_ORIGIN ?? 'http://localhost:5176',
  dataDir: resolve(__dirname, '../data'),
  uploadsDir: resolve(__dirname, '../data/uploads'),
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? '',
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? '',
  printfulApiKey: process.env.PRINTFUL_API_KEY ?? '',
  mockPayments: process.env.MOCK_PAYMENTS === 'true' || !process.env.STRIPE_SECRET_KEY,
  mockPrintful: process.env.MOCK_PRINTFUL === 'true' || !process.env.PRINTFUL_API_KEY,
}

/** Retail prices in USD cents (update to match your margin). */
export const PRINT_PRICES_USD: Record<PrintSize, number> = {
  '8x10': 4900,
  '11x14': 6900,
}

/**
 * Printful catalog variant IDs for Enhanced Matte Paper Framed Poster (in).
 * Set these from your Printful dashboard / catalog API.
 */
export const PRINTFUL_VARIANTS: Record<PrintSize, Record<FrameStyle, number | null>> = {
  '8x10': { black: null, white: null, oak: null },
  '11x14': { black: null, white: null, oak: null },
}

export function isStripeConfigured(): boolean {
  return Boolean(config.stripeSecretKey)
}

export function isPrintfulConfigured(): boolean {
  return Boolean(config.printfulApiKey) && !config.mockPrintful
}
