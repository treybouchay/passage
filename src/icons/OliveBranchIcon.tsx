type IconProps = {
  className?: string
}

/** Olive branch (right sprig) — filled silhouette via CSS mask + currentColor */
export function OliveBranchIcon({ className }: IconProps) {
  return <span className={className} aria-hidden="true" />
}
