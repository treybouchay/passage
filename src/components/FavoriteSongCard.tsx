import { useEffect, useState } from 'react'
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
  const artist = primaryArtistName(song.artists)
  const fallbackArtistUrl = ticketmasterSearchUrl(artist)

  const [concert, setConcert] = useState<ConcertEvent | null>(null)
  const [concertsLoading, setConcertsLoading] = useState(true)
  const [concertsError, setConcertsError] = useState(false)
  const [concertsLocated, setConcertsLocated] = useState(false)
  const [artistUrl, setArtistUrl] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadConcerts() {
      setConcertsLoading(true)
      setConcertsError(false)
      try {
        const result = await fetchArtistConcerts(artist, null)
        if (cancelled) return
        setConcert(result.events[0] ?? null)
        setConcertsLocated(Boolean(result.located))
        setArtistUrl(result.artistUrl ?? fallbackArtistUrl)
        setConcertsLoading(false)

        const coords = await getBrowserCoords()
        if (cancelled || !coords) return

        const nearby = await fetchArtistConcerts(artist, coords)
        if (cancelled) return
        setConcert(nearby.events[0] ?? null)
        setConcertsLocated(Boolean(nearby.located))
        setArtistUrl(nearby.artistUrl ?? ticketmasterSearchUrl(artist, coords))
      } catch {
        if (cancelled) return
        setConcert(null)
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

  const place = concert ? formatConcertPlace(concert) : null
  const distance = concert ? formatConcertDistance(concert.distanceKm) : null
  const billDiffers = concert
    ? !concert.title.toLowerCase().includes(artist.toLowerCase())
    : false

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

        <section
          className="song-detail-blurb-block song-detail-blurb-block--concerts"
          aria-labelledby={`fav-song-${song.id}-concert`}
        >
          <h4
            id={`fav-song-${song.id}-concert`}
            className="song-detail-section-label song-detail-section-label--concerts"
          >
            {concertsLocated ? 'nearest concert' : 'upcoming concert'}
          </h4>
          {concertsLoading ? (
            <p className="song-detail-blurb song-detail-concerts-empty">
              Looking up shows for {artist}…
            </p>
          ) : concert ? (
            <>
              {concert.url ? (
                <a
                  className="song-detail-concert"
                  href={concert.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  <span className="song-detail-concert-date">
                    {formatConcertDate(concert.datetime)}
                  </span>
                  <span className="song-detail-concert-venue">{concert.venueName}</span>
                  {place ? (
                    <span className="song-detail-concert-place">{place}</span>
                  ) : null}
                  {billDiffers ? (
                    <span className="song-detail-concert-bill">{concert.title}</span>
                  ) : null}
                  {distance ? (
                    <span className="song-detail-concert-distance">{distance}</span>
                  ) : null}
                </a>
              ) : (
                <div className="song-detail-concert">
                  <span className="song-detail-concert-date">
                    {formatConcertDate(concert.datetime)}
                  </span>
                  <span className="song-detail-concert-venue">{concert.venueName}</span>
                  {place ? (
                    <span className="song-detail-concert-place">{place}</span>
                  ) : null}
                  {billDiffers ? (
                    <span className="song-detail-concert-bill">{concert.title}</span>
                  ) : null}
                  {distance ? (
                    <span className="song-detail-concert-distance">{distance}</span>
                  ) : null}
                </div>
              )}
              {artistUrl ? (
                <a
                  className="song-detail-concerts-more"
                  href={artistUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  See all on Ticketmaster
                </a>
              ) : null}
            </>
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
        </section>
      </div>
    </article>
  )
}
