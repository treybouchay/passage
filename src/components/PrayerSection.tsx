import { useEffect, useMemo, useState } from 'react'
import { allThemes, type Passage } from '../data/passages'
import { FavoriteButton } from './FavoriteButton'
import { PassagePreviewModal, PrayerPassageLink } from './PassagePreviewModal'
import { PrayerCardModal } from './PrayerCardModal'
import { SavedPrayerCards } from './SavedPrayerCards'
import { loadSavedPrayerCardIds, removeSavedPrayerCard } from '../lib/savedPrayerCards'
import {
  deletePrayer,
  formatPrayerDate,
  getPassageById,
  loadPrayers,
  savePrayer,
  type SavedPrayer,
} from '../lib/userContent'

interface PrayerSectionProps {
  favoriteIds: string[]
  onToggleFavorite: (id: string) => void
  onPrayersChange: (prayers: SavedPrayer[]) => void
  seedPassage?: Passage | null
  onSeedConsumed?: () => void
}

function toggleTheme(themes: string[], theme: string): string[] {
  return themes.includes(theme)
    ? themes.filter((item) => item !== theme)
    : [...themes, theme]
}

type LibraryTab = 'prayers' | 'cards'

export function PrayerSection({
  favoriteIds,
  onToggleFavorite,
  onPrayersChange,
  seedPassage = null,
  onSeedConsumed,
}: PrayerSectionProps) {
  const [draft, setDraft] = useState('')
  const [selectedThemes, setSelectedThemes] = useState<string[]>([])
  const [linkedPassage, setLinkedPassage] = useState<Passage | null>(null)
  const [prayers, setPrayers] = useState<SavedPrayer[]>(() => loadPrayers())
  const [editingId, setEditingId] = useState<string | null>(null)
  const [themeFilter, setThemeFilter] = useState<string | null>(null)
  const [themesOpen, setThemesOpen] = useState(false)
  const [cardPrayer, setCardPrayer] = useState<SavedPrayer | null>(null)
  const [previewPrayer, setPreviewPrayer] = useState<SavedPrayer | null>(null)
  const [previewLinkedPassage, setPreviewLinkedPassage] = useState(false)
  const [savedCardIds, setSavedCardIds] = useState<string[]>(() => loadSavedPrayerCardIds())
  const [libraryTab, setLibraryTab] = useState<LibraryTab>('prayers')

  useEffect(() => {
    if (!seedPassage) return
    setLinkedPassage(seedPassage)
    setSelectedThemes(seedPassage.themes.slice(0, 2))
    setEditingId(null)
    setDraft('')
    onSeedConsumed?.()
  }, [seedPassage, onSeedConsumed])

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

  const savedCards = useMemo(() => {
    const idSet = new Set(savedCardIds)
    return prayers.filter((prayer) => idSet.has(prayer.id))
  }, [prayers, savedCardIds])

  function resetForm() {
    setDraft('')
    setSelectedThemes([])
    setLinkedPassage(null)
    setEditingId(null)
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!draft.trim()) return
    const next = savePrayer(draft, {
      id: editingId ?? undefined,
      themes: selectedThemes,
      passageId: linkedPassage?.id,
      passageReference: linkedPassage?.reference,
    })
    setPrayers(next)
    onPrayersChange(next)
    resetForm()
  }

  function handleEdit(prayer: SavedPrayer) {
    setDraft(prayer.text)
    setSelectedThemes(prayer.themes)
    setEditingId(prayer.id)
    const fromId = prayer.passageId ? getPassageById(prayer.passageId) : undefined
    setLinkedPassage(
      fromId ??
        (prayer.passageReference
          ? {
              id: prayer.passageId ?? '',
              reference: prayer.passageReference,
              text: '',
              reflection: '',
              themes: prayer.themes,
              keywords: [],
            }
          : null),
    )
  }

  function handleDelete(id: string) {
    const next = deletePrayer(id)
    setPrayers(next)
    onPrayersChange(next)
    setSavedCardIds(removeSavedPrayerCard(id))
    if (editingId === id) {
      resetForm()
    }
    if (cardPrayer?.id === id) {
      setCardPrayer(null)
    }
  }

  return (
    <section className="prayer-section" aria-labelledby="prayer-heading">
      <h2 id="prayer-heading" className="section-title">
        {editingId ? 'update prayer' : linkedPassage ? 'pray with this passage' : 'your prayer'}
      </h2>
      {!editingId ? (
        <p className="section-lead">
          {linkedPassage
            ? 'Write a prayer shaped by this scripture. It will be saved with the passage.'
            : 'Write what is on your heart. Save prayers to return to them—or mark them with the halo to keep them close.'}
        </p>
      ) : null}

      <form className="prayer-form" onSubmit={handleSave}>
        {linkedPassage ? (
          <div className="prayer-passage-link" role="group" aria-label="Linked passage">
            <span className="passage-theme-tag passage-theme-tag--removable">
              <button
                type="button"
                className="passage-theme-tag-label"
                onClick={() => setPreviewLinkedPassage(true)}
                aria-label={`Preview ${linkedPassage.reference}`}
              >
                {linkedPassage.reference}
              </button>
              <button
                type="button"
                className="passage-theme-tag-x"
                onClick={() => setLinkedPassage(null)}
                aria-label={`Remove ${linkedPassage.reference}`}
              >
                ×
              </button>
            </span>
          </div>
        ) : null}
        <label htmlFor="prayer-draft" className="sr-only">
          Write your prayer
        </label>
        <textarea
          id="prayer-draft"
          className="prayer-input"
          placeholder={
            linkedPassage
              ? `dear Lord, as I hold ${linkedPassage.reference}…`
              : 'dear Lord…'
          }
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={6}
          autoFocus={Boolean(linkedPassage)}
        />

        <div className="prayer-theme-picker">
          <button
            type="button"
            className="favorites-filters-toggle"
            aria-expanded={themesOpen}
            aria-controls="prayer-theme-picker-panel"
            onClick={() => setThemesOpen((open) => !open)}
          >
            <span className="favorites-filters-toggle-label">themes</span>
            {selectedThemes.length > 0 ? (
              <span className="favorites-filters-active" aria-label="Selected themes">
                {selectedThemes.map((theme) => (
                  <span key={theme} className="favorites-filter-tag">
                    {theme}
                  </span>
                ))}
              </span>
            ) : null}
            <span
              className={`favorites-filters-chevron${themesOpen ? ' favorites-filters-chevron--open' : ''}`}
              aria-hidden
            />
          </button>

          {themesOpen ? (
            <div
              id="prayer-theme-picker-panel"
              className="prayer-theme-picker-chips"
              role="group"
              aria-label="Tag prayer themes"
            >
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
          ) : null}
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
        <div className="saved-library">
          <div className="saved-library-tabs" role="tablist" aria-label="Saved prayers and cards">
            <button
              type="button"
              role="tab"
              id="saved-library-tab-prayers"
              aria-selected={libraryTab === 'prayers'}
              aria-controls="saved-library-panel-prayers"
              className={`favorites-filter-chip${libraryTab === 'prayers' ? ' favorites-filter-chip--active' : ''}`}
              onClick={() => setLibraryTab('prayers')}
            >
              prayers
            </button>
            <button
              type="button"
              role="tab"
              id="saved-library-tab-cards"
              aria-selected={libraryTab === 'cards'}
              aria-controls="saved-library-panel-cards"
              className={`favorites-filter-chip${libraryTab === 'cards' ? ' favorites-filter-chip--active' : ''}`}
              onClick={() => setLibraryTab('cards')}
            >
              cards
            </button>
          </div>

          {libraryTab === 'prayers' ? (
            <div
              id="saved-library-panel-prayers"
              role="tabpanel"
              aria-labelledby="saved-library-tab-prayers"
              className="saved-library-panel"
            >
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
                          <time
                            className="prayer-date"
                            dateTime={new Date(prayer.createdAt).toISOString()}
                          >
                            {formatPrayerDate(prayer.createdAt)}
                          </time>
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
                        <div className="prayer-card-actions">
                          <button
                            type="button"
                            className="prayer-text-btn"
                            onClick={() => setCardPrayer(prayer)}
                          >
                            {savedCardIds.includes(prayer.id) ? 'card saved' : 'card'}
                          </button>
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
          ) : (
            <div
              id="saved-library-panel-cards"
              role="tabpanel"
              aria-labelledby="saved-library-tab-cards"
              className="saved-library-panel"
            >
              <SavedPrayerCards cards={savedCards} onViewCard={setCardPrayer} />
            </div>
          )}
        </div>
      ) : null}

      {cardPrayer ? (
        <PrayerCardModal
          prayer={cardPrayer}
          onClose={() => setCardPrayer(null)}
          onCardSaved={(prayerId) => {
            setSavedCardIds((ids) => (ids.includes(prayerId) ? ids : [...ids, prayerId]))
            setLibraryTab('cards')
          }}
        />
      ) : null}

      {previewPrayer?.passageReference ? (
        <PassagePreviewModal
          passageId={previewPrayer.passageId}
          passageReference={previewPrayer.passageReference}
          onClose={() => setPreviewPrayer(null)}
        />
      ) : null}

      {previewLinkedPassage && linkedPassage ? (
        <PassagePreviewModal
          passageId={linkedPassage.id}
          passageReference={linkedPassage.reference}
          onClose={() => setPreviewLinkedPassage(false)}
        />
      ) : null}
    </section>
  )
}
