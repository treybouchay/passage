import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import type { Passage } from '../data/passages'
import { BibleTranslationProvider } from '../lib/bibleTranslationContext'
import { getPassageById } from '../lib/userContent'
import { PassageText } from './PassageText'
import { PassageTranslationBar } from './PassageTranslationBar'

interface PassagePreviewModalProps {
  passageId?: string
  passageReference?: string
  onClose: () => void
}

export function PassagePreviewModal({
  passageId,
  passageReference,
  onClose,
}: PassagePreviewModalProps) {
  const passage: Passage | undefined = passageId
    ? getPassageById(passageId)
    : undefined

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [onClose])

  const reference = passage?.reference ?? passageReference
  if (!reference) return null

  return createPortal(
    <div className="passage-preview-modal" role="presentation" onClick={onClose}>
      <div
        className="passage-preview-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="passage-preview-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="passage-preview-header">
          <span id="passage-preview-title" className="sr-only">
            {reference}
          </span>
          <button
            type="button"
            className="wallpaper-modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {passage ? (
          <BibleTranslationProvider>
            <PassageTranslationBar className="passage-translation-bar passage-translation-bar--preview" />
            <article className="passage-card passage-card--preview">
              <PassageText passage={passage} />
              <p className="passage-reflection">{passage.reflection}</p>
              <cite className="passage-ref passage-ref--footer">{passage.reference}</cite>
              {passage.themes.length > 0 ? (
                <ul className="passage-themes" aria-label="Themes">
                  {passage.themes.map((theme) => (
                    <li key={theme}>
                      <span className="passage-theme-tag">{theme}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </article>
          </BibleTranslationProvider>
        ) : (
          <p className="passage-preview-missing">passage text unavailable</p>
        )}
      </div>
    </div>,
    document.body,
  )
}

interface PrayerPassageLinkProps {
  passageId?: string
  passageReference: string
  onOpen: () => void
}

export function PrayerPassageLink({
  passageReference,
  onOpen,
}: PrayerPassageLinkProps) {
  return (
    <button
      type="button"
      className="prayer-linked-ref prayer-linked-ref--btn"
      onClick={onOpen}
    >
      {passageReference}
    </button>
  )
}
