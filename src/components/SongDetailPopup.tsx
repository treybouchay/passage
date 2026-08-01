import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  getSongArtistBlurb,
  getSongBlurb,
  type PlaylistSong,
} from '../data/songs'
import {
  fetchArtistConcerts,
  formatConcertDate,
  formatConcertDistance,
  formatConcertPlace,
  getBrowserCoords,
  primaryArtistName,
  ticketmasterSearchUrl,
  type ConcertEvent,
} from '../lib/concerts'
import { shareSong } from '../lib/shareSong'
import { FavoriteButton } from './FavoriteButton'

interface SongDetailPopupProps {
  song: PlaylistSong
  onClose: () => void
  favoriteActive?: boolean
  onToggleFavorite?: () => void
}

function ShareIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M14.5 7.5 20 3.5v5M20 3.5l-8.5 7.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10.5 5.5H7.75A2.75 2.75 0 0 0 5 8.25v8.5A2.75 2.75 0 0 0 7.75 19.5h8.5A2.75 2.75 0 0 0 19 16.75V14"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M8.5 6.2v11.6L18.2 12 8.5 6.2z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function SongDetailPopup({
  song,
  onClose,
  favoriteActive = false,
  onToggleFavorite,
}: SongDetailPopupProps) {
  const [status, setStatus] = useState<string | null>(null)
  const [isSharing, setIsSharing] = useState(false)
  const [concerts, setConcerts] = useState<ConcertEvent[] | null>(null)
  const [concertsLoading, setConcertsLoading] = useState(true)
  const [concertsError, setConcertsError] = useState(false)
  const [concertsLocated, setConcertsLocated] = useState(false)
  const [artistUrl, setArtistUrl] = useState<string | null>(null)
  const statusTimer = useRef<number | null>(null)
  const songBlurb = getSongBlurb(song)
  const artistBlurb = getSongArtistBlurb(song)
  const themes = song.themes.filter(Boolean)
  const artist = primaryArtistName(song.artists)
  const fallbackArtistUrl = ticketmasterSearchUrl(artist)

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousOverflow
      if (statusTimer.current !== null) {
        window.clearTimeout(statusTimer.current)
      }
    }
  }, [onClose])

  useEffect(() => {
    let cancelled = false

    async function loadConcerts() {
      setConcertsLoading(true)
      setConcertsError(false)
      try {
        // Don't block the first fetch on geolocation — mobile permission prompts
        // are slow/flaky and were a common cause of empty/error states.
        const result = await fetchArtistConcerts(artist, null)
        if (cancelled) return
        setConcerts(result.events)
        setConcertsLocated(Boolean(result.located))
        setArtistUrl(result.artistUrl ?? fallbackArtistUrl)
        setConcertsLoading(false)

        const coords = await getBrowserCoords()
        if (cancelled || !coords) return

        const nearby = await fetchArtistConcerts(artist, coords)
        if (cancelled) return
        setConcerts(nearby.events)
        setConcertsLocated(Boolean(nearby.located))
        setArtistUrl(nearby.artistUrl ?? ticketmasterSearchUrl(artist, coords))
      } catch {
        if (cancelled) return
        setConcerts([])
        setConcertsError(true)
        setArtistUrl(fallbackArtistUrl)
        setConcertsLoading(false)
      }
    }

    void loadConcerts()
    return () => {
      cancelled = true
    }
  }, [artist, fallbackArtistUrl])

  function showStatus(message: string) {
    setStatus(message)
    if (statusTimer.current !== null) {
      window.clearTimeout(statusTimer.current)
    }
    statusTimer.current = window.setTimeout(() => setStatus(null), 1800)
  }

  async function handleShare() {
    if (!song.spotifyUrl || isSharing) return
    setIsSharing(true)
    try {
      const result = await shareSong(song)
      if (result === 'copied') {
        showStatus('copied')
      } else if (result === 'unsupported') {
        showStatus('unavailable')
      }
    } catch {
      showStatus('unavailable')
    } finally {
      setIsSharing(false)
    }
  }

  return createPortal(
    <div className="song-detail-modal" role="presentation" onClick={onClose}>
      <div
        className="song-detail-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="song-detail-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="song-detail-header">
          <button
            type="button"
            className="wallpaper-modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="song-detail-hero">
          {song.albumArtUrl ? (
            <img
              className="song-detail-art"
              src={song.albumArtUrl}
              alt=""
              width={120}
              height={120}
              decoding="async"
            />
          ) : (
            <span className="song-detail-art song-detail-art-placeholder" aria-hidden />
          )}
          <div className="song-detail-meta">
            <h3 id="song-detail-title" className="song-detail-title">
              {song.title}
            </h3>
            <p className="song-detail-artists">{song.artists}</p>
            <div className="song-detail-tags" aria-label="Genre and themes">
              <span className="song-detail-genre-chip">{song.genre}</span>
              {themes.map((theme) => (
                <span key={theme} className="passage-theme-tag">
                  {theme}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="song-detail-blurbs">
          <section className="song-detail-blurb-block" aria-labelledby="song-detail-song-label">
            <h4 id="song-detail-song-label" className="song-detail-section-label">
              about the song
            </h4>
            <p className="song-detail-blurb">{songBlurb}</p>
          </section>
          <section
            className="song-detail-blurb-block song-detail-blurb-block--artist"
            aria-labelledby="song-detail-artist-label"
          >
            <h4
              id="song-detail-artist-label"
              className="song-detail-section-label song-detail-section-label--artist"
            >
              about the artist
            </h4>
            <p className="song-detail-blurb song-detail-blurb-artist">{artistBlurb}</p>
          </section>

          <section
            className="song-detail-blurb-block song-detail-blurb-block--concerts"
            aria-labelledby="song-detail-concerts-label"
          >
            <h4
              id="song-detail-concerts-label"
              className="song-detail-section-label song-detail-section-label--concerts"
            >
              {concertsLocated ? 'nearby concerts' : 'upcoming concerts'}
            </h4>
            {concertsLoading ? (
              <p className="song-detail-blurb song-detail-concerts-empty">
                Looking up shows for {artist}…
              </p>
            ) : concerts && concerts.length > 0 ? (
              <ul className="song-detail-concerts">
                {concerts.map((event) => {
                  const place = formatConcertPlace(event)
                  const distance = formatConcertDistance(event.distanceKm)
                  const billDiffers =
                    !event.title.toLowerCase().includes(artist.toLowerCase())
                  const content = (
                    <>
                      <span className="song-detail-concert-date">
                        {formatConcertDate(event.datetime)}
                      </span>
                      <span className="song-detail-concert-venue">{event.venueName}</span>
                      {place ? (
                        <span className="song-detail-concert-place">{place}</span>
                      ) : null}
                      {billDiffers ? (
                        <span className="song-detail-concert-bill">{event.title}</span>
                      ) : null}
                      {distance ? (
                        <span className="song-detail-concert-distance">{distance}</span>
                      ) : null}
                    </>
                  )

                  return (
                    <li key={event.id}>
                      {event.url ? (
                        <a
                          className="song-detail-concert"
                          href={event.url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {content}
                        </a>
                      ) : (
                        <div className="song-detail-concert">{content}</div>
                      )}
                    </li>
                  )
                })}
              </ul>
            ) : (
              <p className="song-detail-blurb song-detail-concerts-empty">
                {concertsError
                  ? `Couldn’t load shows right now.`
                  : `No upcoming shows found for ${artist}.`}{' '}
                <a
                  className="song-detail-concerts-link"
                  href={artistUrl ?? fallbackArtistUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Search Ticketmaster
                </a>
              </p>
            )}
            {!concertsLoading && concerts && concerts.length > 0 && artistUrl ? (
              <a
                className="song-detail-concerts-more"
                href={artistUrl}
                target="_blank"
                rel="noreferrer"
              >
                See all on Ticketmaster
              </a>
            ) : null}
          </section>
        </div>

        <div className="song-detail-footer">
          <div className="song-detail-actions" role="group" aria-label="Song actions">
            {onToggleFavorite ? (
              <FavoriteButton
                active={favoriteActive}
                onToggle={onToggleFavorite}
                label={
                  favoriteActive
                    ? `Remove ${song.title} from favorites`
                    : `Add ${song.title} to favorites`
                }
              />
            ) : null}
            <button
              type="button"
              className="song-detail-action"
              onClick={handleShare}
              disabled={!song.spotifyUrl || isSharing}
              aria-label={isSharing ? 'Sharing…' : 'Share'}
            >
              <ShareIcon className="song-detail-icon" />
            </button>
            {song.spotifyUrl ? (
              <a
                className="song-detail-action"
                href={song.spotifyUrl}
                target="_blank"
                rel="noreferrer"
                aria-label="Play"
              >
                <PlayIcon className="song-detail-icon" />
              </a>
            ) : (
              <button
                type="button"
                className="song-detail-action"
                disabled
                aria-label="Play"
              >
                <PlayIcon className="song-detail-icon" />
              </button>
            )}
          </div>
          {status ? <p className="song-detail-status">{status}</p> : null}
        </div>
      </div>
    </div>,
    document.body,
  )
}
