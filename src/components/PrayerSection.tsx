import { useMemo, useState } from 'react'
import { allThemes } from '../data/passages'
import { FavoriteButton } from './FavoriteButton'
import {
  deletePrayer,
  formatPrayerDate,
  loadPrayers,
  savePrayer,
  type SavedPrayer,
} from '../lib/userContent'

interface PrayerSectionProps {
  favoriteIds: string[]
  onToggleFavorite: (id: string) => void
  onPrayersChange: (prayers: SavedPrayer[]) => void
}

function toggleTheme(themes: string[], theme: string): string[] {
  return themes.includes(theme)
    ? themes.filter((item) => item !== theme)
    : [...themes, theme]
}

export function PrayerSection({
  favoriteIds,
  onToggleFavorite,
  onPrayersChange,
}: PrayerSectionProps) {
  const [draft, setDraft] = useState('')
  const [selectedThemes, setSelectedThemes] = useState<string[]>([])
  const [prayers, setPrayers] = useState<SavedPrayer[]>(() => loadPrayers())
  const [editingId, setEditingId] = useState<string | null>(null)
  const [themeFilter, setThemeFilter] = useState<string | null>(null)

  const prayerThemes = useMemo(() => {
    const themes = new Set<string>()
    for (const prayer of prayers) {
      for (const theme of prayer.themes) {
        themes.add(theme)
      }
    }
    return [...themes].sort()
  }, [prayers])

  const filteredPrayers = useMemo(() => {
    if (!themeFilter) return prayers
    return prayers.filter((prayer) => prayer.themes.includes(themeFilter))
  }, [prayers, themeFilter])

  function resetForm() {
    setDraft('')
    setSelectedThemes([])
    setEditingId(null)
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!draft.trim()) return
    const next = savePrayer(draft, editingId ?? undefined, selectedThemes)
    setPrayers(next)
    onPrayersChange(next)
    resetForm()
  }

  function handleEdit(prayer: SavedPrayer) {
    setDraft(prayer.text)
    setSelectedThemes(prayer.themes)
    setEditingId(prayer.id)
  }

  function handleDelete(id: string) {
    const next = deletePrayer(id)
    setPrayers(next)
    onPrayersChange(next)
    if (editingId === id) {
      resetForm()
    }
  }

  return (
    <section className="prayer-section" aria-labelledby="prayer-heading">
      <h2 id="prayer-heading" className="section-title">
        {editingId ? 'update prayer' : 'your prayer'}
      </h2>
      {!editingId ? (
        <p className="section-lead">
          Write what is on your heart. Save prayers to return to them—or mark them with the halo to keep them close.
        </p>
      ) : null}

      <form className="prayer-form" onSubmit={handleSave}>
        <label htmlFor="prayer-draft" className="sr-only">
          Write your prayer
        </label>
        <textarea
          id="prayer-draft"
          className="prayer-input"
          placeholder="dear Lord…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={6}
        />

        <div className="prayer-theme-picker">
          <span className="prayer-theme-picker-label">themes</span>
          <div className="prayer-theme-picker-chips" role="group" aria-label="Tag prayer themes">
            {allThemes.map((theme) => (
              <button
                key={theme}
                type="button"
                className={`favorites-filter-chip${selectedThemes.includes(theme) ? ' favorites-filter-chip--active' : ''}`}
                aria-pressed={selectedThemes.includes(theme)}
                onClick={() => setSelectedThemes((themes) => toggleTheme(themes, theme))}
              >
                {theme}
              </button>
            ))}
          </div>
        </div>

        <div className="prayer-form-actions">
          {editingId ? (
            <button type="button" className="prayer-secondary-btn" onClick={resetForm}>
              cancel
            </button>
          ) : null}
          <button type="submit" className="prayer-save-btn" disabled={!draft.trim()}>
            {editingId ? 'update prayer' : 'save prayer'}
          </button>
        </div>
      </form>

      {prayers.length > 0 && !editingId ? (
        <div className="saved-prayers">
          <h3 className="saved-prayers-title">saved prayers</h3>

          {prayerThemes.length > 0 ? (
            <div className="prayer-saved-filters" role="group" aria-label="Filter saved prayers by theme">
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
                {prayerThemes.map((theme) => (
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

          {filteredPrayers.length === 0 ? (
            <p className="favorites-group-empty">No prayers match this theme.</p>
          ) : (
            <ul className="saved-prayer-list">
              {filteredPrayers.map((prayer) => (
                <li key={prayer.id}>
                  <article className="passage-card passage-card--prayer">
                    <div className="passage-card-header">
                      <div className="prayer-card-meta">
                        <span className="passage-ref">my prayer</span>
                        <time
                          className="prayer-date"
                          dateTime={new Date(prayer.createdAt).toISOString()}
                        >
                          {formatPrayerDate(prayer.createdAt)}
                        </time>
                      </div>
                      <FavoriteButton
                        active={favoriteIds.includes(prayer.id)}
                        onToggle={() => onToggleFavorite(prayer.id)}
                        label={
                          favoriteIds.includes(prayer.id)
                            ? 'Remove prayer from favorites'
                            : 'Add prayer to favorites'
                        }
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
                    <div className="prayer-card-actions">
                      <button
                        type="button"
                        className="prayer-text-btn"
                        onClick={() => handleEdit(prayer)}
                      >
                        edit
                      </button>
                      <button
                        type="button"
                        className="prayer-text-btn prayer-text-btn--danger"
                        onClick={() => handleDelete(prayer.id)}
                      >
                        delete
                      </button>
                    </div>
                  </article>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </section>
  )
}
