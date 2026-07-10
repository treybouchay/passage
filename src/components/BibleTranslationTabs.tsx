import {
  BIBLE_TRANSLATION_ORDER,
  BIBLE_TRANSLATIONS,
  type BibleTranslation,
} from '../lib/bibleTranslations'

interface BibleTranslationTabsProps {
  translation: BibleTranslation
  onChange: (translation: BibleTranslation) => void
  disabled?: boolean
  className?: string
  ariaLabel?: string
}

export function BibleTranslationTabs({
  translation,
  onChange,
  disabled = false,
  className = '',
  ariaLabel = 'Bible translation',
}: BibleTranslationTabsProps) {
  return (
    <div
      className={`bible-translation-tabs${className ? ` ${className}` : ''}`}
      role="tablist"
      aria-label={ariaLabel}
    >
      {BIBLE_TRANSLATION_ORDER.map((key) => (
        <button
          key={key}
          type="button"
          role="tab"
          aria-selected={translation === key}
          className={`bible-translation-tab${translation === key ? ' bible-translation-tab--active' : ''}`}
          onClick={() => onChange(key)}
          disabled={disabled}
          title={BIBLE_TRANSLATIONS[key].title}
        >
          {BIBLE_TRANSLATIONS[key].label}
        </button>
      ))}
    </div>
  )
}
