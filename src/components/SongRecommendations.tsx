import type { MatchedSong } from '../lib/matchSongs'

interface SongRecommendationsProps {
  songs: MatchedSong[]
}

export function SongRecommendations({ songs }: SongRecommendationsProps) {
  if (songs.length === 0) return null

  return (
    <aside className="song-recs" aria-labelledby="song-recs-heading">
      <div className="song-recs-header">
        <h3 id="song-recs-heading" className="song-recs-title">
          suggested listens
        </h3>
      </div>
      <ul className="song-recs-list">
        {songs.map((song) => (
          <li key={song.id}>
            <a
              className="song-rec"
              href={song.spotifyUrl}
              target="_blank"
              rel="noreferrer"
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
            </a>
          </li>
        ))}
      </ul>
    </aside>
  )
}
