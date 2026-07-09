export const PRINT_SIZES = {
  '8x10': { width: 1200, height: 1500, label: '8×10″' },
  '11x14': { width: 1100, height: 1400, label: '11×14″' },
} as const

export type PrintSize = keyof typeof PRINT_SIZES

export const FRAME_STYLES = {
  black: { label: 'black', surface: '#1c1c1c', highlight: '#3a3a3a', shadow: '#0a0a0a' },
  white: { label: 'white', surface: '#f3f2ee', highlight: '#ffffff', shadow: '#d8d6d0' },
  oak: { label: 'oak', surface: '#a67c52', highlight: '#c49a6c', shadow: '#6b4c30' },
} as const

export type FrameStyle = keyof typeof FRAME_STYLES

/** Preview width for the art area inside mat + frame (px). */
export const FRAMED_PREVIEW_ART_WIDTH = 200

export function getFramedPreviewScale(printSize: PrintSize): number {
  const { width } = PRINT_SIZES[printSize]
  return FRAMED_PREVIEW_ART_WIDTH / width
}
