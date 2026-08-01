import { useMemo, useState } from 'react'
import type { Passage } from '../data/passages'
import { FavoriteButton } from './FavoriteButton'
import { FavoriteSongCard } from './FavoriteSongCard'
import { PassageCard } from './PassageCard'
import { PassagePreviewModal, PrayerPassageLink } from './PassagePreviewModal'
import { PassageTranslationBar } from './PassageTranslationBar'
import {
  formatPrayerDate,
  resolveFavorites,
  resolveFavoriteSongs,
  type SavedPrayer,
} from '../lib/userContent'
import { BibleTranslationProvider } from '../lib/bibleTranslationContext'

type TypeFilter = 'passages' | 'prayers' | 'songs'

const TYPE_TABS: { id: TypeFilter; label: string }[] = [
  { id: 'passages', label: 'passages' },
  { id: 'prayers', label: 'prayers' },
  { id: 'songs', label: 'songs' },
]

interface FavoritesSectionProps {
  favoriteIds: string[]
  favoriteSongIds: string[]
  prayers: SavedPrayer[]
  onToggleFavorite: (id: string) => void
  onToggleFavoriteSong: (id: string) => void
  onPray?: (passage: Passage) => void
}

function initialTypeFilter(
  hasPassages: boolean,
  hasPrayers: boolean,
  hasSongs: boolean,
): TypeFilter {
  if (hasPassages) return 'passages'
  if (hasPrayers) return 'prayers'
  if (hasSongs) return 'songs'
  return 'passages'
}

export function FavoritesSection({
  favoriteIds,
  favoriteSongIds,
  prayers,
  onToggleFavorite,
  onToggleFavoriteSong,
  onPray,
}: FavoritesSectionProps) {
  const items = resolveFavorites(favoriteIds, prayers)
  const favoritePassages = items.filter((item) => item.kind === 'passage')
  const favoritePrayers = items.filter((item) => item.kind === 'prayer')
  const favoriteSongs = resolveFavoriteSongs(favoriteSongIds)

  const [typeFilter, setTypeFilter] = useState<TypeFilter>(() =>
    initialTypeFilter(
      favoritePassages.length > 0,
      favoritePrayers.length > 0,
      favoriteSongs.length > 0,
    ),
  )
  const [themeFilter, setThemeFilter] = useState<string | null>(null)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [previewPrayer, setPreviewPrayer] = useState<SavedPrayer | null>(null)

  const passageThemes = useMemo(() => {
    const themes = new Set<string>()
    for (const item of favoritePassages) {
      for (const theme of item.passage.themes) themes.add(theme)
    }
    return [...themes].sort()
  }, [favoritePassages])

  const prayerThemes = useMemo(() => {
    const themes = new Set<string>()
    for (const item of favoritePrayers) {
      for (const theme of item.prayer.themes) themes.add(theme)
    }
    return [...themes].sort()
  }, [favoritePrayers])

  const songThemes = useMemo(() => {
    const themes = new Set<string>()
    for (const song of favoriteSongs) {
      for (const theme of song.themes) themes.add(theme)
    }
    return [...themes].sort()
  }, [favoriteSongs])

  const themesForType = useMemo(() => {
    if (typeFilter === 'passages') return passageThemes
    if (typeFilter === 'prayers') return prayerThemes
    return songThemes
  }, [typeFilter, passageThemes, prayerThemes, songThemes])

  const filteredPassages = useMemo(() => {
    if (!themeFilter) return favoritePassages
    return favoritePassages.filter((item) => item.passage.themes.includes(themeFilter))
  }, [favoritePassages, themeFilter])

  const filteredPrayers = useMemo(() => {
    if (!themeFilter) return favoritePrayers
    return favoritePrayers.filter((item) => item.prayer.themes.includes(themeFilter))
  }, [favoritePrayers, themeFilter])

  const filteredSongs = useMemo(() => {
    if (!themeFilter) return favoriteSongs
    return favoriteSongs.filter((song) => song.themes.includes(themeFilter))
  }, [favoriteSongs, themeFilter])

  const isEmpty = items.length === 0 && favoriteSongs.length === 0
  const currentEmpty =
    (typeFilter === 'passages' && filteredPassages.length === 0) ||
    (typeFilter === 'prayers' && filteredPrayers.length === 0) ||
    (typeFilter === 'songs' && filteredSongs.length === 0)

  function handleTypeChange(next: TypeFilter) {
    setTypeFilter(next)
    setThemeFilter(null)
  }

  return (
    <section className="favorites-section" aria-labelledby="favorites-heading">
      <h2 id="favorites-heading" className="section-title">
        favorites
      </h2>
      <p className="section-lead">
        Passages, prayers, and songs you have marked with the halo.
      </p>

      {isEmpty ? (
        <p className="favorites-empty">
          Nothing saved yet. Tap the halo on a passage, prayer, or song to add it
          here.
        </p>
      ) : (
        <>
          <div
            className="bible-translation-tabs favorites-type-tabs"
            role="tablist"
            aria-label="Favorite type"
          >
            {TYPE_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                id={`favorites-tab-${tab.id}`}
                aria-selected={typeFilter === tab.id}
                className={`bible-translation-tab${typeFilter === tab.id ? ' bible-translation-tab--active' : ''}`}
                onClick={() => handleTypeChange(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {themesForType.length > 0 ? (
            <div className="favorites-filters">
              <button
                type="button"
                className="favorites-filters-toggle"
                aria-expanded={filtersOpen}
                aria-controls="favorites-filters-panel"
                onClick={() => setFiltersOpen((open) => !open)}
              >
                <span className="favorites-filters-toggle-label">theme filters</span>
                {themeFilter ? (
                  <span className="favorites-filters-active" aria-label="Active filters">
                    <span className="favorites-filter-tag">{themeFilter}</span>
                  </span>
                ) : null}
                <span
                  className={`favorites-filters-chevron${filtersOpen ? ' favorites-filters-chevron--open' : ''}`}
                  aria-hidden
                />
              </button>

              {filtersOpen ? (
                <div id="favorites-filters-panel" className="favorites-filters-panel">
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
                      {themesForType.map((theme) => (
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
                </div>
              ) : null}
            </div>
          ) : null}

          {currentEmpty ? (
            <p className="favorites-empty">
              {themeFilter
                ? `No ${typeFilter} match this theme.`
                : `No favorite ${typeFilter} yet.`}
            </p>
          ) : (
            <div
              className="favorites-groups"
              role="tabpanel"
              aria-labelledby={`favorites-tab-${typeFilter}`}
            >
              {typeFilter === 'passages' ? (
                <BibleTranslationProvider>
                  <PassageTranslationBar className="passage-translation-bar passage-translation-bar--group" />
                  <div className="passage-list">
                    {filteredPassages.map(({ passage }) => (
                      <PassageCard
                        key={passage.id}
                        passage={passage}
                        favoriteActive
                        onToggleFavorite={onToggleFavorite}
                        favoriteLabel="Remove from favorites"
                        showThemes
                        showWallpaper
                        onPray={onPray}
                      />
                    ))}
                  </div>
                </BibleTranslationProvider>
              ) : null}

              {typeFilter === 'prayers' ? (
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
                      {prayer.passageReference ? (
                        <PrayerPassageLink
                          passageId={prayer.passageId}
                          passageReference={prayer.passageReference}
                          onOpen={() => setPreviewPrayer(prayer)}
                        />
                      ) : null}
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
              ) : null}

              {typeFilter === 'songs' ? (
                <div className="favorites-song-cards">
                  {filteredSongs.map((song) => (
                    <FavoriteSongCard
                      key={song.id}
                      song={song}
                      onToggleFavorite={onToggleFavoriteSong}
                    />
                  ))}
                </div>
              ) : null}
            </div>
          )}
        </>
      )}

      {previewPrayer?.passageReference ? (
        <PassagePreviewModal
          passageId={previewPrayer.passageId}
          passageReference={previewPrayer.passageReference}
          onClose={() => setPreviewPrayer(null)}
        />
      ) : null}
    </section>
  )
}
