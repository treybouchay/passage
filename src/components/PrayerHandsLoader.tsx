import { useEffect, useState } from 'react'
import {
  CROSS_PATH,
  CROSS_STROKE,
  CROSS_VIEWBOX,
} from '../icons/crossPaths'

const LOADER_SAYINGS = [
  'Fetching blessings…',
  'Cleaning the pews…',
  'Warming the choir loft…',
  'Folding the bulletins…',
  'Lighting the candles…',
  'Tuning the organ…',
  'Gathering the flock…',
  'Polishing the collection plate…',
  'Straightening hymnals…',
  'Brewing the fellowship coffee…',
  'Dusting the stained glass…',
  'Counting the loaves…',
  'Opening the good book…',
  'Softening the altar cushions…',
  'Finding the right key…',
] as const

function pickSaying(exclude?: string): string {
  const options = exclude
    ? LOADER_SAYINGS.filter((saying) => saying !== exclude)
    : [...LOADER_SAYINGS]
  return options[Math.floor(Math.random() * options.length)] ?? LOADER_SAYINGS[0]
}

interface PrayerHandsLoaderProps {
  label?: string
  rotate?: boolean
}

export function PrayerHandsLoader({
  label,
  rotate = true,
}: PrayerHandsLoaderProps) {
  const [saying, setSaying] = useState(() => label ?? pickSaying())

  useEffect(() => {
    if (label || !rotate) return

    const timer = window.setInterval(() => {
      setSaying((current) => pickSaying(current))
    }, 900)

    return () => window.clearInterval(timer)
  }, [label, rotate])

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
      <span className="prayer-loader-label" key={saying}>
        {saying}
      </span>
    </div>
  )
}
