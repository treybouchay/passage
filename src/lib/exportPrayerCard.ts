import { toPng } from 'html-to-image'
import { formatPrayerDate, type SavedPrayer } from './userContent'

export async function renderPrayerCardPng(element: HTMLElement): Promise<Blob> {
  const dataUrl = await toPng(element, {
    pixelRatio: 2,
    cacheBust: true,
  })
  const response = await fetch(dataUrl)
  return response.blob()
}

export function downloadPrayerCard(blob: Blob, prayerId: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `passage-prayer-${prayerId.replace('prayer-', '')}.png`
  link.click()
  URL.revokeObjectURL(url)
}

export function formatPrayerShareText(prayer: SavedPrayer): string {
  const date = formatPrayerDate(prayer.createdAt)
  const themes =
    prayer.themes.length > 0 ? `\n\n${prayer.themes.join(' · ')}` : ''
  return `${prayer.text}\n\n${date}${themes}\n\n— passage`
}

export async function sharePrayerCard(
  blob: Blob,
  prayer: SavedPrayer,
): Promise<'shared' | 'copied' | 'unsupported'> {
  const text = formatPrayerShareText(prayer)
  const file = new File([blob], 'prayer-card.png', { type: 'image/png' })

  if (navigator.share) {
    const payload = { files: [file], text, title: 'My prayer' }
    if (!navigator.canShare || navigator.canShare(payload)) {
      try {
        await navigator.share(payload)
        return 'shared'
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return 'unsupported'
        }
      }
    }

    try {
      await navigator.share({ text, title: 'My prayer' })
      return 'shared'
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return 'unsupported'
      }
    }
  }

  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    return 'copied'
  }

  return 'unsupported'
}
