export interface PassageColorScheme {
  background: string
  text: string
  accent: string
  reference: string
}

export type WallpaperColorStyle = 'passage' | 'mono'

export const WALLPAPER_COLOR_SCHEMES: Record<WallpaperColorStyle, PassageColorScheme> = {
  passage: {
    background: '#F5F0E6',
    text: '#2E4036',
    accent: '#396D54',
    reference: '#396D54',
  },
  mono: {
    background: '#F5F0E6',
    text: '#000000',
    accent: '#000000',
    reference: '#000000',
  },
}

export function getPassageColorScheme(style: WallpaperColorStyle = 'passage'): PassageColorScheme {
  return WALLPAPER_COLOR_SCHEMES[style]
}
