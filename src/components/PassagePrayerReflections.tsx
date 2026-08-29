import { useMemo, useState } from 'react'
import { BibleTranslationProvider } from '../lib/bibleTranslationContext'
import {
  countPassageInspiredPrayers,
  groupPassageInspiredPrayers,
} from '../lib/passagePrayerReflections'
import { formatPrayerDate, type SavedPrayer } from '../lib/userContent'
import { PassagePreviewModal, PrayerPassageLink } from './PassagePreviewModal'
import { PassageText } from './PassageText'
import { PassageTranslationBar } from './PassageTranslationBar'

interface PassagePrayerReflectionsProps {
  prayers: SavedPrayer[]
  onEdit: (prayer: SavedPrayer) => void
}

export function PassagePrayerReflections({
  prayers,
  onEdit,
}: PassagePrayerReflectionsProps) {
  const groups = useMemo(() => groupPassageInspiredPrayers(prayers), [prayers])
  const inspiredCount = useMemo(() => countPassageInspiredPrayers(prayers), [prayers])
  const [preview, setPreview] = useState<{
    passageId?: string
    passageReference: string
  } | null>(null)

  if (inspiredCount === 0) {
    return (
      <div className="passage-reflections-empty">
        <p className="passage-reflections-empty-lead">
          When you pray from a passage, those prayers gather here—scripture, its
          reflection, and what you wrote in response.
        </p>
        <p className="passage-reflections-empty-hint">
          Open a passage and tap pray to start.
        </p>
      </div>
    )
  }

  return (
    <>
      <p className="passage-reflections-lead">
        {inspiredCount} passage-inspired prayer{inspiredCount === 1 ? '' : 's'}{' '}
        across {groups.length} passage{groups.length === 1 ? '' : 's'}.
      </p>

      <ul className="passage-reflection-list">
        {groups.map((group) => (
          <li key={group.key}>
            <article className="passage-reflection-group">
              <header className="passage-reflection-header">
                <div className="passage-reflection-heading">
                  <button
                    type="button"
                    className="passage-reflection-ref"
                    onClick={() =>
                      setPreview({
                        passageId: group.passageId,
                        passageReference: group.passageReference,
                      })
                    }
                  >
                    {group.passageReference}
                  </button>
                  <p className="passage-reflection-meta">
                    {group.prayers.length} prayer
                    {group.prayers.length === 1 ? '' : 's'}
                    {' · '}
                    latest {formatPrayerDate(group.latestAt)}
                  </p>
                </div>
              </header>

              {group.passage?.reflection ? (
                <p className="passage-reflection-note">{group.passage.reflection}</p>
              ) : null}

              {group.passage?.text ? (
                <aside
                  className="passage-reflection-scripture"
                  aria-label={`${group.passageReference} text`}
                >
                  <BibleTranslationProvider>
                    <PassageTranslationBar className="passage-translation-bar passage-translation-bar--reflection" />
                    <PassageText
                      passage={group.passage}
                      className="passage-text passage-reflection-scripture-text"
                    />
                  </BibleTranslationProvider>
                </aside>
              ) : null}

              <div className="passage-reflection-prayers">
                <h3 className="passage-reflection-prayers-label">your prayers</h3>
                <ul className="passage-reflection-prayer-list">
                  {group.prayers.map((prayer) => (
                    <li key={prayer.id}>
                      <article className="passage-reflection-prayer">
                        <time
                          className="prayer-date"
                          dateTime={new Date(prayer.createdAt).toISOString()}
                        >
                          {formatPrayerDate(prayer.createdAt)}
                        </time>
                        <p className="passage-text passage-text--prayer">{prayer.text}</p>
                        {!group.passage && prayer.passageReference ? (
                          <PrayerPassageLink
                            passageId={prayer.passageId}
                            passageReference={prayer.passageReference}
                            onOpen={() =>
                              setPreview({
                                passageId: prayer.passageId,
                                passageReference: prayer.passageReference!,
                              })
                            }
                          />
                        ) : null}
                        <button
                          type="button"
                          className="prayer-text-btn"
                          onClick={() => onEdit(prayer)}
                        >
                          edit
                        </button>
                      </article>
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          </li>
        ))}
      </ul>

      {preview ? (
        <PassagePreviewModal
          passageId={preview.passageId}
          passageReference={preview.passageReference}
          onClose={() => setPreview(null)}
        />
      ) : null}
    </>
  )
}
