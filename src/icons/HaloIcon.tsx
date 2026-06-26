interface HaloIconProps {
  active?: boolean
}

const RAY_LENGTH = 4.2

/** Inner endpoints sit outside the ellipse; each ray shares the same length. */
const RAYS = [
  { x1: 12, y1: 6.9, x2: 12, y2: 6.9 - RAY_LENGTH },
  { x1: 8.1, y1: 7.1, x2: 4.89, y2: 4.39 },
  { x1: 15.9, y1: 7.1, x2: 19.11, y2: 4.39 },
  { x1: 2.9, y1: 12, x2: 2.9 - RAY_LENGTH, y2: 12 },
  { x1: 21.1, y1: 12, x2: 21.1 + RAY_LENGTH, y2: 12 },
  { x1: 8.0, y1: 16.1, x2: 4.85, y2: 18.86 },
  { x1: 16.0, y1: 16.1, x2: 19.15, y2: 18.86 },
]

export function HaloIcon({ active = false }: HaloIconProps) {
  return (
    <svg
      className={`halo-icon${active ? ' halo-icon--active' : ''}`}
      viewBox="-2 0 28 24"
      width={22}
      height={22}
      fill="none"
      aria-hidden="true"
    >
      <ellipse cx={12} cy={12} rx={6.75} ry={2.35} className="halo-icon__ring" />
      <g className="halo-icon__rays">
        {RAYS.map((ray, i) => (
          <line
            key={i}
            x1={ray.x1}
            y1={ray.y1}
            x2={ray.x2}
            y2={ray.y2}
            className="halo-icon__ray"
            strokeLinecap="butt"
          />
        ))}
      </g>
    </svg>
  )
}
