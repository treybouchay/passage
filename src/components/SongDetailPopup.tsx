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

        <div className="song-detail-row">
          {song.albumArtUrl ? (
            <img
              className="song-detail-art"
              src={song.albumArtUrl}
              alt=""
              width={96}
              height={96}
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
          </div>
        </div>

        <div className="song-detail-blurbs">
          <p className="song-detail-blurb">{songBlurb}</p>
          <p className="song-detail-blurb song-detail-blurb-artist">{artistBlurb}</p>
        </div>

        <div className="song-detail-actions">
          <button
            type="button"
            className="song-detail-icon-btn"
            onClick={handleShare}
            disabled={!song.spotifyUrl || isSharing}
            aria-label={isSharing ? 'Sharing' : 'Share song'}
          >
            <ShareIcon className="song-detail-icon" />
          </button>
          {song.spotifyUrl ? (
            <a
              className="song-detail-icon-btn"
              href={song.spotifyUrl}
              target="_blank"
              rel="noreferrer"
              aria-label="Play on Spotify"
            >
              <PlayIcon className="song-detail-icon" />
            </a>
          ) : (
            <button
              type="button"
              className="song-detail-icon-btn"
              disabled
              aria-label="Play on Spotify unavailable"
            >
              <PlayIcon className="song-detail-icon" />
            </button>
          )}
        </div>

        {status ? <p className="song-detail-status">{status}</p> : null}
      </div>
    </div>,
    document.body,
  )
}
