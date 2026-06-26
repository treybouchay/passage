import { HaloIcon } from '../icons/HaloIcon'

interface FavoriteButtonProps {
  active: boolean
  onToggle: () => void
  label?: string
}

export function FavoriteButton({ active, onToggle, label }: FavoriteButtonProps) {
  return (
    <button
      type="button"
      className={`favorite-btn${active ? ' favorite-btn--active' : ''}`}
      onClick={onToggle}
      aria-label={label ?? (active ? 'Remove from favorites' : 'Add to favorites')}
      aria-pressed={active}
    >
      <HaloIcon active={active} />
    </button>
  )
}
