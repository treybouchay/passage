import type { ComponentType } from 'react'
import { FavoritesNavIcon, PassagesNavIcon, PrayerNavIcon } from '../icons/NavIcons'

export type AppView = 'passages' | 'prayer' | 'favorites'

interface SideNavProps {
  view: AppView
  onChange: (view: AppView) => void
}

const ITEMS: {
  id: AppView
  label: string
  Icon: ComponentType<{ className?: string }>
}[] = [
  { id: 'passages', label: 'Passages', Icon: PassagesNavIcon },
  { id: 'prayer', label: 'Prayer', Icon: PrayerNavIcon },
  { id: 'favorites', label: 'Favorites', Icon: FavoritesNavIcon },
]

export function SideNav({ view, onChange }: SideNavProps) {
  return (
    <aside className="side-nav">
      <nav className="side-nav-inner" aria-label="Main">
        <ul className="side-nav-list">
          {ITEMS.map((item) => {
            const isActive = view === item.id
            const { Icon } = item

            return (
              <li key={item.id}>
                <button
                  type="button"
                  className={`side-nav-btn${isActive ? ' side-nav-btn--active' : ''}`}
                  onClick={() => onChange(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  aria-label={item.label}
                  title={item.label}
                >
                  <Icon className="side-nav-icon" />
                  <span className="sr-only">{item.label}</span>
                </button>
              </li>
            )
          })}
        </ul>
      </nav>
    </aside>
  )
}
