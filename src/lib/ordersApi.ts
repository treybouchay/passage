import type { FrameStyle, PrintSize } from './framedPrint'
import type { WallpaperColorStyle } from './passageColorScheme'
import type { BibleTranslation } from './bibleTranslations'
import type { WallpaperSpacing } from './wallpaperSpacing'

export interface ShippingAddress {
  name: string
  line1: string
  line2?: string
  city: string
  state: string
  postalCode: string
  country: string
}

export interface PrintDesignPayload {
  passageId: string
  reference: string
  translation: BibleTranslation
  printSize: PrintSize
  frameStyle: FrameStyle
  colorStyle: WallpaperColorStyle
  lines: string[]
  spacing: WallpaperSpacing
}

export interface OrderSummary {
  id: string
  status: string
  email: string
  amountCents: number
  currency: string
  printfulOrderId?: string
  error?: string
}

const API_BASE = import.meta.env.VITE_API_URL ?? ''

export async function checkOrdersApi(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/api/health`)
    return response.ok
  } catch {
    return false
  }
}

export async function uploadPrintDesign(
  imageBlob: Blob,
  meta: PrintDesignPayload,
): Promise<{ designId: string }> {
  const form = new FormData()
  form.append('image', imageBlob, 'passage-print.png')
  form.append('meta', JSON.stringify(meta))

  const response = await fetch(`${API_BASE}/api/designs`, {
    method: 'POST',
    body: form,
  })

  const data = await response.json()
  if (!response.ok) {
    throw new Error(data.error ?? 'Upload failed')
  }

  return { designId: data.designId as string }
}

export async function createPrintCheckout(params: {
  designId: string
  email: string
  shipping: ShippingAddress
}): Promise<{ orderId: string; checkoutUrl?: string; redirectUrl?: string; mock?: boolean }> {
  const response = await fetch(`${API_BASE}/api/orders/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })

  const data = await response.json()
  if (!response.ok) {
    throw new Error(data.error ?? 'Checkout failed')
  }

  return data
}

export async function fetchOrder(orderId: string): Promise<OrderSummary> {
  const response = await fetch(`${API_BASE}/api/orders/${orderId}`)
  const data = await response.json()
  if (!response.ok) {
    throw new Error(data.error ?? 'Order not found')
  }
  return data as OrderSummary
}

export function formatPrice(cents: number, currency = 'usd'): string {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(cents / 100)
}

/** Display prices — keep in sync with server PRINT_PRICES_USD. */
export const PRINT_PRICES_USD: Record<PrintSize, number> = {
  '8x10': 4900,
  '11x14': 6900,
}
