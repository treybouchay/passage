import { toPng } from 'html-to-image'

export async function renderWallpaperPng(
  element: HTMLElement,
  backgroundColor: string,
): Promise<Blob> {
  await document.fonts.ready

  // Wait for layout after remounts (spacing / line edits change the export key).
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
  })

  const width = element.offsetWidth || element.clientWidth
  const height = element.offsetHeight || element.clientHeight

  const dataUrl = await toPng(element, {
    width,
    height,
    canvasWidth: width,
    canvasHeight: height,
    pixelRatio: 1,
    cacheBust: true,
    backgroundColor,
    // Do not pass includeStyleProperties — limiting it strips typography
    // (letter-spacing, text-transform, font-size) and yields plain unformatted text.
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
