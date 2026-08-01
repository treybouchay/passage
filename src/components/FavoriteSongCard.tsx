import {
  getSongArtistBlurb,
  getSongBlurb,
  type PlaylistSong,
} from '../data/songs'
import { FavoriteButton } from './FavoriteButton'
import { SongLink } from './SongLink'

interface FavoriteSongCardProps {
  song: PlaylistSong
  onToggleFavorite: (id: string) => void
}

export function FavoriteSongCard({
  song,
  onToggleFavorite,
}: FavoriteSongCardProps) {
  const songBlurb = getSongBlurb(song)
  const artistBlurb = getSongArtistBlurb(song)
  const themes = song.themes.filter(Boolean)

  return (
    <article className="favorite-song-card">
      <div className="favorite-song-card-top">
        <SongLink
          song={song}
          className="favorite-song-card-link"
          favoriteActive
          onToggleFavorite={onToggleFavorite}
        />
        <FavoriteButton
          active
          onToggle={() => onToggleFavorite(song.id)}
          label={`Remove ${song.title} from favorites`}
        />
      </div>

      <div className="favorite-song-card-tags" aria-label="Genre and themes">
        <span className="song-detail-genre-chip">{song.genre}</span>
        {themes.map((theme) => (
          <span key={theme} className="passage-theme-tag">
            {theme}
          </span>
        ))}
      </div>

      <div className="favorite-song-card-blurbs">
        <section
          className="song-detail-blurb-block"
          aria-labelledby={`fav-song-${song.id}-song`}
        >
          <h4
            id={`fav-song-${song.id}-song`}
            className="song-detail-section-label"
          >
            about the song
          </h4>
          <p className="song-detail-blurb">{songBlurb}</p>
        </section>
        <section
          className="song-detail-blurb-block song-detail-blurb-block--artist"
          aria-labelledby={`fav-song-${song.id}-artist`}
        >
          <h4
            id={`fav-song-${song.id}-artist`}
            className="song-detail-section-label song-detail-section-label--artist"
          >
            about the artist
          </h4>
          <p className="song-detail-blurb song-detail-blurb-artist">{artistBlurb}</p>
        </section>
      </div>
    </article>
  )
}
