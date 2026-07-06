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
  colorStyle: 'passage' | 'mono' = 'passage',
): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  const colorSuffix = colorStyle === 'mono' ? '-black' : ''
  link.download = `passage-${passageId}-${variant}${colorSuffix}.png`
  link.click()
  URL.revokeObjectURL(url)
}
