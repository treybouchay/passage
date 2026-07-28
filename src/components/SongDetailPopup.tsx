import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { PlaylistSong } from '../data/songs'
import { shareSong } from '../lib/shareSong'

interface SongDetailPopupProps {
  song: PlaylistSong
  onClose: () => void
}

export function SongDetailPopup({ song, onClose }: SongDetailPopupProps) {
  const [status, setStatus] = useState<string | null>(null)
  const [isSharing, setIsSharing] = useState(false)
  const statusTimer = useRef<number | null>(null)

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

  const tags = [song.genre, ...song.themes.slice(0, 2)].filter(Boolean)

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
          <span className="song-detail-eyebrow">song</span>
          <button
            type="button"
            className="wallpaper-modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="song-detail-body">
          {song.albumArtUrl ? (
            <img
              className="song-detail-art"
              src={song.albumArtUrl}
              alt=""
              width={280}
              height={280}
              decoding="async"
            />
          ) : (
            <span className="song-detail-art song-detail-art-placeholder" aria-hidden />
          )}

          <h3 id="song-detail-title" className="song-detail-title">
            {song.title}
          </h3>
          <p className="song-detail-artists">{song.artists}</p>

          {tags.length > 0 ? (
            <ul className="song-detail-tags" aria-label="Genre and themes">
              {tags.map((tag) => (
                <li key={tag}>
                  <span className="passage-theme-tag">{tag}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <div className="song-detail-actions">
          {song.spotifyUrl ? (
            <a
              className="prayer-save-btn song-detail-play"
              href={song.spotifyUrl}
              target="_blank"
              rel="noreferrer"
            >
              play on Spotify
            </a>
          ) : (
            <button type="button" className="prayer-save-btn song-detail-play" disabled>
              play on Spotify
            </button>
          )}
          <button
            type="button"
            className="prayer-secondary-btn"
            onClick={handleShare}
            disabled={!song.spotifyUrl || isSharing}
          >
            {isSharing ? 'sharing…' : 'share'}
          </button>
        </div>

        {status ? <p className="song-detail-status">{status}</p> : null}
      </div>
    </div>,
    document.body,
  )
}
