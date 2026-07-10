import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { Passage } from '../data/passages'
import { fetchBibleTranslation, type BibleTranslation } from './bibleTranslations'

interface BibleTranslationContextValue {
  translation: BibleTranslation
  setTranslation: (translation: BibleTranslation) => void
  getDisplayText: (passage: Passage) => Promise<string>
}

const BibleTranslationContext = createContext<BibleTranslationContextValue | null>(null)

export function BibleTranslationProvider({ children }: { children: ReactNode }) {
  const [translation, setTranslation] = useState<BibleTranslation>('niv')
  const cacheRef = useRef(new Map<string, string>())

  const getDisplayText = useCallback(
    async (passage: Passage) => {
      if (translation === 'niv') {
        return passage.text
      }

      const cacheKey = `${passage.id}:${translation}`
      const cached = cacheRef.current.get(cacheKey)
      if (cached) {
        return cached
      }

      const text = await fetchBibleTranslation(passage.reference, translation)
      cacheRef.current.set(cacheKey, text)
      return text
    },
    [translation],
  )

  const value = useMemo(
    () => ({ translation, setTranslation, getDisplayText }),
    [translation, getDisplayText],
  )

  return (
    <BibleTranslationContext.Provider value={value}>
      {children}
    </BibleTranslationContext.Provider>
  )
}

export function useBibleTranslation(): BibleTranslationContextValue {
  const context = useContext(BibleTranslationContext)
  if (!context) {
    throw new Error('useBibleTranslation must be used within BibleTranslationProvider')
  }
  return context
}
