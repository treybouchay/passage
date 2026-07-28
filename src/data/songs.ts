import playlistSongsJson from './playlistSongs.json'

/** Display order for Music page genre groupings. */
export const SONG_GENRE_ORDER = [
  'R&B',
  'Rap',
  'Country',
  'Worship',
  'Indie',
  'Ambient',
] as const

export type SongGenre = (typeof SONG_GENRE_ORDER)[number]

/**
 * Curated music themes drawn from passage theme vocabulary.
 * Keep playlistSongs.json themes within this set (1–2 per song).
 */
export const SONG_THEME_ORDER = [
  'love',
  'grace',
  'hope',
  'peace',
  'faith',
  'trust',
  'joy',
  'presence',
  'strength',
  'purpose',
  'salvation',
  'belonging',
  'gratitude',
  'guidance',
  'suffering',
  'anxiety',
] as const

export type SongTheme = (typeof SONG_THEME_ORDER)[number]

export interface PlaylistSong {
  id: string
  title: string
  artists: string
  genre: SongGenre
  themes: string[]
  keywords: string[]
  /** Direct Spotify track URL when synced; otherwise a search URL. */
  spotifyUrl: string
  spotifyTrackId?: string
  albumArtUrl?: string
  /** Short curated note about the song; falls back via getSongBlurb. */
  songBlurb?: string
  /** Short curated note about the artist; falls back via getSongArtistBlurb. */
  artistBlurb?: string
}

const GENRE_ARTIST_BLURB: Record<SongGenre, string> = {
  'R&B': 'Christian R&B artist exploring faith through smooth, soulful sound.',
  Rap: 'Christian hip-hop artist bringing faith and conviction to the beat.',
  Country: 'Faith-rooted country artist with an honest, storytelling voice.',
  Worship: 'Worship artist creating songs for presence and praise.',
  Indie: 'Indie faith artist with intimate, reflective songwriting.',
  Ambient: 'Ambient artist crafting spacious soundscapes for rest and reflection.',
}

const GENRE_SONG_BLURB: Record<SongGenre, string> = {
  'R&B': 'A smooth, soulful track that leans into faith with quiet intensity.',
  Rap: 'A faith-forward hip-hop track with conviction and drive.',
  Country: 'An honest, storytelling song rooted in everyday faith.',
  Worship: 'A worship song made for presence, praise, and lingering with God.',
  Indie: 'An intimate indie track with reflective, faith-tinged songwriting.',
  Ambient: 'A spacious ambient piece for rest, calm, and quiet reflection.',
}

const THEME_SONG_HINT: Record<string, string> = {
  love: 'It sits in the tenderness of love — received, given, and held.',
  grace: 'It turns toward grace: undeserved kindness meeting real need.',
  hope: 'It carries a quiet hope that things can still turn toward light.',
  peace: 'It leans into peace — the kind that steadies a restless heart.',
  faith: 'It is about faith that keeps walking when the path is unclear.',
  trust: 'It circles trust: releasing control and leaning into God.',
  joy: 'It opens into joy — light, grateful, and alive.',
  presence: 'It seeks presence: God near in the ordinary and the holy.',
  strength: 'It reaches for strength when weakness feels closer than courage.',
  purpose: 'It asks what we are for — purpose, calling, and direction.',
  salvation: 'It points toward salvation and being made new.',
  belonging: 'It looks for belonging — a place to be known and held.',
  gratitude: 'It slows into gratitude for what is already given.',
  guidance: 'It asks for guidance when the next step is hard to see.',
  suffering: 'It stays with suffering without pretending it is easy.',
  anxiety: 'It meets anxiety with room to breathe and settle.',
}

/** Prefer curated songBlurb; otherwise a short genre/theme line. */
export function getSongBlurb(song: PlaylistSong): string {
  if (song.songBlurb?.trim()) return song.songBlurb.trim()

  const theme = song.themes[0]
  const base =
    GENRE_SONG_BLURB[song.genre] ?? 'A faith-rooted song of hope and presence.'
  if (!theme) return base

  const hint = THEME_SONG_HINT[theme]
  if (hint) return hint

  return `${base.replace(/\.$/, '')} — touching on ${theme}.`
}

/** Prefer curated artistBlurb; otherwise a short genre/theme line. */
export function getSongArtistBlurb(song: PlaylistSong): string {
  if (song.artistBlurb?.trim()) return song.artistBlurb.trim()

  const theme = song.themes[0]
  const base =
    GENRE_ARTIST_BLURB[song.genre] ??
    'Faith artist sharing songs of hope and presence.'
  if (!theme) return base

  return base.replace(/\.$/, ` — often writing about ${theme}.`)
}

export const SPOTIFY_PLAYLIST = {
  id: '3zweaDyE8UZiMdBAsPagxd',
  name: 'G.O.D.',
  url: 'https://open.spotify.com/playlist/3zweaDyE8UZiMdBAsPagxd',
} as const

/**
 * Curated tracks from the G.O.D. Spotify playlist, tagged to Passage themes.
 * Refresh metadata (and pull new tracks) with: npm run sync:playlist
 */
export const playlistSongs: PlaylistSong[] = playlistSongsJson as PlaylistSong[]

export function songsByGenre(
  songs: PlaylistSong[] = playlistSongs,
): { genre: SongGenre; songs: PlaylistSong[] }[] {
  const groups = new Map<SongGenre, PlaylistSong[]>()

  for (const song of songs) {
    const list = groups.get(song.genre) ?? []
    list.push(song)
    groups.set(song.genre, list)
  }

  return SONG_GENRE_ORDER.filter((genre) => groups.has(genre)).map((genre) => ({
    genre,
    songs: groups.get(genre)!,
  }))
}
