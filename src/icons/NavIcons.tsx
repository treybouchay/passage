type NavIconProps = {
  className?: string
}

const HALO_RAYS = [
  { x1: 12, y1: 6.9, x2: 12, y2: 2.7 },
  { x1: 8.1, y1: 7.1, x2: 4.89, y2: 4.39 },
  { x1: 15.9, y1: 7.1, x2: 19.11, y2: 4.39 },
  { x1: 2.9, y1: 12, x2: -1.3, y2: 12 },
  { x1: 21.1, y1: 12, x2: 25.3, y2: 12 },
  { x1: 8.0, y1: 16.1, x2: 4.85, y2: 18.86 },
  { x1: 16.0, y1: 16.1, x2: 19.15, y2: 18.86 },
]

/** Journal — used for passages */
export function PassagesNavIcon({ className }: NavIconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M8 4.5h9a1.25 1.25 0 0 1 1.25 1.25V19a1.25 1.25 0 0 1-1.25 1.25H8A1.25 1.25 0 0 1 6.75 19V5.75A1.25 1.25 0 0 1 8 4.5z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M9.25 4.5V20.25"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M12.25 9.25h4.25M12.25 12.75h4.25M12.25 16.25h2.75"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinecap="round"
      />
    </svg>
  )
}

/** Pen — used for prayer */
export function PrayerNavIcon({ className }: NavIconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M5 19.25h14"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M14.75 5.25l4 4-9.25 9.25H5.5v-4.25L14.75 5.25z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M13.25 6.75l2 2"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function FavoritesNavIcon({ className }: NavIconProps) {
  return (
    <svg
      className={className}
      viewBox="-2 0 28 24"
      fill="none"
      aria-hidden="true"
    >
      <ellipse
        cx={12}
        cy={12}
        rx={6.75}
        ry={2.35}
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <g>
        {HALO_RAYS.map((ray, i) => (
          <line
            key={i}
            x1={ray.x1}
            y1={ray.y1}
            x2={ray.x2}
            y2={ray.y2}
            stroke="currentColor"
            strokeWidth="1.35"
            strokeLinecap="butt"
          />
        ))}
      </g>
    </svg>
  )
}
