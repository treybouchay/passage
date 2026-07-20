import { getDesign, getOrder, upsertOrder } from '../store.js'
import { submitPrintfulOrder } from './printful.js'

export async function fulfillPaidOrder(orderId: string): Promise<void> {
  const order = await getOrder(orderId)
  if (!order) {
    throw new Error(`Order not found: ${orderId}`)
  }

  if (order.status === 'submitted' || order.status === 'fulfilled') {
    return
  }

  const design = await getDesign(order.designId)
  if (!design) {
    order.status = 'failed'
    order.error = 'Design file not found'
    order.updatedAt = Date.now()
    await upsertOrder(order)
    throw new Error(order.error)
  }

  try {
    const { printfulOrderId } = await submitPrintfulOrder(order, design)
    order.status = 'submitted'
    order.printfulOrderId = printfulOrderId
    order.error = undefined
  } catch (error) {
    order.status = 'failed'
    order.error = error instanceof Error ? error.message : 'Fulfillment failed'
    throw error
  } finally {
    order.updatedAt = Date.now()
    await upsertOrder(order)
  }
}
