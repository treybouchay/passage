const API_BASE = import.meta.env.VITE_API_URL ?? ''

/** Public Discovery sample key — used only as client fallback when /api/concerts is unreachable. */
const TM_FALLBACK_KEY = 'pLOeuGq2JL05uEGrZG7DuGWu6sh2OnMz'

export interface ConcertEvent {
  id: string
  title: string
  datetime: string
  venueName: string
  city: string
  region: string
  country: string
  latitude: number | null
  longitude: number | null
  url: string
  distanceKm: number | null
}

export interface ConcertsResponse {
  artist: string
  events: ConcertEvent[]
  artistUrl: string | null
  located?: boolean
}

interface TmAttraction {
  id?: string
  name?: string
}

interface TmVenue {
  name?: string
  city?: { name?: string }
  state?: { stateCode?: string; name?: string }
  country?: { countryCode?: string; name?: string }
  location?: { latitude?: string; longitude?: string }
}

interface TmEvent {
  id?: string
  name?: string
  url?: string
  dates?: {
    start?: {
      dateTime?: string
      localDate?: string
      localTime?: string
    }
  }
  _embedded?: { venues?: TmVenue[]; attractions?: TmAttraction[] }
  distance?: number
  units?: string
}

export function primaryArtistName(artists: string): string {
  return artists.split(/,|&|feat\.|ft\.|with/i)[0]?.trim() || artists.trim()
}

export function prefersCanadaRegion(
  coords?: { lat: number; lng: number } | null,
): boolean {
  if (
    coords &&
    coords.lat > 41 &&
    coords.lat < 84 &&
    coords.lng < -52 &&
    coords.lng > -141
  ) {
    return true
  }
  try {
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone || ''
    return (
      zone.startsWith('America/Toronto') ||
      zone.startsWith('America/Vancouver') ||
      zone.startsWith('America/Edmonton') ||
      zone.startsWith('America/Winnipeg') ||
      zone.startsWith('America/Halifax') ||
      zone.startsWith('America/St_Johns') ||
      zone.startsWith('America/Whitehorse') ||
      zone.startsWith('America/Yellowknife') ||
      zone.startsWith('America/Iqaluit') ||
      zone.startsWith('America/Rankin_Inlet') ||
      zone.startsWith('America/Regina') ||
      zone.startsWith('America/Moncton') ||
      zone.startsWith('America/Goose_Bay') ||
      zone.startsWith('America/Blanc-Sablon') ||
      zone === 'America/Montreal'
    )
  } catch {
    return false
  }
}

export function ticketmasterSearchUrl(
  artist: string,
  coords?: { lat: number; lng: number } | null,
): string {
  const host = prefersCanadaRegion(coords)
    ? 'www.ticketmaster.ca'
    : 'www.ticketmaster.com'
  return `https://${host}/search?q=${encodeURIComponent(artist)}`
}


function toNumber(value: string | number | undefined | null): number | null {
  if (value === undefined || value === null || value === '') return null
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) ? n : null
}

function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function normalizeName(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

function namesMatch(a: string, b: string): boolean {
  const left = normalizeName(a)
  const right = normalizeName(b)
  return left === right || left.includes(right) || right.includes(left)
}

function isHotelPackage(event: TmEvent): boolean {
  const name = event.name?.toLowerCase() ?? ''
  return name.includes('hotel package') || name.includes('ticket + hotel')
}

function mapTmEvent(
  event: TmEvent,
  coords?: { lat: number; lng: number } | null,
): ConcertEvent | null {
  const venue = event._embedded?.venues?.[0]
  const datetime =
    event.dates?.start?.dateTime ||
    (event.dates?.start?.localDate
      ? `${event.dates.start.localDate}T${event.dates.start.localTime ?? '00:00:00'}`
      : null)
  if (!datetime || !event.id) return null

  const venueLat = toNumber(venue?.location?.latitude)
  const venueLng = toNumber(venue?.location?.longitude)
  let distanceKm: number | null = null
  if (typeof event.distance === 'number') {
    distanceKm = event.units === 'miles' ? event.distance * 1.609344 : event.distance
  } else if (coords && venueLat !== null && venueLng !== null) {
    distanceKm = haversineKm(coords.lat, coords.lng, venueLat, venueLng)
  }

  return {
    id: event.id,
    title: event.name?.trim() || 'Concert',
    datetime,
    venueName: venue?.name?.trim() || 'Venue TBA',
    city: venue?.city?.name?.trim() || '',
    region: venue?.state?.stateCode?.trim() || venue?.state?.name?.trim() || '',
    country: venue?.country?.countryCode?.trim() || venue?.country?.name?.trim() || '',
    latitude: venueLat,
    longitude: venueLng,
    url: event.url?.trim() || '',
    distanceKm,
  }
}

async function tmJson<T>(url: string): Promise<T> {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Ticketmaster ${response.status}`)
  return (await response.json()) as T
}

async function fetchTicketmasterDirect(
  artist: string,
  coords?: { lat: number; lng: number } | null,
): Promise<ConcertsResponse> {
  const attractionParams = new URLSearchParams({
    apikey: TM_FALLBACK_KEY,
    keyword: artist,
    classificationName: 'Music',
    size: '8',
  })
  const attractionPayload = await tmJson<{
    _embedded?: { attractions?: TmAttraction[] }
  }>(
    `https://app.ticketmaster.com/discovery/v2/attractions.json?${attractionParams}`,
  )
  const attractions = attractionPayload._embedded?.attractions ?? []
  const matched =
    attractions.find((item) => item.id && item.name && namesMatch(item.name, artist)) ??
    attractions.find((item) => item.id)
  const attractionId = matched?.id ?? null
  const inCanada = prefersCanadaRegion(coords)

  const buildParams = (extra: Record<string, string>) => {
    const params = new URLSearchParams({
      apikey: TM_FALLBACK_KEY,
      classificationName: 'Music',
      size: '8',
      ...extra,
    })
    if (attractionId) params.set('attractionId', attractionId)
    else params.set('keyword', artist)
    return params
  }

  const queries = [
    buildParams({ countryCode: 'CA', sort: 'date,asc', preferredCountry: 'ca' }),
    buildParams({ countryCode: 'US', sort: 'date,asc', preferredCountry: 'us' }),
  ]
  if (coords) {
    queries.push(
      buildParams({
        latlong: `${coords.lat},${coords.lng}`,
        radius: '500',
        unit: 'miles',
        sort: 'distance,asc',
        preferredCountry: inCanada ? 'ca' : 'us',
      }),
    )
  }

  const payloads = await Promise.all(
    queries.map((params) =>
      tmJson<{ _embedded?: { events?: TmEvent[] } }>(
        `https://app.ticketmaster.com/discovery/v2/events.json?${params}`,
      ).catch(() => ({ _embedded: { events: [] as TmEvent[] } })),
    ),
  )

  const byId = new Map<string, TmEvent>()
  for (const payload of payloads) {
    for (const event of payload._embedded?.events ?? []) {
      if (!event.id || byId.has(event.id)) continue
      byId.set(event.id, event)
    }
  }

  const filtered = [...byId.values()].filter((event) => {
    if (isHotelPackage(event)) return false
    const list = event._embedded?.attractions ?? []
    if (list.length === 0) return true
    return list.some((item) => item.name && namesMatch(item.name, artist))
  })

  const events = filtered
    .map((event) => mapTmEvent(event, coords))
    .filter((event): event is ConcertEvent => event !== null)

  events.sort((a, b) => {
    if (a.distanceKm != null && b.distanceKm != null && a.distanceKm !== b.distanceKm) {
      return a.distanceKm - b.distanceKm
    }
    if (inCanada) {
      const ca = a.country.toUpperCase() === 'CA' ? 0 : 1
      const cb = b.country.toUpperCase() === 'CA' ? 0 : 1
      if (ca !== cb) return ca - cb
    }
    return a.datetime.localeCompare(b.datetime)
  })

  const usedNearby = events.some(
    (event) => event.distanceKm !== null && event.distanceKm <= 500 * 1.609344,
  )

  return {
    artist,
    events: events.slice(0, 1),
    artistUrl: ticketmasterSearchUrl(artist, coords),
    located: usedNearby,
  }
}

export async function fetchArtistConcerts(
  artist: string,
  coords?: { lat: number; lng: number } | null,
): Promise<ConcertsResponse> {
  const params = new URLSearchParams({ artist })
  if (coords) {
    params.set('lat', String(coords.lat))
    params.set('lng', String(coords.lng))
  }
  if (prefersCanadaRegion(coords)) {
    params.set('preferCanada', '1')
  }

  try {
    const response = await fetch(`${API_BASE}/api/concerts?${params}`)
    if (response.ok) {
      return (await response.json()) as ConcertsResponse
    }
  } catch {
    // Fall through to direct Ticketmaster (common on phone LAN / no API).
  }

  return fetchTicketmasterDirect(artist, coords)
}

export function formatConcertDate(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function formatConcertPlace(event: ConcertEvent): string {
  const parts = [event.city, event.region || event.country].filter(Boolean)
  return parts.join(', ')
}

export function formatConcertDistance(km: number | null): string | null {
  if (km === null) return null
  const miles = km / 1.609344
  if (miles < 1) return 'nearby'
  return `${Math.round(miles)} mi away`
}

export function getBrowserCoords(
  timeoutMs = 4000,
): Promise<{ lat: number; lng: number } | null> {
  if (!navigator.geolocation) return Promise.resolve(null)

  return new Promise((resolve) => {
    let settled = false
    const finish = (value: { lat: number; lng: number } | null) => {
      if (settled) return
      settled = true
      window.clearTimeout(timer)
      resolve(value)
    }

    const timer = window.setTimeout(() => finish(null), timeoutMs)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        finish({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        })
      },
      () => finish(null),
      { enableHighAccuracy: false, maximumAge: 600_000, timeout: timeoutMs },
    )
  })
}
