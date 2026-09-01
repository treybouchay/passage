import { playlistSongs } from '../data/songs'
import { getPassageById, getSongById, type SavedPrayer } from './userContent'

const ACTIVITIES_KEY = 'passage:activities'
const KNOWN_SONGS_KEY = 'passage:knownSongIds'
const MAX_ACTIVITIES = 60

export type ActivityTargetView = 'passages' | 'prayer' | 'favorites' | 'music'

export type ActivityKind =
  | 'passage-prayer'
  | 'new-song'
  | 'favorite-passage'
  | 'favorite-song'

export interface ActivityItem {
  id: string
  kind: ActivityKind
  at: number
  title: string
  detail: string
  entityId?: string
  targetView: ActivityTargetView
  read: boolean
}

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

function normalizeActivity(raw: Partial<ActivityItem> & Pick<ActivityItem, 'id'>): ActivityItem | null {
  if (!raw.kind || !raw.title || !raw.detail || !raw.targetView || !raw.at) return null
  return {
    id: raw.id,
    kind: raw.kind,
    at: raw.at,
    title: raw.title,
    detail: raw.detail,
    entityId: raw.entityId,
    targetView: raw.targetView,
    read: Boolean(raw.read),
  }
}

export function loadActivities(): ActivityItem[] {
  return readJson<ActivityItem[]>(ACTIVITIES_KEY, [])
    .map((item) => normalizeActivity(item))
    .filter((item): item is ActivityItem => item !== null)
    .filter((item) => !item.id.startsWith('sample-'))
    .filter((item) => isUserActivity(item))
    .sort((a, b) => b.at - a.at)
}

/** Activity kinds tied to this user's actions in local storage. */
function isUserActivity(item: ActivityItem): boolean {
  return (
    item.kind === 'passage-prayer' ||
    item.kind === 'favorite-passage' ||
    item.kind === 'favorite-song'
  )
}

function saveActivities(items: ActivityItem[]): void {
  writeJson(ACTIVITIES_KEY, items.slice(0, MAX_ACTIVITIES))
}

function saveKnownSongIds(ids: string[]): void {
  writeJson(KNOWN_SONGS_KEY, ids)
}

function hasRecentDuplicate(
  items: ActivityItem[],
  kind: ActivityKind,
  entityId: string | undefined,
): boolean {
  if (!entityId) return false
  const cutoff = Date.now() - 60_000
  return items.some(
    (item) => item.kind === kind && item.entityId === entityId && item.at >= cutoff,
  )
}

export function addActivity(
  input: Omit<ActivityItem, 'id' | 'read'> & { read?: boolean },
): ActivityItem[] {
  const items = loadActivities()
  if (hasRecentDuplicate(items, input.kind, input.entityId)) {
    return items
  }

  const next: ActivityItem = {
    id: `activity-${input.at}-${input.kind}-${input.entityId ?? 'none'}`,
    read: input.read ?? false,
    ...input,
  }

  const deduped = items.filter(
    (item) => !(item.kind === next.kind && item.entityId && item.entityId === next.entityId),
  )
  saveActivities([next, ...deduped])
  return loadActivities()
}

export function markActivitiesRead(): ActivityItem[] {
  const next = loadActivities().map((item) => ({ ...item, read: true }))
  saveActivities(next)
  return next
}

export function countUnreadActivities(items: ActivityItem[] = loadActivities()): number {
  return items.filter((item) => !item.read).length
}

export function syncKnownSongCatalog(): void {
  const currentIds = playlistSongs.map((song) => song.id)
  saveKnownSongIds(currentIds)
}

/** @deprecated Library sync no longer creates activity items — use syncKnownSongCatalog. */
export function syncLibrarySongActivities(): ActivityItem[] {
  syncKnownSongCatalog()
  return purgeNonUserActivities()
}

export function purgeNonUserActivities(): ActivityItem[] {
  const next = loadActivities()
  saveActivities(next)
  return next
}

export function logPassagePrayerActivity(prayer: SavedPrayer): ActivityItem[] {
  if (!prayer.passageId && !prayer.passageReference) return loadActivities()
  const reference =
    (prayer.passageId ? getPassageById(prayer.passageId)?.reference : undefined) ??
    prayer.passageReference ??
    'Scripture'
  const excerpt =
    prayer.text.length > 88 ? `${prayer.text.slice(0, 85).trim()}…` : prayer.text

  return addActivity({
    kind: 'passage-prayer',
    at: prayer.createdAt,
    title: `Prayer from ${reference}`,
    detail: excerpt,
    entityId: prayer.id,
    targetView: 'prayer',
  })
}

export function logFavoritePassageActivity(passageId: string): ActivityItem[] {
  const passage = getPassageById(passageId)
  if (!passage) return loadActivities()
  return addActivity({
    kind: 'favorite-passage',
    at: Date.now(),
    title: 'Passage favorited',
    detail: passage.reference,
    entityId: passage.id,
    targetView: 'favorites',
  })
}

export function logFavoriteSongActivity(songId: string): ActivityItem[] {
  const song = getSongById(songId)
  if (!song) return loadActivities()
  return addActivity({
    kind: 'favorite-song',
    at: Date.now(),
    title: 'Song favorited',
    detail: `${song.title} · ${song.artists}`,
    entityId: song.id,
    targetView: 'favorites',
  })
}

export function formatActivityWhen(timestamp: number): string {
  const now = Date.now()
  const diffMs = now - timestamp
  const minute = 60_000
  const hour = 60 * minute
  const day = 24 * hour

  if (diffMs < minute) return 'just now'
  if (diffMs < hour) {
    const mins = Math.floor(diffMs / minute)
    return `${mins}m ago`
  }
  if (diffMs < day) {
    const hours = Math.floor(diffMs / hour)
    return `${hours}h ago`
  }
  if (diffMs < 7 * day) {
    const days = Math.floor(diffMs / day)
    return `${days}d ago`
  }
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
  }).format(new Date(timestamp))
}

export function activityKindLabel(kind: ActivityKind): string {
  switch (kind) {
    case 'passage-prayer':
      return 'prayer'
    case 'new-song':
      return 'library'
    case 'favorite-passage':
      return 'passage'
    case 'favorite-song':
      return 'song'
  }
}

export function activityKindAriaLabel(kind: ActivityKind): string {
  switch (kind) {
    case 'passage-prayer':
      return 'Prayer activity'
    case 'new-song':
      return 'Music activity'
    case 'favorite-passage':
      return 'Passage activity'
    case 'favorite-song':
      return 'Song activity'
  }
}

const SAMPLE_ACTIVITY_DEFS: Omit<ActivityItem, 'id'>[] = [
  {
    kind: 'passage-prayer',
    at: 0,
    title: 'Prayer from Philippians 4:6–7',
    detail:
      'dear Lord, as I hold this passage close, help me bring every worry to You with thanksgiving…',
    entityId: 'sample-prayer-phil-4-6',
    targetView: 'prayer',
    read: false,
  },
  {
    kind: 'new-song',
    at: 0,
    title: 'New song in library',
    detail: 'God Is in No Hurry · Andy Gullahorn',
    entityId: 'god-is-in-no-hurry-andy-gullahorn',
    targetView: 'music',
    read: false,
  },
  {
    kind: 'favorite-passage',
    at: 0,
    title: 'Passage favorited',
    detail: 'Psalm 23:4',
    entityId: 'psalm-23-4',
    targetView: 'favorites',
    read: false,
  },
  {
    kind: 'favorite-song',
    at: 0,
    title: 'Song favorited',
    detail: 'G.O.D. · DaniLeigh',
    entityId: 'god-danileigh',
    targetView: 'favorites',
    read: false,
  },
]

/** Load demo activity items for preview / testing. */
export function seedSampleActivities(): ActivityItem[] {
  const now = Date.now()
  const hour = 60 * 60 * 1000
  const offsets = [35 * 60 * 1000, 5 * hour, 26 * hour, 3 * 24 * hour]

  const samples = SAMPLE_ACTIVITY_DEFS.map((sample, index) => ({
    ...sample,
    id: `sample-${sample.kind}-${index}`,
    at: now - offsets[index],
    read: false,
  }))

  const existing = loadActivities().filter((item) => !item.id.startsWith('sample-'))
  saveActivities([...samples, ...existing])
  return loadActivities()
}

export function clearSampleActivities(): ActivityItem[] {
  const stored = readJson<ActivityItem[]>(ACTIVITIES_KEY, [])
  const next = stored
    .map((item) => normalizeActivity(item))
    .filter((item): item is ActivityItem => item !== null)
    .filter((item) => !item.id.startsWith('sample-'))
    .filter((item) => isUserActivity(item))
  saveActivities(next)
  return next
}

export const ACTIVITY_EXAMPLES = SAMPLE_ACTIVITY_DEFS.map((sample) => ({
  kind: sample.kind,
  title: sample.title,
  detail: sample.detail,
  entityId: sample.entityId,
}))
