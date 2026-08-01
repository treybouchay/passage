const API_BASE = import.meta.env.VITE_API_URL ?? ''

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

export function primaryArtistName(artists: string): string {
  return artists.split(/,|&|feat\.|ft\.|with/i)[0]?.trim() || artists.trim()
}

export function bandsintownSearchUrl(artist: string): string {
  return `https://www.bandsintown.com/a/${encodeURIComponent(artist)}`
}

export function ticketmasterSearchUrl(artist: string): string {
  return `https://www.ticketmaster.com/search?q=${encodeURIComponent(artist)}`
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

  const response = await fetch(`${API_BASE}/api/concerts?${params}`)
  if (!response.ok) {
    throw new Error('Failed to load concerts')
  }
  return (await response.json()) as ConcertsResponse
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
  timeoutMs = 2500,
): Promise<{ lat: number; lng: number } | null> {
  if (!navigator.geolocation) return Promise.resolve(null)

  return new Promise((resolve) => {
    const timer = window.setTimeout(() => resolve(null), timeoutMs)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        window.clearTimeout(timer)
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        })
      },
      () => {
        window.clearTimeout(timer)
        resolve(null)
      },
      { enableHighAccuracy: false, maximumAge: 600_000, timeout: timeoutMs },
    )
  })
}
