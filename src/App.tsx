import { useState } from 'react'
import { SideNav, type AppView } from './components/SideNav'
import { FavoriteButton } from './components/FavoriteButton'
import { FavoritesSection } from './components/FavoritesSection'
import { Logo } from './components/Logo'
import { PrayerSection } from './components/PrayerSection'
import { TraceGesture } from './components/TraceGesture'
import { moodSuggestions } from './data/passages'
import { matchPassages, type MatchedPassage } from './lib/matchPassages'
import {
  loadFavoriteIds,
  loadPrayers,
  toggleFavoriteId,
  type SavedPrayer,
} from './lib/userContent'
import './App.css'

function App() {
  const [unlocked, setUnlocked] = useState(false)
  const [view, setView] = useState<AppView>('passages')
  const [input, setInput] = useState('')
  const [results, setResults] = useState<MatchedPassage[]>([])
  const [hasSearched, setHasSearched] = useState(false)
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => loadFavoriteIds())
  const [prayers, setPrayers] = useState<SavedPrayer[]>(() => loadPrayers())

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim()) return
    setResults(matchPassages(input))
    setHasSearched(true)
  }

  function handleSuggestion(mood: string) {
    setInput(mood.toLowerCase())
    setResults(matchPassages(mood))
    setHasSearched(true)
  }

  function handleClearSearch() {
    setInput('')
    setResults([])
    setHasSearched(false)
  }

  function handleToggleFavorite(id: string) {
    setFavoriteIds(toggleFavoriteId(id))
  }

  function handleViewChange(next: AppView) {
    setView(next)
  }

  return (
    <div className={`app${unlocked ? ' app--with-sidebar' : ''}`}>
      {unlocked ? <SideNav view={view} onChange={handleViewChange} /> : null}

      <header className="header">
        <Logo />
      </header>

      <div className={`app-body${unlocked ? ' app-body--with-sidebar' : ''}`}>
        <main
          className={`main${
            unlocked && (view !== 'passages' || hasSearched) ? ' main--top' : ''
          }`}
        >
          {view === 'passages' ? (
            !hasSearched ? (
              <section className="home">
                {!unlocked ? (
                  <TraceGesture onComplete={() => setUnlocked(true)} />
                ) : (
                  <form className="input-line-form" onSubmit={handleSubmit}>
                    <label htmlFor="feelings" className="sr-only">
                      How are you feeling?
                    </label>
                    <div className="input-line-wrap">
                      <input
                        id="feelings"
                        type="text"
                        className="input-line"
                        placeholder="how are you feeling?"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        autoComplete="off"
                      />
                      <span className="input-line-bar" aria-hidden="true" />
                    </div>

                    <ul className="suggestions">
                      {moodSuggestions.map((mood) => (
                        <li key={mood}>
                          <button
                            type="button"
                            className="suggestion"
                            onClick={() => handleSuggestion(mood)}
                          >
                            {mood.toLowerCase()}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </form>
                )}
              </section>
            ) : (
              <section className="results" aria-live="polite">
                <div className="results-header">
                  <p className="results-query">{input}</p>
                  <button
                    type="button"
                    className="clear-search"
                    onClick={handleClearSearch}
                    aria-label="Clear search"
                  >
                    ×
                  </button>
                </div>

                <div className="passage-list">
                  {results.map((passage) => (
                    <article key={passage.id} className="passage-card">
                      <div className="passage-card-header passage-card-header--end">
                        <FavoriteButton
                          active={favoriteIds.includes(passage.id)}
                          onToggle={() => handleToggleFavorite(passage.id)}
                        />
                      </div>
                      <blockquote className="passage-text">{passage.text}</blockquote>
                      <p className="passage-reflection">{passage.reflection}</p>
                      <cite className="passage-ref passage-ref--footer">{passage.reference}</cite>
                    </article>
                  ))}
                </div>
              </section>
            )
          ) : null}

          {view === 'prayer' && unlocked ? (
            <PrayerSection
              favoriteIds={favoriteIds}
              onToggleFavorite={handleToggleFavorite}
              onPrayersChange={setPrayers}
            />
          ) : null}

          {view === 'favorites' && unlocked ? (
            <FavoritesSection
              favoriteIds={favoriteIds}
              prayers={prayers}
              onToggleFavorite={handleToggleFavorite}
            />
          ) : null}
        </main>
      </div>
    </div>
  )
}

export default App
