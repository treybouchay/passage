export type PrintSize = '8x10' | '11x14'
export type FrameStyle = 'black' | 'white' | 'oak'
export type WallpaperColorStyle = 'passage' | 'mono'
export type BibleTranslation = 'niv' | 'kjv' | 'asv'

export interface WallpaperSpacing {
  lineGap: number
  referenceGap: number
  logoGap: number
}

export interface PrintDesignMeta {
  passageId: string
  reference: string
  translation: BibleTranslation
  printSize: PrintSize
  frameStyle: FrameStyle
  colorStyle: WallpaperColorStyle
  lines: string[]
  spacing: WallpaperSpacing
}

export interface PrintDesign extends PrintDesignMeta {
  id: string
  imageFilename: string
  createdAt: number
}

export type OrderStatus =
  | 'pending_payment'
  | 'paid'
  | 'submitted'
  | 'fulfilled'
  | 'failed'

export interface ShippingAddress {
  name: string
  line1: string
  line2?: string
  city: string
  state: string
  postalCode: string
  country: string
}

export interface Order {
  id: string
  designId: string
  email: string
  shipping: ShippingAddress
  amountCents: number
  currency: string
  status: OrderStatus
  stripeSessionId?: string
  stripePaymentIntentId?: string
  printfulOrderId?: string
  error?: string
  createdAt: number
  updatedAt: number
}

export interface CheckoutRequestBody {
  designId: string
  email: string
  shipping: ShippingAddress
}
