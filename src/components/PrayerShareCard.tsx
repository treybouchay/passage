import { forwardRef } from 'react'
import { formatPrayerDate, type SavedPrayer } from '../lib/userContent'

interface PrayerShareCardProps {
  prayer: SavedPrayer
  compact?: boolean
}

export const PrayerShareCard = forwardRef<HTMLDivElement, PrayerShareCardProps>(
  function PrayerShareCard({ prayer, compact = false }, ref) {
    return (
      <div
        ref={ref}
        className={`prayer-share-card${compact ? ' prayer-share-card--compact' : ''}`}
      >
        <div className="prayer-share-card-brand">
          <img
            src="/icons/logo-hands-figma.svg"
            alt=""
            className="prayer-share-card-logo"
            width={16}
            height={28}
            draggable={false}
          />
          <span className="prayer-share-card-wordmark">passage</span>
        </div>
        <p className="prayer-share-card-text">{prayer.text}</p>
        {prayer.passageReference ? (
          <cite className="prayer-share-card-ref">{prayer.passageReference}</cite>
        ) : null}
        <time
          className="prayer-share-card-date"
          dateTime={new Date(prayer.createdAt).toISOString()}
        >
          {formatPrayerDate(prayer.createdAt)}
        </time>
        {prayer.themes.length > 0 ? (
          <ul className="prayer-share-card-themes" aria-label="Themes">
            {prayer.themes.map((theme) => (
              <li key={theme}>
                <span className="passage-theme-tag">{theme}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    )
  },
)
