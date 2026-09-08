import { useEffect, useState } from 'react'
import { playlistSongs } from '../data/songs'
import {
  fetchClosestPlaylistShows,
  formatConcertDate,
  formatConcertDistance,
  formatConcertPlace,
  type NearbyArtistShow,
  type NearbyShowsStatus,
} from '../lib/concerts'

export function NearbyShows() {
  const [items, setItems] = useState<NearbyArtistShow[]>([])
  const [status, setStatus] = useState<NearbyShowsStatus>('loading')
  const [located, setLocated] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setStatus('loading')
      try {
        const result = await fetchClosestPlaylistShows(playlistSongs, 3)
        if (cancelled) return
        setItems(result.items)
        setLocated(result.located)
        setStatus(result.status)
      } catch {
        if (cancelled) return
        setItems([])
        setLocated(false)
        setStatus('error')
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <section className="music-nearby" aria-labelledby="music-nearby-heading">
      <h3 id="music-nearby-heading" className="music-nearby-title">
        {located ? 'nearby' : 'playing near you'}
      </h3>

      {status === 'loading' ? (
        <p className="music-nearby-status">Finding shows near you…</p>
      ) : null}

      {status === 'no-location' ? (
        <p className="music-nearby-status">
          Allow location access to see playlist artists playing nearby.
        </p>
      ) : null}

      {status === 'empty' ? (
        <p className="music-nearby-status">
          No nearby shows found for artists in this library right now.
        </p>
      ) : null}

      {status === 'error' ? (
        <p className="music-nearby-status">Couldn’t load nearby shows right now.</p>
      ) : null}

      {status === 'unavailable' ? (
        <p className="music-nearby-status">
          Nearby shows will appear once the Passage API is connected.
        </p>
      ) : null}

      {status === 'ok' && items.length > 0 ? (
        <ul className="music-nearby-list">
          {items.map((item) => {
            const place = formatConcertPlace(item.event)
            const distance = formatConcertDistance(item.event.distanceKm)
            const content = (
              <>
                {item.albumArtUrl ? (
                  <img
                    className="music-nearby-art"
                    src={item.albumArtUrl}
                    alt=""
                    width={48}
                    height={48}
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <span className="music-nearby-art music-nearby-art--placeholder" aria-hidden />
                )}
                <span className="music-nearby-body">
                  <span className="music-nearby-artist">{item.artist}</span>
                  <span className="music-nearby-meta">
                    {formatConcertDate(item.event.datetime)}
                    {item.event.venueName ? ` · ${item.event.venueName}` : ''}
                  </span>
                  {place || distance ? (
                    <span className="music-nearby-place">
                      {[place, distance].filter(Boolean).join(' · ')}
                    </span>
                  ) : null}
                </span>
              </>
            )

            return (
              <li key={`${item.artist}-${item.event.id}`}>
                {item.event.url ? (
                  <a
                    className="music-nearby-row"
                    href={item.event.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {content}
                  </a>
                ) : (
                  <div className="music-nearby-row">{content}</div>
                )}
              </li>
            )
          })}
        </ul>
      ) : null}
    </section>
  )
}
