import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { config, isPrintfulConfigured, PRINTFUL_VARIANTS } from '../config.js'
import type { Order, PrintDesign, ShippingAddress } from '../types.js'

const PRINTFUL_API = 'https://api.printful.com'

interface PrintfulCreateOrderResponse {
  code: number
  result?: {
    id: number
    status: string
  }
  error?: { message: string }
}

function resolveVariantId(design: PrintDesign): number | null {
  return PRINTFUL_VARIANTS[design.printSize][design.frameStyle]
}

async function uploadFileToPrintful(imagePath: string): Promise<string> {
  const buffer = await readFile(imagePath)
  const form = new FormData()
  form.append(
    'file',
    new Blob([buffer], { type: 'image/png' }),
    'passage-print.png',
  )

  const response = await fetch(`${PRINTFUL_API}/files`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.printfulApiKey}`,
    },
    body: form,
  })

  const data = (await response.json()) as {
    code: number
    result?: { id: number }
    error?: { message: string }
  }

  if (!response.ok || data.code !== 200 || !data.result?.id) {
    throw new Error(data.error?.message ?? 'Printful file upload failed')
  }

  return String(data.result.id)
}

export async function submitPrintfulOrder(
  order: Order,
  design: PrintDesign,
): Promise<{ printfulOrderId: string }> {
  if (!isPrintfulConfigured()) {
    console.info('[printful:mock] order', order.id, design.reference, design.printSize)
    return { printfulOrderId: `mock-${order.id}` }
  }

  const variantId = resolveVariantId(design)
  if (!variantId) {
    throw new Error(
      `Printful variant not configured for ${design.printSize} / ${design.frameStyle}. Set PRINTFUL_VARIANTS in server config.`,
    )
  }

  const imagePath = join(config.uploadsDir, design.imageFilename)
  const fileId = await uploadFileToPrintful(imagePath)

  const body = {
    recipient: mapShipping(order.shipping, order.email),
    items: [
      {
        variant_id: variantId,
        quantity: 1,
        files: [{ type: 'default', id: fileId }],
      },
    ],
  }

  const response = await fetch(`${PRINTFUL_API}/orders`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.printfulApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  const data = (await response.json()) as PrintfulCreateOrderResponse
  if (!response.ok || data.code !== 200 || !data.result?.id) {
    throw new Error(data.error?.message ?? 'Printful order creation failed')
  }

  return { printfulOrderId: String(data.result.id) }
}

function mapShipping(shipping: ShippingAddress, email: string) {
  return {
    name: shipping.name,
    address1: shipping.line1,
    address2: shipping.line2 ?? '',
    city: shipping.city,
    state_code: shipping.state,
    country_code: shipping.country,
    zip: shipping.postalCode,
    email,
  }
}
