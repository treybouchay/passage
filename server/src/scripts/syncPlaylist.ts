/**
 * Sync the G.O.D. Spotify playlist into src/data/playlistSongs.json
 *
 * Usage (from repo root):
 *   npm run sync:playlist
 *
 * Requires SPOTIFY_CLIENT_ID + SPOTIFY_CLIENT_SECRET in .env
 * (Spotify Developer Dashboard → app → Client Credentials flow).
 *
 * Merge rules:
 * - Playlist is the source of truth for which tracks exist
 * - Existing themes/keywords/genre/songBlurb/artistBlurb are preserved by spotifyTrackId (then title)
 * - New tracks get title-derived default keywords, empty themes, and Indie genre
 */

import { config as loadEnv } from 'dotenv'
import { readFile, writeFile } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(__dirname, '../../..')
loadEnv({ path: resolve(repoRoot, '.env') })

const PLAYLIST_ID =
  process.env.SPOTIFY_PLAYLIST_ID ?? '3zweaDyE8UZiMdBAsPagxd'
const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID ?? ''
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET ?? ''
const OUT_PATH = resolve(repoRoot, 'src/data/playlistSongs.json')

interface PlaylistSong {
  id: string
  title: string
  artists: string
  genre: string
  themes: string[]
  keywords: string[]
  spotifyUrl: string
  spotifyTrackId?: string
  albumArtUrl?: string
  songBlurb?: string
  artistBlurb?: string
}

interface SpotifyImage {
  url: string
  height: number | null
  width: number | null
}

interface SpotifyTrack {
  id: string
  name: string
  artists: { name: string }[]
  album: { images: SpotifyImage[] }
  external_urls?: { spotify?: string }
}

interface PlaylistItemsResponse {
  items: { track: SpotifyTrack | null }[]
  next: string | null
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)
}

function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/\s*[-–—]\s*(demo|deluxe|remaster(ed)?|radio edit).*$/i, '')
    .replace(/\s*\([^)]*\)\s*$/g, '')
    .replace(/[^\w\s']/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function defaultKeywords(title: string): string[] {
  const stop = new Set([
    'a',
    'an',
    'the',
    'of',
    'to',
    'in',
    'on',
    'my',
    'me',
    'you',
    'your',
    'and',
    'or',
    'for',
    'with',
    'is',
    'be',
    'no',
    'such',
    'thing',
    'demo',
    'deluxe',
  ])
  const words = title
    .toLowerCase()
    .replace(/[^\w\s']/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stop.has(w))
  return [...new Set(words)].slice(0, 8)
}

function pickAlbumArt(images: SpotifyImage[]): string | undefined {
  if (!images.length) return undefined
  const ranked = [...images].sort(
    (a, b) => (b.width ?? 0) - (a.width ?? 0) || (b.height ?? 0) - (a.height ?? 0),
  )
  // Prefer ~300px when available; fall back to largest.
  const medium = ranked.find((img) => (img.width ?? 0) >= 280 && (img.width ?? 0) <= 400)
  const chosen = medium ?? ranked[0]
  return chosen.url.replace('ab67616d00004851', 'ab67616d00001e02')
}

async function getAccessToken(): Promise<string> {
  if (!CLIENT_ID || !CLIENT_SECRET) {
    throw new Error(
      'Missing SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET in .env\n' +
        'Create a Spotify app at https://developer.spotify.com/dashboard and enable Client Credentials.',
    )
  }

  const basic = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Spotify token failed (${res.status}): ${body}`)
  }

  const data = (await res.json()) as { access_token: string }
  return data.access_token
}

async function fetchPlaylistTracks(token: string): Promise<SpotifyTrack[]> {
  const tracks: SpotifyTrack[] = []
  let url: string | null =
    `https://api.spotify.com/v1/playlists/${PLAYLIST_ID}/tracks` +
    `?limit=100&fields=items(track(id,name,artists(name),album(images),external_urls)),next`

  while (url) {
    const res: Response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) {
      const body = await res.text()
      throw new Error(`Playlist fetch failed (${res.status}): ${body}`)
    }
    const data = (await res.json()) as PlaylistItemsResponse
    for (const item of data.items) {
      if (item.track?.id) tracks.push(item.track)
    }
    url = data.next
  }

  return tracks
}

async function loadExisting(): Promise<PlaylistSong[]> {
  try {
    const raw = await readFile(OUT_PATH, 'utf8')
    return JSON.parse(raw) as PlaylistSong[]
  } catch {
    return []
  }
}

function findExisting(
  existing: PlaylistSong[],
  trackId: string,
  title: string,
): PlaylistSong | undefined {
  const byId = existing.find((s) => s.spotifyTrackId === trackId)
  if (byId) return byId

  const norm = normalizeTitle(title)
  return existing.find((s) => normalizeTitle(s.title) === norm)
}

function mergeSongs(
  existing: PlaylistSong[],
  tracks: SpotifyTrack[],
): { songs: PlaylistSong[]; added: string[]; updated: number } {
  const usedIds = new Set<string>()
  const added: string[] = []
  let updated = 0

  const songs = tracks.map((track) => {
    const prev = findExisting(existing, track.id, track.name)
    const artists = track.artists.map((a) => a.name).join(', ')
    const albumArtUrl = pickAlbumArt(track.album.images)
    const spotifyUrl =
      track.external_urls?.spotify ?? `https://open.spotify.com/track/${track.id}`

    let id = prev?.id ?? (slugify(`${track.name}-${artists}`) || track.id)
    if (usedIds.has(id)) id = `${id}-${track.id.slice(0, 6)}`
    usedIds.add(id)

    if (prev) {
      updated += 1
      return {
        id,
        title: track.name,
        artists,
        genre: prev.genre || 'Indie',
        themes: prev.themes,
        keywords: prev.keywords.length ? prev.keywords : defaultKeywords(track.name),
        spotifyTrackId: track.id,
        spotifyUrl,
        albumArtUrl,
        ...(prev.songBlurb ? { songBlurb: prev.songBlurb } : {}),
        ...(prev.artistBlurb ? { artistBlurb: prev.artistBlurb } : {}),
      } satisfies PlaylistSong
    }

    added.push(track.name)
    return {
      id,
      title: track.name,
      artists,
      // New tracks: empty themes / default genre — curate later in playlistSongs.json
      genre: 'Indie',
      themes: [],
      keywords: defaultKeywords(track.name),
      spotifyTrackId: track.id,
      spotifyUrl,
      albumArtUrl,
    } satisfies PlaylistSong
  })

  return { songs, added, updated }
}

async function main() {
  console.info(`Syncing Spotify playlist ${PLAYLIST_ID}…`)
  const token = await getAccessToken()
  const [tracks, existing] = await Promise.all([
    fetchPlaylistTracks(token),
    loadExisting(),
  ])

  if (!tracks.length) {
    throw new Error('Playlist returned 0 tracks — check playlist id / app access.')
  }

  const { songs, added, updated } = mergeSongs(existing, tracks)
  await writeFile(OUT_PATH, `${JSON.stringify(songs, null, 2)}\n`, 'utf8')

  console.info(`Wrote ${songs.length} songs → src/data/playlistSongs.json`)
  console.info(
    `Updated metadata for ${updated} known track(s) (themes/keywords/genre/songBlurb/artistBlurb preserved)`,
  )
  if (added.length) {
    console.info(`Added ${added.length} new track(s) with default keywords / empty themes / Indie genre:`)
    for (const title of added) console.info(`  + ${title}`)
    console.info('Curate themes/keywords/genre for new tracks in playlistSongs.json as needed.')
  } else {
    console.info('No new tracks.')
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
