interface ShareableSong {
  title: string
  artists: string
  spotifyUrl: string
}

export function formatSongShareText(song: ShareableSong): string {
  return `${song.title} — ${song.artists}\n${song.spotifyUrl}`
}

export async function shareSong(
  song: ShareableSong,
): Promise<'shared' | 'copied' | 'aborted' | 'unsupported'> {
  const text = formatSongShareText(song)
  const title = `${song.title} — ${song.artists}`

  if (navigator.share) {
    try {
      await navigator.share({ title, text, url: song.spotifyUrl })
      return 'shared'
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return 'aborted'
      }
    }
  }

  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(song.spotifyUrl)
    return 'copied'
  }

  return 'unsupported'
}
