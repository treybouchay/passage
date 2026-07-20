import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { config } from './config.js'
import type { Order, PrintDesign } from './types.js'

async function ensureDataDir(): Promise<void> {
  await mkdir(config.dataDir, { recursive: true })
  await mkdir(config.uploadsDir, { recursive: true })
}

async function readJson<T>(filename: string, fallback: T): Promise<T> {
  await ensureDataDir()
  const path = join(config.dataDir, filename)
  if (!existsSync(path)) {
    return fallback
  }
  const raw = await readFile(path, 'utf8')
  return JSON.parse(raw) as T
}

async function writeJson(filename: string, value: unknown): Promise<void> {
  await ensureDataDir()
  const path = join(config.dataDir, filename)
  await writeFile(path, JSON.stringify(value, null, 2))
}

export async function loadDesigns(): Promise<PrintDesign[]> {
  return readJson<PrintDesign[]>('designs.json', [])
}

export async function saveDesigns(designs: PrintDesign[]): Promise<void> {
  await writeJson('designs.json', designs)
}

export async function getDesign(id: string): Promise<PrintDesign | undefined> {
  const designs = await loadDesigns()
  return designs.find((design) => design.id === id)
}

export async function insertDesign(design: PrintDesign): Promise<void> {
  const designs = await loadDesigns()
  designs.push(design)
  await saveDesigns(designs)
}

export async function loadOrders(): Promise<Order[]> {
  return readJson<Order[]>('orders.json', [])
}

export async function saveOrders(orders: Order[]): Promise<void> {
  await writeJson('orders.json', orders)
}

export async function getOrder(id: string): Promise<Order | undefined> {
  const orders = await loadOrders()
  return orders.find((order) => order.id === id)
}

export async function getOrderByStripeSession(
  sessionId: string,
): Promise<Order | undefined> {
  const orders = await loadOrders()
  return orders.find((order) => order.stripeSessionId === sessionId)
}

export async function upsertOrder(order: Order): Promise<void> {
  const orders = await loadOrders()
  const index = orders.findIndex((item) => item.id === order.id)
  if (index >= 0) {
    orders[index] = order
  } else {
    orders.push(order)
  }
  await saveOrders(orders)
}
