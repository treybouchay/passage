export type BibleTranslation = 'niv' | 'kjv' | 'asv'

export const BIBLE_TRANSLATIONS: Record<
  BibleTranslation,
  { label: string; title: string; apiCode: string | null }
> = {
  niv: { label: 'NIV', title: 'New International Version', apiCode: null },
  kjv: { label: 'KJV', title: 'King James Version', apiCode: 'kjv' },
  asv: { label: 'ASV', title: 'American Standard Version', apiCode: 'asv' },
}

export const BIBLE_TRANSLATION_ORDER: BibleTranslation[] = ['niv', 'kjv', 'asv']

export function referenceForBibleApi(reference: string): string {
  return reference.replace(/\u2013|\u2014/g, '-').trim()
}

function normalizeApiText(text: string): string {
  return text
    .replace(/\s*\n\s*/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

export async function fetchBibleTranslation(
  reference: string,
  translation: BibleTranslation,
): Promise<string> {
  const { apiCode } = BIBLE_TRANSLATIONS[translation]
  if (!apiCode) {
    throw new Error('Translation is bundled locally')
  }

  const query = encodeURIComponent(referenceForBibleApi(reference))
  const response = await fetch(`https://bible-api.com/${query}?translation=${apiCode}`)

  if (!response.ok) {
    throw new Error(`Translation request failed (${response.status})`)
  }

  const data: { text?: string } = await response.json()
  if (!data.text?.trim()) {
    throw new Error('Translation response was empty')
  }

  return normalizeApiText(data.text)
}
