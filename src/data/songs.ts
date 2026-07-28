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
