import { passages, type Passage } from '../data/passages'

const PRAYERS_KEY = 'passage:prayers'
const FAVORITES_KEY = 'passage:favorites'

export interface SavedPrayer {
  id: string
  text: string
  updatedAt: number
}

export type FavoriteItem =
  | { kind: 'passage'; passage: Passage }
  | { kind: 'prayer'; prayer: SavedPrayer }

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function writeJson(key: string, value: unknown): void {
  localStorage.setItem(key, JSON.stringify(value))
}

export function loadPrayers(): SavedPrayer[] {
  return readJson<SavedPrayer[]>(PRAYERS_KEY, [])
}

export function savePrayer(text: string, id?: string): SavedPrayer[] {
  const trimmed = text.trim()
  if (!trimmed) return loadPrayers()

  const prayers = loadPrayers()
  const now = Date.now()

  if (id) {
    const next = prayers.map((p) =>
      p.id === id ? { ...p, text: trimmed, updatedAt: now } : p,
    )
    writeJson(PRAYERS_KEY, next)
    return next
  }

  const prayer: SavedPrayer = {
    id: `prayer-${now}`,
    text: trimmed,
    updatedAt: now,
  }
  const next = [prayer, ...prayers]
  writeJson(PRAYERS_KEY, next)
  return next
}

export function deletePrayer(id: string): SavedPrayer[] {
  const next = loadPrayers().filter((p) => p.id !== id)
  writeJson(PRAYERS_KEY, next)
  return next
}

export function loadFavoriteIds(): string[] {
  return readJson<string[]>(FAVORITES_KEY, [])
}

export function toggleFavoriteId(id: string): string[] {
  const favorites = loadFavoriteIds()
  const next = favorites.includes(id)
    ? favorites.filter((f) => f !== id)
    : [...favorites, id]
  writeJson(FAVORITES_KEY, next)
  return next
}

export function getPassageById(id: string): Passage | undefined {
  return passages.find((p) => p.id === id)
}

export function resolveFavorites(
  favoriteIds: string[],
  prayers: SavedPrayer[],
): FavoriteItem[] {
  const items: FavoriteItem[] = []

  for (const id of favoriteIds) {
    const passage = getPassageById(id)
    if (passage) {
      items.push({ kind: 'passage', passage })
      continue
    }
    const prayer = prayers.find((p) => p.id === id)
    if (prayer) {
      items.push({ kind: 'prayer', prayer })
    }
  }

  return items
}
