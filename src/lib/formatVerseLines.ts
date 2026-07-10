export interface VerseLine {
  text: string
}

/** Matches the reference wallpaper (Ephesians 4:32): short all-caps lines. */
const WORDS_PER_LINE = 3

/** Auto-layout limit; longer passages can still be trimmed in the editor. */
export const WALLPAPER_MAX_CHARACTERS = 200

/** Fits phone and 8×10 print canvases with default spacing. */
export const WALLPAPER_MAX_LINES = 20

export function cleanPassageText(text: string): string {
  return text.replace(/^[“"']|[”"']$/g, '').replace(/[“”]/g, '').trim()
}

export function formatVerseLines(text: string): VerseLine[] {
  const cleaned = cleanPassageText(text)
  const sentences =
    cleaned.match(/[^.!?]+[.!?]+|[^.!?]+$/g)?.map((part) => part.trim()) ?? [cleaned]
  const lines: VerseLine[] = []

  for (const sentence of sentences) {
    const clauses = sentence
      .split(/(?<=,|;)\s+/)
      .map((clause) => clause.trim())
      .filter(Boolean)

    for (const clause of clauses) {
      const words = clause.split(/\s+/).filter(Boolean)

      if (words.length <= WORDS_PER_LINE) {
        lines.push({ text: clause })
      } else {
        for (let wordIndex = 0; wordIndex < words.length; wordIndex += WORDS_PER_LINE) {
          lines.push({
            text: words.slice(wordIndex, wordIndex + WORDS_PER_LINE).join(' '),
          })
        }
      }
    }
  }

  return lines
}

export function canGenerateWallpaper(text: string): boolean {
  const cleaned = cleanPassageText(text)
  if (cleaned.length > WALLPAPER_MAX_CHARACTERS) return false
  return formatVerseLines(cleaned).length <= WALLPAPER_MAX_LINES
}
