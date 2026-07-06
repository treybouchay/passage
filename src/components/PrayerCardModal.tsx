import { useEffect, useRef, useState } from 'react'
import {
  downloadPrayerCard,
  renderPrayerCardPng,
  sharePrayerCard,
} from '../lib/exportPrayerCard'
import { isPrayerCardSaved, markPrayerCardSaved } from '../lib/savedPrayerCards'
import type { SavedPrayer } from '../lib/userContent'
import { PrayerShareCard } from './PrayerShareCard'

interface PrayerCardModalProps {
  prayer: SavedPrayer
  onClose: () => void
  onCardSaved: (prayerId: string) => void
}

export function PrayerCardModal({ prayer, onClose, onCardSaved }: PrayerCardModalProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [cardSaved, setCardSaved] = useState(() => isPrayerCardSaved(prayer.id))
  const [cardBlob, setCardBlob] = useState<Blob | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isSharing, setIsSharing] = useState(false)
  const [status, setStatus] = useState<string | null>(null)

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  async function captureCard(): Promise<Blob | null> {
    if (!cardRef.current) return null
    const blob = await renderPrayerCardPng(cardRef.current)
    setCardBlob(blob)
    return blob
  }

  async function handleSaveCard() {
    setIsSaving(true)
    setStatus(null)
    try {
      const blob = cardBlob ?? (await captureCard())
      if (!blob) return
      downloadPrayerCard(blob, prayer.id)
      markPrayerCardSaved(prayer.id)
      setCardSaved(true)
      onCardSaved(prayer.id)
      setStatus('card saved to your device')
    } catch {
      setStatus('could not save card — try again')
    } finally {
      setIsSaving(false)
    }
  }

  async function handleShare() {
    if (!cardSaved) return
    setIsSharing(true)
    setStatus(null)
    try {
      const blob = cardBlob ?? (await captureCard())
      if (!blob) return
      const result = await sharePrayerCard(blob, prayer)
      if (result === 'shared') {
        setStatus('shared')
      } else if (result === 'copied') {
        setStatus('prayer copied — paste to share')
      } else {
        setStatus('sharing is not available on this device')
      }
    } catch {
      setStatus('could not share — try again')
    } finally {
      setIsSharing(false)
    }
  }

  return (
    <div className="prayer-card-modal" role="presentation" onClick={onClose}>
      <div
        className="prayer-card-modal-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="prayer-card-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="prayer-card-modal-header">
          <h3 id="prayer-card-modal-title" className="prayer-card-modal-title">
            prayer card
          </h3>
          <button
            type="button"
            className="prayer-card-modal-close"
            onClick={onClose}
            aria-label="Close prayer card"
          >
            ×
          </button>
        </div>

        <p className="prayer-card-modal-lead">
          {cardSaved
            ? 'Your card is saved here. View it, download again, or share when you are ready.'
            : 'Save the card for yourself first, then share when you are ready.'}
        </p>

        <PrayerShareCard ref={cardRef} prayer={prayer} />

        <div className="prayer-card-modal-actions">
          <button
            type="button"
            className="prayer-save-btn"
            onClick={handleSaveCard}
            disabled={isSaving || isSharing}
          >
            {isSaving ? 'saving…' : cardSaved ? 'save again' : 'save card'}
          </button>
          <button
            type="button"
            className="prayer-secondary-btn prayer-card-modal-share"
            onClick={handleShare}
            disabled={!cardSaved || isSaving || isSharing}
            title={cardSaved ? undefined : 'Save your card first'}
          >
            {isSharing ? 'sharing…' : 'share'}
          </button>
        </div>

        {status ? <p className="prayer-card-modal-status">{status}</p> : null}
      </div>
    </div>
  )
}
