import { useEffect, useState } from 'react'
import {
  CROSS_PATH,
  CROSS_STROKE,
  CROSS_VIEWBOX,
} from '../icons/crossPaths'

const LOADER_SAYINGS = [
  'fetching blessings…',
  'cleaning the pews…',
  'warming the choir loft…',
  'folding the bulletins…',
  'lighting the candles…',
  'tuning the organ…',
  'gathering the flock…',
  'polishing the collection plate…',
  'straightening hymnals…',
  'brewing the fellowship coffee…',
  'dusting the stained glass…',
  'counting the loaves…',
  'opening the good book…',
  'softening the altar cushions…',
  'finding the right key…',
  'shaking out the prayer rugs…',
  'watering the lilies…',
  'aligning the processional…',
  'quieting the nursery…',
  'refilling the holy water…',
  'unrolling the runner…',
  'waking the ushers…',
  'sorting the tithe envelopes…',
  'fluffing the choir robes…',
  'checking the baptism schedule…',
  'setting out communion trays…',
  'mending the shepherd’s crook…',
  'whispering amen…',
  'stacking the folding chairs…',
  'ringing in the hour…',
  'brushing off the lectern…',
  'saving you a seat…',
  'asking for patience…',
  'practicing the doxology…',
  'keeping the vigil lamp lit…',
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
