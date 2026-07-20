import { useEffect, useState } from 'react'
import { fetchOrder } from './ordersApi'

export function useOrderReturnNotice(): string | null {
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const result = params.get('order')
    const orderId = params.get('orderId')

    if (!result) return

    if (result === 'cancelled') {
      setMessage('order cancelled.')
      window.history.replaceState({}, '', window.location.pathname)
      return
    }

    if (result === 'success' && orderId) {
      fetchOrder(orderId)
        .then((order) => {
          if (order.status === 'submitted' || order.status === 'paid') {
            setMessage('thank you — your print order is confirmed.')
          } else if (order.status === 'failed') {
            setMessage('payment received but fulfillment failed — we will follow up.')
          } else {
            setMessage('thank you — your order is processing.')
          }
        })
        .catch(() => {
          setMessage('thank you — your order is processing.')
        })
        .finally(() => {
          window.history.replaceState({}, '', window.location.pathname)
        })
    }
  }, [])

  return message
}
