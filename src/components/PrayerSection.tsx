import { useState } from 'react'
import { FavoriteButton } from './FavoriteButton'
import {
  deletePrayer,
  loadPrayers,
  savePrayer,
  type SavedPrayer,
} from '../lib/userContent'

interface PrayerSectionProps {
  favoriteIds: string[]
  onToggleFavorite: (id: string) => void
  onPrayersChange: (prayers: SavedPrayer[]) => void
}

export function PrayerSection({
  favoriteIds,
  onToggleFavorite,
  onPrayersChange,
}: PrayerSectionProps) {
  const [draft, setDraft] = useState('')
  const [prayers, setPrayers] = useState<SavedPrayer[]>(() => loadPrayers())
  const [editingId, setEditingId] = useState<string | null>(null)

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!draft.trim()) return
    const next = savePrayer(draft, editingId ?? undefined)
    setPrayers(next)
    onPrayersChange(next)
    setDraft('')
    setEditingId(null)
  }

  function handleEdit(prayer: SavedPrayer) {
    setDraft(prayer.text)
    setEditingId(prayer.id)
  }

  function handleDelete(id: string) {
    const next = deletePrayer(id)
    setPrayers(next)
    onPrayersChange(next)
    if (editingId === id) {
      setDraft('')
      setEditingId(null)
    }
  }

  return (
    <section className="prayer-section" aria-labelledby="prayer-heading">
      <h2 id="prayer-heading" className="section-title">
        your prayer
      </h2>
      <p className="section-lead">
        Write what is on your heart. Save prayers to return to them—or mark them with the halo to keep them close.
      </p>

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
        <div className="prayer-form-actions">
          {editingId ? (
            <button
              type="button"
              className="prayer-secondary-btn"
              onClick={() => {
                setDraft('')
                setEditingId(null)
              }}
            >
              cancel
            </button>
          ) : null}
          <button type="submit" className="prayer-save-btn" disabled={!draft.trim()}>
            {editingId ? 'update prayer' : 'save prayer'}
          </button>
        </div>
      </form>

      {prayers.length > 0 ? (
        <div className="saved-prayers">
          <h3 className="saved-prayers-title">saved prayers</h3>
          <ul className="saved-prayer-list">
            {prayers.map((prayer) => (
              <li key={prayer.id}>
                <article className="passage-card passage-card--prayer">
                  <div className="passage-card-header">
                    <span className="passage-ref">my prayer</span>
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
        </div>
      ) : null}
    </section>
  )
}
