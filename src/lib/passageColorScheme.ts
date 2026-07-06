export interface PassageColorScheme {
  background: string
  text: string
  accent: string
  reference: string
}

export const PASSAGE_WALLPAPER_SCHEME: PassageColorScheme = {
  background: '#F5F0E6',
  text: '#2E4036',
  accent: '#396D54',
  reference: '#396D54',
}

export function getPassageColorScheme(_index = 0): PassageColorScheme {
  return PASSAGE_WALLPAPER_SCHEME
}
