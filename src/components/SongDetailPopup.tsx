import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  getSongArtistBlurb,
  getSongBlurb,
  type PlaylistSong,
} from '../data/songs'
import { shareSong } from '../lib/shareSong'

interface SongDetailPopupProps {
  song: PlaylistSong
  onClose: () => void
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
      <circle
        cx="12"
        cy="12"
        r="8.25"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M10.1 8.85v6.3l5.2-3.15-5.2-3.15z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="0.6"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function SongDetailPopup({ song, onClose }: SongDetailPopupProps) {
  const [status, setStatus] = useState<string | null>(null)
  const [isSharing, setIsSharing] = useState(false)
  const statusTimer = useRef<number | null>(null)
  const songBlurb = getSongBlurb(song)
  const artistBlurb = getSongArtistBlurb(song)
  const themes = song.themes.filter(Boolean)

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
            <div className="song-detail-actions" role="group" aria-label="Song actions">
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

        <div className="song-detail-blurbs">
          <section className="song-detail-blurb-block" aria-labelledby="song-detail-song-label">
            <h4 id="song-detail-song-label" className="song-detail-section-label">
              about the song
            </h4>
            <p className="song-detail-blurb">{songBlurb}</p>
          </section>
          <section className="song-detail-blurb-block" aria-labelledby="song-detail-artist-label">
            <h4 id="song-detail-artist-label" className="song-detail-section-label">
              about the artist
            </h4>
            <p className="song-detail-blurb song-detail-blurb-artist">{artistBlurb}</p>
          </section>
        </div>

        <div className="song-detail-tags" aria-label="Genre and themes">
          <span className="song-detail-genre-chip">{song.genre}</span>
          {themes.map((theme) => (
            <span key={theme} className="passage-theme-tag">
              {theme}
            </span>
          ))}
        </div>
      </div>
    </div>,
    document.body,
  )
}
