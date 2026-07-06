import { toPng } from 'html-to-image'

export async function renderWallpaperPng(
  element: HTMLElement,
  backgroundColor: string,
): Promise<Blob> {
  await document.fonts.ready
  const dataUrl = await toPng(element, {
    pixelRatio: 1,
    cacheBust: true,
    backgroundColor,
  })
  const response = await fetch(dataUrl)
  return response.blob()
}

export function downloadWallpaper(
  blob: Blob,
  passageId: string,
  variant: 'mobile' | 'desktop',
): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `passage-${passageId}-${variant}.png`
  link.click()
  URL.revokeObjectURL(url)
}
