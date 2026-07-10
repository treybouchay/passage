import { FavoriteButton } from './FavoriteButton'
import { PassageWallpaperTrigger } from './PassageWallpaperModal'
import { PassageText } from './PassageText'
import { canGenerateWallpaper } from '../lib/formatVerseLines'
import type { Passage } from '../data/passages'

interface PassageCardProps {
  passage: Passage
  favoriteActive: boolean
  onToggleFavorite: (id: string) => void
  favoriteLabel?: string
  showThemes?: boolean
  showWallpaper?: boolean
}

export function PassageCard({
  passage,
  favoriteActive,
  onToggleFavorite,
  favoriteLabel,
  showThemes = false,
  showWallpaper = false,
}: PassageCardProps) {
  return (
    <article className="passage-card">
      <div className="passage-card-header passage-card-header--end">
        <FavoriteButton
          active={favoriteActive}
          onToggle={() => onToggleFavorite(passage.id)}
          label={favoriteLabel}
        />
      </div>
      <PassageText passage={passage} />
      <p className="passage-reflection">{passage.reflection}</p>
      <cite className="passage-ref passage-ref--footer">{passage.reference}</cite>
      {showThemes ? (
        <ul className="passage-themes" aria-label="Themes">
          {passage.themes.map((theme) => (
            <li key={theme}>
              <span className="passage-theme-tag">{theme}</span>
            </li>
          ))}
        </ul>
      ) : null}
      {showWallpaper && canGenerateWallpaper(passage.text) ? (
        <div className="passage-card-actions">
          <PassageWallpaperTrigger passage={passage} />
        </div>
      ) : null}
    </article>
  )
}
