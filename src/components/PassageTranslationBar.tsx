import { BibleTranslationTabs } from './BibleTranslationTabs'
import { useBibleTranslation } from '../lib/bibleTranslationContext'

interface PassageTranslationBarProps {
  className?: string
}

export function PassageTranslationBar({ className }: PassageTranslationBarProps) {
  const { translation, setTranslation } = useBibleTranslation()

  return (
    <BibleTranslationTabs
      translation={translation}
      onChange={setTranslation}
      className={className}
    />
  )
}
