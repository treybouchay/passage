import { Router } from 'express'
import { config } from '../config.js'

/** Ticketmaster's public Discovery sample key (docs). Prefer TICKETMASTER_API_KEY. */
const FALLBACK_TM_KEY = 'pLOeuGq2JL05uEGrZG7DuGWu6sh2OnMz'

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

interface TmImage {
  url?: string
  width?: number
  height?: number
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
  images?: TmImage[]
  distance?: number
  units?: string
}

interface TmAttraction {
  id?: string
  name?: string
}

function apiKey(): string {
  return config.ticketmasterApiKey || FALLBACK_TM_KEY
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

async function findAttractionId(artist: string): Promise<string | null> {
  const params = new URLSearchParams({
    apikey: apiKey(),
    keyword: artist,
    classificationName: 'Music',
    size: '8',
  })
  const response = await fetch(
    `https://app.ticketmaster.com/discovery/v2/attractions.json?${params}`,
  )
  if (!response.ok) return null
  const payload = (await response.json()) as {
    _embedded?: { attractions?: TmAttraction[] }
  }
  const attractions = payload._embedded?.attractions ?? []
  const exact = attractions.find((item) => item.id && item.name && namesMatch(item.name, artist))
  if (exact?.id) return exact.id
  return attractions.find((item) => item.id)?.id ?? null
}

function mapEvent(
  event: TmEvent,
  lat: number | null,
  lng: number | null,
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
  } else if (
    lat !== null &&
    lng !== null &&
    venueLat !== null &&
    venueLng !== null
  ) {
    distanceKm = haversineKm(lat, lng, venueLat, venueLng)
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

async function fetchEvents(params: URLSearchParams): Promise<TmEvent[]> {
  const response = await fetch(
    `https://app.ticketmaster.com/discovery/v2/events.json?${params}`,
  )
  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Ticketmaster error ${response.status}: ${body.slice(0, 200)}`)
  }
  const payload = (await response.json()) as {
    _embedded?: { events?: TmEvent[] }
  }
  return payload._embedded?.events ?? []
}

function mergeEvents(...lists: TmEvent[][]): TmEvent[] {
  const byId = new Map<string, TmEvent>()
  for (const list of lists) {
    for (const event of list) {
      if (!event.id || byId.has(event.id)) continue
      byId.set(event.id, event)
    }
  }
  return [...byId.values()]
}

function withArtistFilter(
  base: Record<string, string>,
  attractionId: string | null,
  artist: string,
): URLSearchParams {
  const params = new URLSearchParams(base)
  if (attractionId) params.set('attractionId', attractionId)
  else params.set('keyword', artist)
  return params
}

/** Ticketmaster markets are siloed — query CA + US and merge. */
async function fetchNorthAmericanEvents(
  attractionId: string | null,
  artist: string,
  options: {
    lat?: number | null
    lng?: number | null
    nearby?: boolean
    preferredCanada?: boolean
  } = {},
): Promise<TmEvent[]> {
  const { lat = null, lng = null, nearby = false, preferredCanada = false } = options
  const shared: Record<string, string> = {
    apikey: apiKey(),
    classificationName: 'Music',
    size: '8',
  }

  const queries: URLSearchParams[] = [
    withArtistFilter(
      {
        ...shared,
        countryCode: 'CA',
        sort: 'date,asc',
        preferredCountry: 'ca',
      },
      attractionId,
      artist,
    ),
    withArtistFilter(
      {
        ...shared,
        countryCode: 'US',
        sort: 'date,asc',
        preferredCountry: 'us',
      },
      attractionId,
      artist,
    ),
  ]

  if (nearby && lat !== null && lng !== null) {
    queries.push(
      withArtistFilter(
        {
          ...shared,
          latlong: `${lat},${lng}`,
          radius: '500',
          unit: 'miles',
          sort: 'distance,asc',
          preferredCountry: preferredCanada ? 'ca' : 'us',
        },
        attractionId,
        artist,
      ),
    )
  }

  const results = await Promise.all(
    queries.map((params) => fetchEvents(params).catch(() => [] as TmEvent[])),
  )
  return mergeEvents(...results)
}

function isHotelPackage(event: TmEvent): boolean {
  const name = event.name?.toLowerCase() ?? ''
  return name.includes('hotel package') || name.includes('ticket + hotel')
}

function eventIncludesArtist(event: TmEvent, artist: string): boolean {
  const attractions = event._embedded?.attractions ?? []
  if (attractions.length === 0) return true
  return attractions.some((item) => item.name && namesMatch(item.name, artist))
}

function artistIsHeadliner(event: TmEvent, artist: string): boolean {
  const headliner = event._embedded?.attractions?.[0]?.name
  return Boolean(headliner && namesMatch(headliner, artist))
}

function dedupeAndRankEvents(events: TmEvent[], artist: string): TmEvent[] {
  const relevant = events.filter(
    (event) => eventIncludesArtist(event, artist) && !isHotelPackage(event),
  )
  const preferred =
    relevant.filter((event) => artistIsHeadliner(event, artist)).length > 0
      ? relevant.filter((event) => artistIsHeadliner(event, artist))
      : relevant

  const seen = new Set<string>()
  const unique: TmEvent[] = []
  for (const event of preferred) {
    const venue = event._embedded?.venues?.[0]
    const day = event.dates?.start?.localDate || event.dates?.start?.dateTime || ''
    const key = `${day}|${venue?.name ?? ''}|${venue?.city?.name ?? ''}`
    if (seen.has(key)) continue
    seen.add(key)
    unique.push(event)
  }
  return unique
}

export const concertsRouter = Router()

concertsRouter.get('/', async (req, res, next) => {
  try {
    const artist = String(req.query.artist ?? '').trim()
    if (!artist) {
      res.status(400).json({ error: 'artist is required' })
      return
    }

    const lat = toNumber(req.query.lat as string | undefined)
    const lng = toNumber(req.query.lng as string | undefined)
    const located = lat !== null && lng !== null
    const inCanada =
      req.query.preferCanada === '1' ||
      (located && lat! > 41 && lat! < 84 && lng! < -52 && lng! > -141)
    const attractionId = await findAttractionId(artist)

    const rawEvents = await fetchNorthAmericanEvents(attractionId, artist, {
      lat,
      lng,
      nearby: located,
      preferredCanada: Boolean(inCanada),
    })

    const ranked = dedupeAndRankEvents(rawEvents, artist)
    const mapped = ranked
      .map((event) => mapEvent(event, lat, lng))
      .filter((event): event is ConcertEvent => event !== null)

    mapped.sort((a, b) => {
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

    const nearbyMiles = 500
    const usedNearby = mapped.some(
      (event) =>
        event.distanceKm !== null && event.distanceKm <= nearbyMiles * 1.609344,
    )

    const encoded = encodeURIComponent(artist)
    const tmHost = inCanada ? 'www.ticketmaster.ca' : 'www.ticketmaster.com'
    res.json({
      artist,
      events: mapped.slice(0, 1),
      artistUrl: `https://${tmHost}/search?q=${encoded}`,
      located: usedNearby,
      source: 'ticketmaster',
    })
  } catch (error) {
    next(error)
  }
})

interface NearbyArtistInput {
  artist?: string
  albumArtUrl?: string
  songId?: string
}

async function fetchNearbyMusicEvents(
  lat: number,
  lng: number,
  radiusMiles: number,
  preferredCanada: boolean,
): Promise<TmEvent[]> {
  const params = new URLSearchParams({
    apikey: apiKey(),
    classificationName: 'Music',
    latlong: `${lat},${lng}`,
    radius: String(radiusMiles),
    unit: 'miles',
    sort: 'distance,asc',
    size: '100',
    preferredCountry: preferredCanada ? 'ca' : 'us',
  })
  return fetchEvents(params).catch(() => [] as TmEvent[])
}

/**
 * Closest upcoming shows for a list of playlist artists.
 * POST /api/concerts/nearby
 * body: { artists: [{ artist, albumArtUrl?, songId? }], lat?, lng?, limit? }
 */
concertsRouter.post('/nearby', async (req, res, next) => {
  try {
    const rawArtists = Array.isArray(req.body?.artists) ? req.body.artists : []
    const artists = (rawArtists as NearbyArtistInput[])
      .map((item) => ({
        artist: String(item.artist ?? '').trim(),
        albumArtUrl: item.albumArtUrl ? String(item.albumArtUrl) : undefined,
        songId: item.songId ? String(item.songId) : undefined,
      }))
      .filter((item) => item.artist)
      .slice(0, 80)

    if (artists.length === 0) {
      res.status(400).json({ error: 'artists are required' })
      return
    }

    const lat = toNumber(req.body?.lat)
    const lng = toNumber(req.body?.lng)
    const limit = Math.min(Math.max(Number(req.body?.limit) || 3, 1), 6)
    const located = lat !== null && lng !== null
    const inCanada =
      located && lat! > 41 && lat! < 84 && lng! < -52 && lng! > -141

    type NearbyItem = {
      artist: string
      event: ConcertEvent
      albumArtUrl?: string
      songId?: string
    }
    const bestByArtist = new Map<string, NearbyItem>()

    const consider = (
      meta: { artist: string; albumArtUrl?: string; songId?: string },
      event: ConcertEvent | null,
    ) => {
      if (!event) return
      const key = normalizeName(meta.artist)
      const existing = bestByArtist.get(key)
      if (
        !existing ||
        (event.distanceKm != null &&
          (existing.event.distanceKm == null ||
            event.distanceKm < existing.event.distanceKm))
      ) {
        bestByArtist.set(key, {
          artist: meta.artist,
          event,
          albumArtUrl: meta.albumArtUrl,
          songId: meta.songId,
        })
      }
    }

    if (located) {
      for (const radius of [150, 350]) {
        const nearbyEvents = await fetchNearbyMusicEvents(
          lat!,
          lng!,
          radius,
          Boolean(inCanada),
        )
        for (const event of nearbyEvents) {
          if (isHotelPackage(event)) continue
          for (const meta of artists) {
            if (!eventIncludesArtist(event, meta.artist)) continue
            // Require a named attraction match (eventIncludesArtist returns true when empty)
            const attractions = event._embedded?.attractions ?? []
            if (attractions.length === 0) continue
            if (!attractions.some((item) => item.name && namesMatch(item.name, meta.artist))) {
              continue
            }
            consider(meta, mapEvent(event, lat, lng))
          }
        }
        if (bestByArtist.size >= limit) break
      }
    }

    if (bestByArtist.size < limit) {
      const remaining = artists.filter(
        (meta) => !bestByArtist.has(normalizeName(meta.artist)),
      )
      const maxProbe = located ? 12 : 6
      for (let i = 0; i < remaining.length && i < maxProbe && bestByArtist.size < limit; i += 3) {
        const chunk = remaining.slice(i, i + 3)
        const results = await Promise.all(
          chunk.map(async (meta) => {
            try {
              const attractionId = await findAttractionId(meta.artist)
              const rawEvents = await fetchNorthAmericanEvents(attractionId, meta.artist, {
                lat,
                lng,
                nearby: located,
                preferredCanada: Boolean(inCanada),
              })
              const ranked = dedupeAndRankEvents(rawEvents, meta.artist)
              const mapped = ranked
                .map((event) => mapEvent(event, lat, lng))
                .filter((event): event is ConcertEvent => event !== null)
              mapped.sort((a, b) => {
                if (
                  a.distanceKm != null &&
                  b.distanceKm != null &&
                  a.distanceKm !== b.distanceKm
                ) {
                  return a.distanceKm - b.distanceKm
                }
                return a.datetime.localeCompare(b.datetime)
              })
              return { meta, event: mapped[0] ?? null }
            } catch {
              return { meta, event: null }
            }
          }),
        )
        for (const { meta, event } of results) {
          if (!event) continue
          if (located && event.distanceKm == null) continue
          consider(meta, event)
        }
      }
    }

    const items = [...bestByArtist.values()]
      .sort((a, b) => {
        if (a.event.distanceKm != null && b.event.distanceKm != null) {
          return a.event.distanceKm - b.event.distanceKm
        }
        if (a.event.distanceKm != null) return -1
        if (b.event.distanceKm != null) return 1
        return a.event.datetime.localeCompare(b.event.datetime)
      })
      .slice(0, limit)

    res.json({
      items,
      located: located && items.some((item) => item.event.distanceKm != null),
      status: items.length > 0 ? 'ok' : located ? 'empty' : 'no-location',
      source: 'ticketmaster',
    })
  } catch (error) {
    next(error)
  }
})
