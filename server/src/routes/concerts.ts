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
    const attractionId = await findAttractionId(artist)

    const params = new URLSearchParams({
      apikey: apiKey(),
      classificationName: 'Music',
      size: '8',
      sort: located ? 'distance,asc' : 'date,asc',
    })

    if (attractionId) {
      params.set('attractionId', attractionId)
    } else {
      params.set('keyword', artist)
    }

    if (located) {
      params.set('latlong', `${lat},${lng}`)
      params.set('radius', '250')
      params.set('unit', 'miles')
    }

    let rawEvents = await fetchEvents(params)

    // If nearby search is empty, fall back to upcoming tour dates anywhere.
    if (rawEvents.length === 0 && located) {
      const worldwide = new URLSearchParams({
        apikey: apiKey(),
        classificationName: 'Music',
        size: '8',
        sort: 'date,asc',
      })
      if (attractionId) worldwide.set('attractionId', attractionId)
      else worldwide.set('keyword', artist)
      rawEvents = await fetchEvents(worldwide)
    }

    const events = dedupeAndRankEvents(rawEvents, artist)
      .map((event) => mapEvent(event, lat, lng))
      .filter((event): event is ConcertEvent => event !== null)
      .slice(0, 5)

    const encoded = encodeURIComponent(artist)
    res.json({
      artist,
      events,
      artistUrl: `https://www.ticketmaster.com/search?q=${encoded}`,
      located,
      source: 'ticketmaster',
    })
  } catch (error) {
    next(error)
  }
})
