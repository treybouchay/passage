import { passages, type Passage } from '../data/passages'

const PRAYERS_KEY = 'passage:prayers'
const FAVORITES_KEY = 'passage:favorites'

export interface SavedPrayer {
  id: string
  text: string
  themes: string[]
  passageId?: string
  passageReference?: string
  createdAt: number
  updatedAt: number
}

export interface SavePrayerOptions {
  id?: string
  themes?: string[]
  passageId?: string
  passageReference?: string
}

function normalizePrayer(
  raw: Partial<SavedPrayer> & Pick<SavedPrayer, 'id' | 'text'>,
): SavedPrayer {
  const fromId = raw.id.startsWith('prayer-') ? Number(raw.id.slice(7)) : NaN
  const updatedAt = raw.updatedAt ?? (Number.isFinite(fromId) ? fromId : Date.now())
  const createdAt = raw.createdAt ?? updatedAt
  const themes = Array.isArray(raw.themes) ? raw.themes : []
  return {
    id: raw.id,
    text: raw.text,
    themes,
    passageId: raw.passageId,
    passageReference: raw.passageReference,
    createdAt,
    updatedAt,
  }
}

export function formatPrayerDate(timestamp: number): string {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(timestamp))
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
  return readJson<Array<Partial<SavedPrayer> & Pick<SavedPrayer, 'id' | 'text'>>>(
    PRAYERS_KEY,
    [],
  ).map(normalizePrayer)
}

export function savePrayer(
  text: string,
  idOrOptions?: string | SavePrayerOptions,
  themesArg: string[] = [],
): SavedPrayer[] {
  const options: SavePrayerOptions =
    typeof idOrOptions === 'string' || idOrOptions === undefined
      ? { id: idOrOptions, themes: themesArg }
      : idOrOptions

  const trimmed = text.trim()
  if (!trimmed) return loadPrayers()

  const prayers = loadPrayers()
  const now = Date.now()
  const uniqueThemes = [...new Set(options.themes ?? [])]
  const passageId = options.passageId
  const passageReference = options.passageReference

  if (options.id) {
    const next = prayers.map((p) =>
      p.id === options.id
        ? {
            ...p,
            text: trimmed,
            themes: uniqueThemes,
            passageId: options.passageId,
            passageReference: options.passageReference,
            updatedAt: now,
          }
        : p,
    )
    writeJson(PRAYERS_KEY, next)
    return next
  }

  const prayer: SavedPrayer = {
    id: `prayer-${now}`,
    text: trimmed,
    themes: uniqueThemes,
    passageId,
    passageReference,
    createdAt: now,
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
