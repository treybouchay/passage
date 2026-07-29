/**
 * Sync the G.O.D. Spotify playlist into src/data/playlistSongs.json
 *
 * Usage (from repo root):
 *   npm run sync:playlist
 *
 * Requires SPOTIFY_CLIENT_ID + SPOTIFY_CLIENT_SECRET in root .env
 * or server/.env (Spotify Developer Dashboard → Client Credentials).
 *
 * Optional: SPOTIFY_REFRESH_TOKEN (owner/collaborator) if Client Credentials
 * still gets 403 after Extended Quota is approved.
 *
 * Merge rules:
 * - Playlist is the source of truth for which tracks exist
 * - Existing themes/keywords/genre/songBlurb/artistBlurb/lyricsExcerpt are preserved by spotifyTrackId (then title)
 * - New tracks get title-derived default keywords, empty themes, and Indie genre
 */

import { config as loadEnv } from 'dotenv'
import { readFile, writeFile } from 'node:fs/promises'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const repoRoot = resolve(__dirname, '../../..')
loadEnv({ path: resolve(repoRoot, '.env') })
loadEnv({ path: resolve(repoRoot, 'server/.env') }) // server/.env overrides root if both set

const PLAYLIST_ID =
  process.env.SPOTIFY_PLAYLIST_ID?.trim() || '3zweaDyE8UZiMdBAsPagxd'
const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID?.trim() ?? ''
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET?.trim() ?? ''
const REFRESH_TOKEN = process.env.SPOTIFY_REFRESH_TOKEN?.trim() ?? ''
const OUT_PATH = resolve(repoRoot, 'src/data/playlistSongs.json')
const IN_GITHUB_ACTIONS = process.env.GITHUB_ACTIONS === 'true'

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
  lyricsExcerpt?: string
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
  items: { item?: SpotifyTrack | null; track?: SpotifyTrack | null }[]
  next: string | null
}

function missingSecretsError(): Error {
  if (IN_GITHUB_ACTIONS) {
    return new Error(
      [
        'GitHub Actions secrets are missing or empty.',
        'Repo → Settings → Secrets and variables → Actions — set:',
        '  SPOTIFY_CLIENT_ID',
        '  SPOTIFY_CLIENT_SECRET',
        'Optional: SPOTIFY_PLAYLIST_ID, SPOTIFY_REFRESH_TOKEN',
        'Then re-run the "Sync Spotify playlist" workflow.',
      ].join('\n'),
    )
  }
  return new Error(
    [
      'Missing SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET in .env or server/.env',
      'Create a Spotify app at https://developer.spotify.com/dashboard and enable Client Credentials.',
    ].join('\n'),
  )
}

function playlistForbiddenError(status: number, body: string): Error {
  return new Error(
    [
      `Playlist fetch failed (${status}): ${body}`,
      '',
      'Spotify returned Forbidden for GET /playlists/{id}/items.',
      'New Development Mode apps often get 403 on playlist reads until Extended Access is approved.',
      '',
      'Fix in the Spotify Developer Dashboard (https://developer.spotify.com/dashboard):',
      '  1. Open your Passage app',
      '  2. Ensure Web API is enabled',
      '  3. Request Extended Access / Extended Quota Mode ("Request extension")',
      '  4. Wait for approval, keep the playlist Public, then re-run sync',
      '',
      'Optional: set SPOTIFY_REFRESH_TOKEN from a playlist owner/collaborator',
      '(npm run sync:playlist:auth) if Extended Quota alone is not enough.',
    ].join('\n'),
  )
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

async function postToken(body: string): Promise<string> {
  const basic = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Spotify token failed (${res.status}): ${text}`)
  }

  const data = (await res.json()) as { access_token: string }
  return data.access_token
}

async function getAccessToken(): Promise<string> {
  if (!CLIENT_ID || !CLIENT_SECRET) {
    throw missingSecretsError()
  }

  if (REFRESH_TOKEN) {
    return postToken(
      `grant_type=refresh_token&refresh_token=${encodeURIComponent(REFRESH_TOKEN)}`,
    )
  }

  return postToken('grant_type=client_credentials')
}

function playlistEntry(row: {
  item?: SpotifyTrack | null
  track?: SpotifyTrack | null
}): SpotifyTrack | null {
  // Feb 2026 rename: track → item (keep track fallback for older responses)
  return row.item ?? row.track ?? null
}

async function fetchPlaylistTracks(token: string): Promise<SpotifyTrack[]> {
  const tracks: SpotifyTrack[] = []
  // Deprecated /tracks → /items (Spotify Feb 2026; max limit 50)
  let url: string | null =
    `https://api.spotify.com/v1/playlists/${PLAYLIST_ID}/items` +
    `?limit=50&fields=items(item(id,name,artists(name),album(images),external_urls),track(id,name,artists(name),album(images),external_urls)),next`

  while (url) {
    const res: Response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) {
      const body = await res.text()
      if (res.status === 403) {
        throw playlistForbiddenError(res.status, body)
      }
      throw new Error(`Playlist fetch failed (${res.status}): ${body}`)
    }
    const data = (await res.json()) as PlaylistItemsResponse
    for (const row of data.items) {
      const track = playlistEntry(row)
      if (track?.id) tracks.push(track)
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
        ...(prev.lyricsExcerpt ? { lyricsExcerpt: prev.lyricsExcerpt } : {}),
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
    throw new Error(
      'Playlist returned 0 tracks — check SPOTIFY_PLAYLIST_ID, playlist visibility (Public), and Extended Access approval.',
    )
  }

  const { songs, added, updated } = mergeSongs(existing, tracks)
  const keptIds = new Set(songs.map((s) => s.spotifyTrackId).filter(Boolean))
  const removed = existing.filter(
    (s) => s.spotifyTrackId && !keptIds.has(s.spotifyTrackId),
  )

  await writeFile(OUT_PATH, `${JSON.stringify(songs, null, 2)}\n`, 'utf8')

  console.info(`Wrote ${songs.length} songs → src/data/playlistSongs.json`)
  console.info(
    `Updated metadata for ${updated} known track(s) (themes/keywords/genre/songBlurb/artistBlurb/lyricsExcerpt preserved)`,
  )
  if (added.length) {
    console.info(`Added ${added.length} new track(s) with default keywords / empty themes / Indie genre:`)
    for (const title of added) console.info(`  + ${title}`)
    console.info('Curate themes/keywords/genre for new tracks in playlistSongs.json as needed.')
  } else {
    console.info('No new tracks.')
  }
  if (removed.length) {
    console.info(`Removed ${removed.length} track(s) no longer on the playlist:`)
    for (const song of removed) console.info(`  - ${song.title}`)
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
