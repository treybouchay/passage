import { FavoriteButton } from './FavoriteButton'
import { resolveFavorites, type SavedPrayer } from '../lib/userContent'

interface FavoritesSectionProps {
  favoriteIds: string[]
  prayers: SavedPrayer[]
  onToggleFavorite: (id: string) => void
}

export function FavoritesSection({
  favoriteIds,
  prayers,
  onToggleFavorite,
}: FavoritesSectionProps) {
  const items = resolveFavorites(favoriteIds, prayers)
  const favoritePassages = items.filter((item) => item.kind === 'passage')
  const favoritePrayers = items.filter((item) => item.kind === 'prayer')
  const isEmpty = items.length === 0

  return (
    <section className="favorites-section" aria-labelledby="favorites-heading">
      <h2 id="favorites-heading" className="section-title">
        favorites
      </h2>
      <p className="section-lead">
        Passages and prayers you have marked with the halo.
      </p>

      {isEmpty ? (
        <p className="favorites-empty">
          Nothing saved yet. Tap the halo on a passage or prayer to add it here.
        </p>
      ) : (
        <div className="favorites-groups">
          <section className="favorites-group" aria-labelledby="favorites-passages-heading">
            <h3 id="favorites-passages-heading" className="favorites-group-title">
              passages
            </h3>
            {favoritePassages.length === 0 ? (
              <p className="favorites-group-empty">No favorite passages yet.</p>
            ) : (
              <div className="passage-list">
                {favoritePassages.map(({ passage }) => (
                  <article key={passage.id} className="passage-card">
                    <div className="passage-card-header">
                      <cite className="passage-ref">{passage.reference}</cite>
                      <FavoriteButton
                        active
                        onToggle={() => onToggleFavorite(passage.id)}
                        label="Remove from favorites"
                      />
                    </div>
                    <blockquote className="passage-text">{passage.text}</blockquote>
                    <p className="passage-reflection">{passage.reflection}</p>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section className="favorites-group" aria-labelledby="favorites-prayers-heading">
            <h3 id="favorites-prayers-heading" className="favorites-group-title">
              your prayers
            </h3>
            {favoritePrayers.length === 0 ? (
              <p className="favorites-group-empty">No favorite prayers yet.</p>
            ) : (
              <div className="passage-list">
                {favoritePrayers.map(({ prayer }) => (
                  <article key={prayer.id} className="passage-card passage-card--prayer">
                    <div className="passage-card-header">
                      <span className="passage-ref">my prayer</span>
                      <FavoriteButton
                        active
                        onToggle={() => onToggleFavorite(prayer.id)}
                        label="Remove prayer from favorites"
                      />
                    </div>
                    <p className="passage-text passage-text--prayer">{prayer.text}</p>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </section>
  )
}
