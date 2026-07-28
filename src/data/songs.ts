import playlistSongsJson from './playlistSongs.json'

export interface PlaylistSong {
  id: string
  title: string
  artists: string
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
