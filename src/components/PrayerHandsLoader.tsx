import {
  CROSS_PATH,
  CROSS_STROKE,
  CROSS_VIEWBOX,
} from '../icons/crossPaths'

interface PrayerHandsLoaderProps {
  label?: string
}

export function PrayerHandsLoader({
  label = 'Loading…',
}: PrayerHandsLoaderProps) {
  return (
    <div className="prayer-loader" role="status" aria-live="polite" aria-busy="true">
      <svg
        className="prayer-loader-icon prayer-loader-cross"
        viewBox={CROSS_VIEWBOX}
        fill="none"
        aria-hidden="true"
      >
        <path
          d={CROSS_PATH}
          fill="none"
          stroke="currentColor"
          strokeWidth={CROSS_STROKE}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="prayer-loader-label">{label}</span>
    </div>
  )
}
