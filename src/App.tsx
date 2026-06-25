import { useEffect, useRef, useState } from 'react'
import { Logo } from './components/Logo'
import { TraceGesture } from './components/TraceGesture'
import { moodSuggestions } from './data/passages'
import { matchPassages, type MatchedPassage } from './lib/matchPassages'
import './App.css'

function App() {
  const [unlocked, setUnlocked] = useState(false)
  const [input, setInput] = useState('')
  const [results, setResults] = useState<MatchedPassage[]>([])
  const [hasSearched, setHasSearched] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (unlocked && !hasSearched && inputRef.current) {
      inputRef.current.focus()
    }
  }, [unlocked, hasSearched])

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

  return (
    <div className="app">
      <header className="header">
        <Logo />
      </header>

      <main className="main">
        {!hasSearched ? (
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
                    ref={inputRef}
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
                  <blockquote className="passage-text">{passage.text}</blockquote>
                  <cite className="passage-ref">{passage.reference}</cite>
                  <p className="passage-reflection">{passage.reflection}</p>
                </article>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}

export default App
