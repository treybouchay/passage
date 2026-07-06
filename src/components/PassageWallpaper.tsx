import { forwardRef } from 'react'
import type { Passage } from '../data/passages'
import { formatVerseLines } from '../lib/formatVerseLines'
import type { PassageColorScheme } from '../lib/passageColorScheme'

export const WALLPAPER_SIZES = {
  mobile: { width: 1080, height: 1920 },
  desktop: { width: 2560, height: 1440 },
} as const

export type WallpaperVariant = keyof typeof WALLPAPER_SIZES

interface PassageWallpaperProps {
  passage: Passage
  variant: WallpaperVariant
  scheme: PassageColorScheme
}

export const PassageWallpaper = forwardRef<HTMLDivElement, PassageWallpaperProps>(
  function PassageWallpaper({ passage, variant, scheme }, ref) {
    const { width, height } = WALLPAPER_SIZES[variant]
    const lines = formatVerseLines(passage.text)

    return (
      <div
        ref={ref}
        className={`passage-wallpaper passage-wallpaper--${variant}`}
        style={{
          width: `${width}px`,
          height: `${height}px`,
          backgroundColor: scheme.background,
          color: scheme.text,
          ['--wallpaper-accent' as string]: scheme.accent,
          ['--wallpaper-reference' as string]: scheme.reference,
        }}
      >
        <div className="passage-wallpaper-body">
          <div className="passage-wallpaper-content">
            <div className="passage-wallpaper-quote">
              <div className="passage-wallpaper-verse" aria-label={passage.text}>
                {lines.map((line, lineIndex) => (
                  <p key={lineIndex} className="passage-wallpaper-line">
                    {line.text}
                  </p>
                ))}
              </div>
              <p className="passage-wallpaper-ref">{passage.reference}</p>
            </div>
            <div className="passage-wallpaper-brand">
              <img
                src="/icons/logo-hands-figma.svg"
                alt=""
                className="passage-wallpaper-logo"
                width={variant === 'mobile' ? 22 : 28}
                height={variant === 'mobile' ? 38 : 48}
                draggable={false}
              />
              <span className="passage-wallpaper-wordmark">passage</span>
            </div>
          </div>
        </div>
      </div>
    )
  },
)
