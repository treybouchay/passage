import type { Passage } from '../data/passages'
import { getPassageById, type SavedPrayer } from './userContent'

export interface PassagePrayerReflectionGroup {
  key: string
  passageId?: string
  passageReference: string
  passage?: Passage
  prayers: SavedPrayer[]
  latestAt: number
}

function groupKey(prayer: SavedPrayer): string | null {
  if (prayer.passageId) return `id:${prayer.passageId}`
  if (prayer.passageReference) return `ref:${prayer.passageReference}`
  return null
}

export function groupPassageInspiredPrayers(
  prayers: SavedPrayer[],
): PassagePrayerReflectionGroup[] {
  const map = new Map<string, SavedPrayer[]>()

  for (const prayer of prayers) {
    const key = groupKey(prayer)
    if (!key) continue
    const bucket = map.get(key) ?? []
    bucket.push(prayer)
    map.set(key, bucket)
  }

  const groups: PassagePrayerReflectionGroup[] = []

  for (const [key, bucket] of map) {
    const sorted = [...bucket].sort((a, b) => b.updatedAt - a.updatedAt)
    const sample = sorted[0]
    const passageId = sample.passageId
    const passageReference = sample.passageReference ?? 'Scripture'
    const passage = passageId ? getPassageById(passageId) : undefined

    groups.push({
      key,
      passageId,
      passageReference: passage?.reference ?? passageReference,
      passage,
      prayers: sorted,
      latestAt: sorted[0]?.updatedAt ?? 0,
    })
  }

  return groups.sort((a, b) => b.latestAt - a.latestAt)
}

export function countPassageInspiredPrayers(prayers: SavedPrayer[]): number {
  return prayers.filter((prayer) => groupKey(prayer) !== null).length
}
