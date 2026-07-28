import { playlistSongs, type PlaylistSong } from '../data/songs'

export interface MatchedSong extends PlaylistSong {
  score: number
}

const STOP_WORDS = new Set([
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
  'do',
  'i',
])

/** Collapse acronyms like "G.O.D." → "god" before tokenizing. */
function expandAcronyms(text: string): string {
  return text.replace(/\b(?:[a-z]\.){1,}[a-z]\.?/gi, (m) => m.replace(/\./g, ''))
}

function normalizeText(text: string): string {
  return expandAcronyms(text.toLowerCase())
    .replace(/[^\w\s']/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function tokenize(text: string): string[] {
  return normalizeText(text)
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOP_WORDS.has(t))
}

/**
 * Rank playlist songs for a free-text query.
 * Typed query overlap with title / artist / keywords is primary;
 * passage themes are a secondary boost.
 */
export function matchSongs(
  query: string,
  passageThemes: string[] = [],
  limit = 3,
): MatchedSong[] {
  const normalized = normalizeText(query)
  const tokens = tokenize(query)
  const themeSet = new Set(passageThemes.map((t) => t.toLowerCase()))

  if (!normalized) return []

  const scored = playlistSongs.map((song) => {
    let score = 0

    const titleNorm = normalizeText(song.title)
    const titleTokens = new Set(tokenize(song.title))
    const artistTokens = new Set(tokenize(song.artists))

    // Primary: query tokens in the song title (strongest signal)
    for (const token of tokens) {
      if (titleTokens.has(token)) {
        score += 10
      } else if (token.length > 2 && titleNorm.includes(token)) {
        // e.g. "love" inside "Lalalove"
        score += 8
      }

      if (artistTokens.has(token)) {
        score += 3
      }
    }

    // Primary: curated keywords / phrases
    for (const keyword of song.keywords) {
      const kw = keyword.toLowerCase()
      if (kw.includes(' ')) {
        if (normalized.includes(kw)) score += 8
      } else if (tokens.includes(kw)) {
        score += 7
      }
    }

    // Secondary: passage theme overlap (weaker so generic love passages
    // don't crown every love-tagged track, esp. the playlist-title song)
    for (const theme of song.themes) {
      const t = theme.toLowerCase()
      if (themeSet.has(t)) score += 2
      if (tokens.includes(t)) score += 2
    }

    return { ...song, score }
  })

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title))
    .slice(0, limit)
}
