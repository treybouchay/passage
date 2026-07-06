const SAVED_CARDS_KEY = 'passage:saved-prayer-cards'

function readIds(): string[] {
  try {
    const raw = localStorage.getItem(SAVED_CARDS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'string') : []
  } catch {
    return []
  }
}

export function loadSavedPrayerCardIds(): string[] {
  return readIds()
}

export function isPrayerCardSaved(prayerId: string): boolean {
  return readIds().includes(prayerId)
}

export function markPrayerCardSaved(prayerId: string): string[] {
  const ids = readIds()
  if (ids.includes(prayerId)) return ids
  const next = [...ids, prayerId]
  localStorage.setItem(SAVED_CARDS_KEY, JSON.stringify(next))
  return next
}

export function removeSavedPrayerCard(prayerId: string): string[] {
  const next = readIds().filter((id) => id !== prayerId)
  localStorage.setItem(SAVED_CARDS_KEY, JSON.stringify(next))
  return next
}
