import { useMemo, useState } from 'react'
import {
  playlistSongs,
  songsByGenre,
  SONG_THEME_ORDER,
  type SongGenre,
} from '../data/songs'
import { SongLink } from './SongLink'

function genreHeadingId(genre: string): string {
  return `music-genre-${genre.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
}

interface MusicSectionProps {
  favoriteSongIds?: string[]
  onToggleFavoriteSong?: (id: string) => void
}

export function MusicSection({
  favoriteSongIds = [],
  onToggleFavoriteSong,
}: MusicSectionProps) {
  const [genreFilter, setGenreFilter] = useState<SongGenre | null>(null)
  const [themeFilter, setThemeFilter] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)

  const genreGroups = useMemo(() => songsByGenre(playlistSongs), [])

  const availableThemes = useMemo(() => {
    const used = new Set<string>()
    for (const song of playlistSongs) {
      for (const theme of song.themes) {
        used.add(theme)
      }
    }
    return SONG_THEME_ORDER.filter((theme) => used.has(theme))
  }, [])

  const filteredSongs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return playlistSongs.filter((song) => {
      // Empty themes still match when theme filter is "all" (null)
      if (themeFilter !== null && !song.themes.includes(themeFilter)) {
        return false
      }
      if (q) {
        const inTitle = song.title.toLowerCase().includes(q)
        const inArtist = song.artists.toLowerCase().includes(q)
        if (!inTitle && !inArtist) return false
      }
      return true
    })
  }, [themeFilter, searchQuery])

  const groups = songsByGenre(filteredSongs)
  const visibleGroups =
    genreFilter === null
      ? groups
      : groups.filter(({ genre }) => genre === genreFilter)

  const hasActiveFilters = genreFilter !== null || themeFilter !== null
  const showThemeInTags = availableThemes.length > 0
  const showFilters = genreGroups.length > 0 || availableThemes.length > 0

  return (
    <section className="music-section" aria-labelledby="music-heading">
      <h2 id="music-heading" className="section-title">
        music
      </h2>
      <p className="section-lead">
        Curated songs, grouped by genre.
      </p>

      <div className="music-search">
        <label className="favorites-filter-label" htmlFor="music-search">
          search
        </label>
        <div className="music-search-wrap">
          <input
            id="music-search"
            type="search"
            className="music-search-input"
            placeholder="title or artist"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoComplete="off"
            spellCheck={false}
          />
          <span className="music-search-bar" aria-hidden="true" />
        </div>
      </div>

      {showFilters ? (
        <div className="favorites-filters">
          <button
            type="button"
            className="favorites-filters-toggle"
            aria-expanded={filtersOpen}
            aria-controls="music-filters-panel"
            onClick={() => setFiltersOpen((open) => !open)}
          >
            <span className="favorites-filters-toggle-label">filters</span>
            {hasActiveFilters ? (
              <span className="favorites-filters-active" aria-label="Active filters">
                <span className="favorites-filter-tag">{genreFilter ?? 'all'}</span>
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
            <div id="music-filters-panel" className="favorites-filters-panel">
              {genreGroups.length > 0 ? (
                <div className="favorites-filter-group" role="group" aria-label="Filter by genre">
                  <span className="favorites-filter-label">genre</span>
                  <div className="favorites-filter-chips">
                    <button
                      type="button"
                      className={`favorites-filter-chip${genreFilter === null ? ' favorites-filter-chip--active' : ''}`}
                      aria-pressed={genreFilter === null}
                      onClick={() => setGenreFilter(null)}
                    >
                      all
                    </button>
                    {genreGroups.map(({ genre }) => (
                      <button
                        key={genre}
                        type="button"
                        className={`favorites-filter-chip${genreFilter === genre ? ' favorites-filter-chip--active' : ''}`}
                        aria-pressed={genreFilter === genre}
                        onClick={() => setGenreFilter(genre)}
                      >
                        {genre}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

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
      ) : null}

      {visibleGroups.length === 0 ? (
        <p className="favorites-group-empty">No songs match these filters.</p>
      ) : (
        <div className="music-groups">
          {visibleGroups.map(({ genre, songs }) => {
            const headingId = genreHeadingId(genre)
            return (
              <section
                key={genre}
                className="music-group"
                aria-labelledby={headingId}
              >
                <h3 id={headingId} className="music-group-title">
                  {genre}
                </h3>
                <ul className="music-song-list">
                  {songs.map((song) => (
                    <li key={song.id}>
                      <SongLink
                        song={song}
                        favoriteActive={favoriteSongIds.includes(song.id)}
                        onToggleFavorite={onToggleFavoriteSong}
                      />
                    </li>
                  ))}
                </ul>
              </section>
            )
          })}
        </div>
      )}
    </section>
  )
}
