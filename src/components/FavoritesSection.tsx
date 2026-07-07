import { useMemo, useState } from 'react'
import { FavoriteButton } from './FavoriteButton'
import { PassageWallpaperTrigger } from './PassageWallpaperModal'
import { canGenerateWallpaper } from '../lib/formatVerseLines'
import { formatPrayerDate, resolveFavorites, type SavedPrayer } from '../lib/userContent'

type TypeFilter = 'all' | 'passages' | 'prayers'

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
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  const [themeFilter, setThemeFilter] = useState<string | null>(null)
  const [filtersOpen, setFiltersOpen] = useState(false)

  const items = resolveFavorites(favoriteIds, prayers)
  const favoritePassages = items.filter((item) => item.kind === 'passage')
  const favoritePrayers = items.filter((item) => item.kind === 'prayer')

  const passageThemes = useMemo(() => {
    const themes = new Set<string>()
    for (const item of favoritePassages) {
      for (const theme of item.passage.themes) {
        themes.add(theme)
      }
    }
    return [...themes].sort()
  }, [favoritePassages])

  const prayerThemes = useMemo(() => {
    const themes = new Set<string>()
    for (const item of favoritePrayers) {
      for (const theme of item.prayer.themes) {
        themes.add(theme)
      }
    }
    return [...themes].sort()
  }, [favoritePrayers])

  // Theme chips are limited to themes on favorited passages/prayers only — not the full library.
  const availableThemes = useMemo(() => {
    const themes = new Set([...passageThemes, ...prayerThemes])
    return [...themes].sort()
  }, [passageThemes, prayerThemes])

  const filteredPassages = useMemo(() => {
    if (!themeFilter) return favoritePassages
    return favoritePassages.filter((item) => item.passage.themes.includes(themeFilter))
  }, [favoritePassages, themeFilter])

  const filteredPrayers = useMemo(() => {
    if (!themeFilter) return favoritePrayers
    return favoritePrayers.filter((item) => item.prayer.themes.includes(themeFilter))
  }, [favoritePrayers, themeFilter])

  const showPassages = typeFilter === 'all' || typeFilter === 'passages'
  const showPrayers = typeFilter === 'all' || typeFilter === 'prayers'
  const isEmpty = items.length === 0
  const passagesEmpty = showPassages && filteredPassages.length === 0
  const prayersEmpty = showPrayers && filteredPrayers.length === 0
  const nothingMatchesFilter =
    !isEmpty && passagesEmpty && prayersEmpty

  const hasActiveFilters = typeFilter !== 'all' || themeFilter !== null
  const showThemeInTags = availableThemes.length > 0

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
        <>
          <div className="favorites-filters">
            <button
              type="button"
              className="favorites-filters-toggle"
              aria-expanded={filtersOpen}
              aria-controls="favorites-filters-panel"
              onClick={() => setFiltersOpen((open) => !open)}
            >
              <span className="favorites-filters-toggle-label">filters</span>
              {hasActiveFilters ? (
                <span className="favorites-filters-active" aria-label="Active filters">
                  <span className="favorites-filter-tag">{typeFilter}</span>
                  {showThemeInTags && themeFilter ? (
                    <span className="favorites-filter-tag">{themeFilter}</span>
                  ) : null}
                </span>
              ) : null}
              <span
                className={`favorites-filters-chevron${filtersOpen ? ' favorites-filters-chevron--open' : ''}`}
                aria-hidden
              />
            </button>

            {filtersOpen ? (
              <div id="favorites-filters-panel" className="favorites-filters-panel">
                <div className="favorites-filter-group" role="group" aria-label="Filter by type">
                  <span className="favorites-filter-label">type</span>
                  <div className="favorites-filter-chips">
                    {(['all', 'passages', 'prayers'] as const).map((filter) => (
                      <button
                        key={filter}
                        type="button"
                        className={`favorites-filter-chip${typeFilter === filter ? ' favorites-filter-chip--active' : ''}`}
                        aria-pressed={typeFilter === filter}
                        onClick={() => setTypeFilter(filter)}
                      >
                        {filter}
                      </button>
                    ))}
                  </div>
                </div>

                {availableThemes.length > 0 ? (
                  <div className="favorites-filter-group" role="group" aria-label="Filter by theme">
                    <span className="favorites-filter-label">theme</span>
                    <div className="favorites-filter-chips">
                      <button
                        type="button"
                        className={`favorites-filter-chip${themeFilter === null ? ' favorites-filter-chip--active' : ''}`}
                        aria-pressed={themeFilter === null}
                        onClick={() => setThemeFilter(null)}
                      >
                        all
                      </button>
                      {availableThemes.map((theme) => (
                        <button
                          key={theme}
                          type="button"
                          className={`favorites-filter-chip${themeFilter === theme ? ' favorites-filter-chip--active' : ''}`}
                          aria-pressed={themeFilter === theme}
                          onClick={() => setThemeFilter(theme)}
                        >
                          {theme}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>

          {nothingMatchesFilter ? (
            <p className="favorites-empty">No favorites match these filters.</p>
          ) : (
            <div className="favorites-groups">
              {showPassages ? (
                <section className="favorites-group" aria-labelledby="favorites-passages-heading">
                  <h3 id="favorites-passages-heading" className="favorites-group-title">
                    passages
                  </h3>
                  {filteredPassages.length === 0 ? (
                    <p className="favorites-group-empty">No favorite passages yet.</p>
                  ) : (
                    <div className="passage-list">
                      {filteredPassages.map(({ passage }) => (
                        <article key={passage.id} className="passage-card">
                          <div className="passage-card-header passage-card-header--end">
                            <FavoriteButton
                              active
                              onToggle={() => onToggleFavorite(passage.id)}
                              label="Remove from favorites"
                            />
                          </div>
                          <blockquote className="passage-text">{passage.text}</blockquote>
                          <p className="passage-reflection">{passage.reflection}</p>
                          <cite className="passage-ref passage-ref--footer">{passage.reference}</cite>
                          <ul className="passage-themes" aria-label="Themes">
                            {passage.themes.map((theme) => (
                              <li key={theme}>
                                <span className="passage-theme-tag">{theme}</span>
                              </li>
                            ))}
                          </ul>
                          {canGenerateWallpaper(passage.text) ? (
                            <div className="passage-card-actions">
                              <PassageWallpaperTrigger passage={passage} />
                            </div>
                          ) : null}
                        </article>
                      ))}
                    </div>
                  )}
                </section>
              ) : null}

              {showPrayers ? (
                <section className="favorites-group" aria-labelledby="favorites-prayers-heading">
                  <h3 id="favorites-prayers-heading" className="favorites-group-title">
                    your prayers
                  </h3>
                  {filteredPrayers.length === 0 ? (
                    <p className="favorites-group-empty">No favorite prayers yet.</p>
                  ) : (
                    <div className="passage-list">
                      {filteredPrayers.map(({ prayer }) => (
                        <article key={prayer.id} className="passage-card passage-card--prayer">
                          <div className="passage-card-header">
                            <time
                              className="prayer-date"
                              dateTime={new Date(prayer.createdAt).toISOString()}
                            >
                              {formatPrayerDate(prayer.createdAt)}
                            </time>
                            <FavoriteButton
                              active
                              onToggle={() => onToggleFavorite(prayer.id)}
                              label="Remove prayer from favorites"
                            />
                          </div>
                          <p className="passage-text passage-text--prayer">{prayer.text}</p>
                          {prayer.themes.length > 0 ? (
                            <ul className="passage-themes" aria-label="Themes">
                              {prayer.themes.map((theme) => (
                                <li key={theme}>
                                  <span className="passage-theme-tag">{theme}</span>
                                </li>
                              ))}
                            </ul>
                          ) : null}
                        </article>
                      ))}
                    </div>
                  )}
                </section>
              ) : null}
            </div>
          )}
        </>
      )}
    </section>
  )
}
