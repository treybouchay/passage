import { PrayerShareCard } from './PrayerShareCard'
import type { SavedPrayer } from '../lib/userContent'

interface SavedPrayerCardsProps {
  cards: SavedPrayer[]
  onViewCard: (prayer: SavedPrayer) => void
}

export function SavedPrayerCards({ cards, onViewCard }: SavedPrayerCardsProps) {
  if (cards.length === 0) {
    return (
      <p className="favorites-group-empty">
        No saved cards yet. Open a prayer and tap save card to add one here.
      </p>
    )
  }

  return (
    <ul className="saved-card-grid">
      {cards.map((prayer) => (
        <li key={prayer.id}>
          <button
            type="button"
            className="saved-card-thumb"
            onClick={() => onViewCard(prayer)}
          >
            <PrayerShareCard prayer={prayer} compact />
          </button>
        </li>
      ))}
    </ul>
  )
}
