type IconProps = {
  className?: string
}

export function PrayerHandsIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 48 64"
      fill="none"
      aria-hidden="true"
    >
      {/* Left hand */}
      <path
        d="M 24 58
           C 17 58 12 53 12 46
           C 12 39 14 32 17 26
           C 18 23 20 20 21 18
           L 19 12
           M 21 18 L 21 10
           M 17 26 L 14 20
           M 14 32 L 11 26"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Right hand */}
      <path
        d="M 24 58
           C 31 58 36 53 36 46
           C 36 39 34 32 31 26
           C 30 23 28 20 27 18
           L 29 12
           M 27 18 L 27 10
           M 31 26 L 34 20
           M 34 32 L 37 26"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
