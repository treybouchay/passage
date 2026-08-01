import { useState } from 'react'
import type { PlaylistSong } from '../data/songs'
import { SongDetailPopup } from './SongDetailPopup'

interface SongLinkProps {
  song: PlaylistSong
  className?: string
  favoriteActive?: boolean
  onToggleFavorite?: (id: string) => void
}

export function SongLink({
  song,
  className = 'song-rec',
  favoriteActive = false,
  onToggleFavorite,
}: SongLinkProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        className={`${className} song-rec-trigger`}
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-label={`${song.title} by ${song.artists}`}
      >
        {song.albumArtUrl ? (
          <img
            className="song-rec-art"
            src={song.albumArtUrl}
            alt=""
            width={48}
            height={48}
            loading="lazy"
            decoding="async"
          />
        ) : (
          <span className="song-rec-art song-rec-art-placeholder" aria-hidden />
        )}
        <span className="song-rec-meta">
          <span className="song-rec-title">{song.title}</span>
          <span className="song-rec-artists">{song.artists}</span>
        </span>
      </button>

      {open ? (
        <SongDetailPopup
          song={song}
          onClose={() => setOpen(false)}
          favoriteActive={favoriteActive}
          onToggleFavorite={
            onToggleFavorite ? () => onToggleFavorite(song.id) : undefined
          }
        />
      ) : null}
    </>
  )
}
