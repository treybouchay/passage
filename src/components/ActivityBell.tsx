import { useEffect, useRef } from 'react'
import type { AppView } from './SideNav'
import {
  FavoritesNavIcon,
  MusicNavIcon,
  PassagesNavIcon,
  PrayerNavIcon,
} from '../icons/NavIcons'
import {
  ACTIVITY_EXAMPLES,
  activityKindAriaLabel,
  formatActivityWhen,
  type ActivityItem,
  type ActivityKind,
} from '../lib/activityFeed'
import { getSongById } from '../lib/userContent'

const showDevActivityTools = import.meta.env.DEV

function songArtUrl(kind: ActivityKind, entityId?: string): string | undefined {
  if (kind !== 'favorite-song') return undefined
  if (!entityId) return undefined
  return getSongById(entityId)?.albumArtUrl
}

interface ActivityBellProps {
  activities: ActivityItem[]
  unreadCount: number
  open: boolean
  onToggle: () => void
  onClose: () => void
  onMarkAllRead: () => void
  onNavigate: (view: AppView) => void
  onSimulateExamples?: () => void
}

function BellIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M9.5 18.75h5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M6.75 9.25a5.25 5.25 0 0 1 10.5 0c0 4.1 1.65 5.85 2.45 6.75a1 1 0 0 1-.75 1.75H5.05a1 1 0 0 1-.75-1.75c.8-.9 2.45-2.65 2.45-6.75z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ActivityKindIcon({ kind }: { kind: ActivityKind }) {
  const className = 'activity-bell-kind-icon'

  switch (kind) {
    case 'passage-prayer':
      return <PrayerNavIcon className={className} />
    case 'new-song':
    case 'favorite-song':
      return <MusicNavIcon className={className} />
    case 'favorite-passage':
      return <PassagesNavIcon className={className} />
    default:
      return <FavoritesNavIcon className={className} />
  }
}

function ActivityRowContent({
  kind,
  title,
  detail,
  entityId,
  when,
  whenIso,
  unread = false,
}: {
  kind: ActivityKind
  title: string
  detail: string
  entityId?: string
  when?: string
  whenIso?: string
  unread?: boolean
}) {
  const albumArtUrl = songArtUrl(kind, entityId)
  const showDetailArt = Boolean(albumArtUrl)

  return (
    <div className="activity-bell-row-body">
      <span
        className={`activity-bell-row-icon${unread ? ' activity-bell-row-icon--unread' : ''}`}
        role="img"
        aria-label={activityKindAriaLabel(kind)}
      >
        <ActivityKindIcon kind={kind} />
      </span>
      <div className="activity-bell-item-head">
        <span className={`activity-bell-item-title${unread ? ' activity-bell-item-title--unread' : ''}`}>
          {title}
        </span>
        {when ? (
          <time className="activity-bell-when" dateTime={whenIso}>
            {when}
          </time>
        ) : null}
      </div>
      <div className="activity-bell-item-detail-row">
        {showDetailArt ? (
          <img
            className="activity-bell-detail-art"
            src={albumArtUrl}
            alt=""
            width={28}
            height={28}
            loading="lazy"
            decoding="async"
          />
        ) : null}
        <span className="activity-bell-item-detail">{detail}</span>
      </div>
    </div>
  )
}

export function ActivityBell({
  activities,
  unreadCount,
  open,
  onToggle,
  onClose,
  onMarkAllRead,
  onNavigate,
  onSimulateExamples,
}: ActivityBellProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const devSimulate = showDevActivityTools ? onSimulateExamples : undefined

  useEffect(() => {
    if (!open) return

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node
      if (panelRef.current && !panelRef.current.contains(target)) {
        onClose()
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('mousedown', handlePointerDown)
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('mousedown', handlePointerDown)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, onClose])

  function handleSelect(item: ActivityItem) {
    onNavigate(item.targetView)
    onClose()
  }

  return (
    <div className="activity-bell" ref={panelRef}>
      <button
        type="button"
        className={`activity-bell-btn${open ? ' activity-bell-btn--open' : ''}`}
        onClick={onToggle}
        aria-expanded={open}
        aria-controls="activity-bell-panel"
        aria-label={
          unreadCount > 0
            ? `Activity, ${unreadCount} unread`
            : 'Activity'
        }
      >
        <BellIcon className="activity-bell-icon" />
        {unreadCount > 0 ? (
          <span className="activity-bell-badge" aria-hidden="true">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          id="activity-bell-panel"
          className="activity-bell-panel"
          role="region"
          aria-label="Recent activity"
        >
          <div className="activity-bell-panel-header">
            <h2 className="activity-bell-panel-title">activity</h2>
            {activities.length > 0 ? (
              <button type="button" className="activity-bell-clear" onClick={onMarkAllRead}>
                mark read
              </button>
            ) : null}
          </div>

          {activities.length === 0 ? (
            <div className="activity-bell-empty-wrap">
              <p className="activity-bell-empty">
                {showDevActivityTools
                  ? 'Your passage prayers and favorites will show up here.'
                  : 'Passage prayers you write and passages or songs you favorite will show up here.'}
              </p>
              {showDevActivityTools ? (
                <>
                  <p className="activity-bell-section-label">examples</p>
                  <ul className="activity-bell-examples" aria-label="Activity examples">
                    {ACTIVITY_EXAMPLES.map((example) => (
                      <li key={`${example.kind}-${example.title}`}>
                        <div className="activity-bell-row activity-bell-row--example">
                          <ActivityRowContent
                            kind={example.kind}
                            title={example.title}
                            detail={example.detail}
                            entityId={example.entityId}
                          />
                        </div>
                      </li>
                    ))}
                  </ul>
                  {devSimulate ? (
                    <button
                      type="button"
                      className="activity-bell-simulate"
                      onClick={devSimulate}
                    >
                      load examples
                    </button>
                  ) : null}
                </>
              ) : null}
            </div>
          ) : (
            <ul className="activity-bell-list">
              {activities.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    className="activity-bell-row activity-bell-row--button"
                    onClick={() => handleSelect(item)}
                  >
                    <ActivityRowContent
                      kind={item.kind}
                      title={item.title}
                      detail={item.detail}
                      entityId={item.entityId}
                      when={formatActivityWhen(item.at)}
                      whenIso={new Date(item.at).toISOString()}
                      unread={!item.read}
                    />
                  </button>
                </li>
              ))}
            </ul>
          )}

          {activities.length > 0 && devSimulate ? (
            <button
              type="button"
              className="activity-bell-simulate activity-bell-simulate--footer"
              onClick={devSimulate}
            >
              reload examples
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
