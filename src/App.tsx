import { useCallback, useEffect, useMemo, useState } from 'react'
import { ActivityBell } from './components/ActivityBell'
import { SideNav, type AppView } from './components/SideNav'
import { FavoritesSection } from './components/FavoritesSection'
import { Logo } from './components/Logo'
import { MusicSection } from './components/MusicSection'
import { PassageCard } from './components/PassageCard'
import { PassageTranslationBar } from './components/PassageTranslationBar'
import { PrayerHandsLoader } from './components/PrayerHandsLoader'
import { PrayerSection } from './components/PrayerSection'
import { SongRecommendations } from './components/SongRecommendations'
import { TraceGesture } from './components/TraceGesture'
import { pickHomeSuggestions, type Passage } from './data/passages'
import { BibleTranslationProvider } from './lib/bibleTranslationContext'
import { useOrderReturnNotice } from './lib/useOrderReturnNotice'
import { matchPassages, RESULTS_PER_PAGE, type MatchedPassage } from './lib/matchPassages'
import { matchSongs } from './lib/matchSongs'
import {
  getPassageById,
  loadFavoriteIds,
  loadFavoriteSongIds,
  loadPrayers,
  toggleFavoriteId,
  toggleFavoriteSongId,
  type SavedPrayer,
} from './lib/userContent'
import {
  clearSampleActivities,
  countUnreadActivities,
  loadActivities,
  logFavoritePassageActivity,
  logFavoriteSongActivity,
  logPassagePrayerActivity,
  markActivitiesRead,
  seedSampleActivities,
  syncKnownSongCatalog,
  type ActivityItem,
} from './lib/activityFeed'
import './App.css'

const UNLOCK_SESSION_KEY = 'passage:unlocked'
const VIEW_SESSION_KEY = 'passage:view'
const VALID_VIEWS: AppView[] = ['passages', 'prayer', 'favorites', 'music']

function loadUnlocked(): boolean {
  try {
    return sessionStorage.getItem(UNLOCK_SESSION_KEY) === 'true'
  } catch {
    return false
  }
}

function persistUnlocked(): void {
  try {
    sessionStorage.setItem(UNLOCK_SESSION_KEY, 'true')
  } catch {
    // sessionStorage unavailable (e.g. private browsing quota)
  }
}

function loadView(): AppView {
  try {
    const stored = sessionStorage.getItem(VIEW_SESSION_KEY)
    if (stored && VALID_VIEWS.includes(stored as AppView)) {
      return stored as AppView
    }
  } catch {
    // ignore
  }
  return 'passages'
}

function persistView(view: AppView): void {
  try {
    sessionStorage.setItem(VIEW_SESSION_KEY, view)
  } catch {
    // ignore
  }
}

function App() {
  const [unlocked, setUnlocked] = useState(() => loadUnlocked())
  const [view, setView] = useState<AppView>(() =>
    loadUnlocked() ? loadView() : 'passages',
  )
  const [booting, setBooting] = useState(true)
  const [input, setInput] = useState('')
  const [results, setResults] = useState<MatchedPassage[]>([])
  const [hasSearched, setHasSearched] = useState(false)
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => loadFavoriteIds())
  const [favoriteSongIds, setFavoriteSongIds] = useState<string[]>(() =>
    loadFavoriteSongIds(),
  )
  const [prayers, setPrayers] = useState<SavedPrayer[]>(() => loadPrayers())
  const [homeSuggestions] = useState(() => pickHomeSuggestions())
  const [resultsPage, setResultsPage] = useState(1)
  const [prayerSeed, setPrayerSeed] = useState<Passage | null>(null)
  const [activities, setActivities] = useState<ActivityItem[]>(() =>
    import.meta.env.PROD ? clearSampleActivities() : loadActivities(),
  )
  const [activityOpen, setActivityOpen] = useState(false)
  const orderNotice = useOrderReturnNotice()

  const unreadActivityCount = useMemo(
    () => countUnreadActivities(activities),
    [activities],
  )

  const refreshActivities = useCallback(() => {
    setActivities(loadActivities())
  }, [])

  useEffect(() => {
    if (!unlocked) return
    syncKnownSongCatalog()
    if (import.meta.env.PROD) {
      setActivities(clearSampleActivities())
    } else {
      refreshActivities()
    }
  }, [unlocked, refreshActivities])

  useEffect(() => {
    const timer = window.setTimeout(() => setBooting(false), 1600)
    return () => window.clearTimeout(timer)
  }, [])

  const clearPrayerSeed = useCallback(() => {
    setPrayerSeed(null)
  }, [])

  const totalResultPages = Math.ceil(results.length / RESULTS_PER_PAGE)
  const pagedResults = results.slice(
    (resultsPage - 1) * RESULTS_PER_PAGE,
    resultsPage * RESULTS_PER_PAGE,
  )
  const songRecs = matchSongs(
    input,
    results.flatMap((passage) => passage.themes),
  )
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim()) return
    setResults(matchPassages(input))
    setResultsPage(1)
    setHasSearched(true)
  }

  function handleSuggestion(mood: string) {
    setInput(mood.toLowerCase())
    setResults(matchPassages(mood))
    setResultsPage(1)
    setHasSearched(true)
  }

  function handleClearSearch() {
    setInput('')
    setResults([])
    setResultsPage(1)
    setHasSearched(false)
  }

  function handleToggleFavorite(id: string) {
    const wasFavorite = favoriteIds.includes(id)
    const next = toggleFavoriteId(id)
    setFavoriteIds(next)
    if (!wasFavorite && next.includes(id) && getPassageById(id)) {
      setActivities(logFavoritePassageActivity(id))
    }
  }

  function handleToggleFavoriteSong(id: string) {
    const wasFavorite = favoriteSongIds.includes(id)
    const next = toggleFavoriteSongId(id)
    setFavoriteSongIds(next)
    if (!wasFavorite && next.includes(id)) {
      setActivities(logFavoriteSongActivity(id))
    }
  }

  function handlePrayersChange(next: SavedPrayer[]) {
    const previousIds = new Set(prayers.map((prayer) => prayer.id))
    for (const prayer of next) {
      if (!previousIds.has(prayer.id) && (prayer.passageId || prayer.passageReference)) {
        setActivities(logPassagePrayerActivity(prayer))
        break
      }
    }
    setPrayers(next)
  }

  function handleActivityNavigate(view: AppView) {
    handleViewChange(view)
    setActivityOpen(false)
  }

  const markActivityRead = useCallback(() => {
    setActivities(markActivitiesRead())
  }, [])

  const handleSimulateActivities = useCallback(() => {
    if (!import.meta.env.DEV) return
    setActivities(seedSampleActivities())
  }, [])

  function handleViewChange(next: AppView) {
    if (next !== 'prayer') {
      setPrayerSeed(null)
    }
    setView(next)
    persistView(next)
  }

  function handlePrayFromPassage(passage: Passage) {
    setPrayerSeed(passage)
    setView('prayer')
    persistView('prayer')
  }

  return (
    <div
      className={`app${unlocked ? ' app--with-sidebar' : ''}${booting ? ' app--booting' : ''}`}
      aria-busy={booting || undefined}
    >
      {booting ? (
        <div className="boot-loader-overlay">
          <PrayerHandsLoader />
        </div>
      ) : null}

      <div className={`app-shell${booting ? ' app-shell--blurred' : ''}`}>
      {unlocked ? <SideNav view={view} onChange={handleViewChange} /> : null}

      <header className="header">
        <Logo />
        {unlocked ? (
          <ActivityBell
            activities={activities}
            unreadCount={unreadActivityCount}
            open={activityOpen}
            onToggle={() => setActivityOpen((open) => !open)}
            onClose={() => setActivityOpen(false)}
            onMarkAllRead={markActivityRead}
            onNavigate={handleActivityNavigate}
            onSimulateExamples={
              import.meta.env.DEV ? handleSimulateActivities : undefined
            }
          />
        ) : null}
      </header>

      {orderNotice ? <p className="order-notice">{orderNotice}</p> : null}

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
                  <TraceGesture
                    onComplete={() => {
                      persistUnlocked()
                      setUnlocked(true)
                    }}
                  />
                ) : (
                  <>
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

                      <ul className="suggestions suggestions--home" aria-label="Mood suggestions">
                        {homeSuggestions.map((mood) => (
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
                  </>
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

                <BibleTranslationProvider>
                  <PassageTranslationBar className="passage-translation-bar" />

                  <div className="passage-list">
                    {pagedResults.map((passage) => (
                      <PassageCard
                        key={passage.id}
                        passage={passage}
                        favoriteActive={favoriteIds.includes(passage.id)}
                        onToggleFavorite={handleToggleFavorite}
                        onPray={handlePrayFromPassage}
                      />
                    ))}
                  </div>
                </BibleTranslationProvider>

                {totalResultPages > 1 ? (
                  <nav className="results-pagination" aria-label="Passage pages">
                    {Array.from({ length: totalResultPages }, (_, index) => {
                      const page = index + 1
                      return (
                        <button
                          key={page}
                          type="button"
                          className={`results-page-btn${resultsPage === page ? ' results-page-btn--active' : ''}`}
                          aria-current={resultsPage === page ? 'page' : undefined}
                          onClick={() => setResultsPage(page)}
                        >
                          {page}
                        </button>
                      )
                    })}
                  </nav>
                ) : null}

                <SongRecommendations
                  songs={songRecs}
                  onSeeMore={() => handleViewChange('music')}
                  favoriteSongIds={favoriteSongIds}
                  onToggleFavoriteSong={handleToggleFavoriteSong}
                />
              </section>
            )
          ) : null}

          {view === 'prayer' && unlocked ? (
            <PrayerSection
              favoriteIds={favoriteIds}
              onToggleFavorite={handleToggleFavorite}
              onPrayersChange={handlePrayersChange}
              seedPassage={prayerSeed}
              onSeedConsumed={clearPrayerSeed}
            />
          ) : null}

          {view === 'favorites' && unlocked ? (
            <FavoritesSection
              favoriteIds={favoriteIds}
              favoriteSongIds={favoriteSongIds}
              prayers={prayers}
              onToggleFavorite={handleToggleFavorite}
              onToggleFavoriteSong={handleToggleFavoriteSong}
              onPray={handlePrayFromPassage}
            />
          ) : null}

          {view === 'music' && unlocked ? (
            <MusicSection
              favoriteSongIds={favoriteSongIds}
              onToggleFavoriteSong={handleToggleFavoriteSong}
            />
          ) : null}
        </main>
      </div>
      </div>
    </div>
  )
}

export default App
