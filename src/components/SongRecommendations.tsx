import type { MatchedSong } from '../lib/matchSongs'
import { SongLink } from './SongLink'

interface SongRecommendationsProps {
  songs: MatchedSong[]
  onSeeMore?: () => void
}

export function SongRecommendations({ songs, onSeeMore }: SongRecommendationsProps) {
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
            <SongLink song={song} />
          </li>
        ))}
      </ul>
      {onSeeMore ? (
        <button type="button" className="song-recs-more" onClick={onSeeMore}>
          see more
        </button>
      ) : null}
    </aside>
  )
}
