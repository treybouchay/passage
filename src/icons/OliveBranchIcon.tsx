type IconProps = {
  className?: string
}

/** Olive branch — outline, used for pray action */
export function OliveBranchIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M5 19c2.5-1.5 5-4.5 6.5-7.5S14.5 5 19 3.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <ellipse
        cx="19.2"
        cy="4.2"
        rx="2.4"
        ry="1.15"
        transform="rotate(-35 19.2 4.2)"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <ellipse
        cx="16.6"
        cy="6.6"
        rx="2.35"
        ry="1.1"
        transform="rotate(40 16.6 6.6)"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <ellipse
        cx="14.4"
        cy="8.8"
        rx="2.3"
        ry="1.1"
        transform="rotate(-38 14.4 8.8)"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <ellipse
        cx="12.4"
        cy="11.1"
        rx="2.25"
        ry="1.05"
        transform="rotate(42 12.4 11.1)"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <ellipse
        cx="10.3"
        cy="13.4"
        rx="2.2"
        ry="1.05"
        transform="rotate(-40 10.3 13.4)"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <ellipse
        cx="8.2"
        cy="15.7"
        rx="2.15"
        ry="1"
        transform="rotate(44 8.2 15.7)"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <ellipse
        cx="6.2"
        cy="17.9"
        rx="2.05"
        ry="0.95"
        transform="rotate(-42 6.2 17.9)"
        stroke="currentColor"
        strokeWidth="1.6"
      />
    </svg>
  )
}
