import { forwardRef } from 'react'
import type { PassageColorScheme, WallpaperColorStyle } from '../lib/passageColorScheme'
import type { WallpaperSpacing } from '../lib/wallpaperSpacing'

export const WALLPAPER_SIZES = {
  mobile: { width: 1080, height: 1920 },
  desktop: { width: 2560, height: 1440 },
} as const

export type WallpaperVariant = keyof typeof WALLPAPER_SIZES

interface PassageWallpaperProps {
  reference: string
  lines: string[]
  variant: WallpaperVariant
  scheme: PassageColorScheme
  spacing: WallpaperSpacing
  colorStyle?: WallpaperColorStyle
}

export const PassageWallpaper = forwardRef<HTMLDivElement, PassageWallpaperProps>(
  function PassageWallpaper(
    { reference, lines, variant, scheme, spacing, colorStyle = 'passage' },
    ref,
  ) {
    const { width, height } = WALLPAPER_SIZES[variant]

    return (
      <div
        ref={ref}
        className={`passage-wallpaper passage-wallpaper--${variant}${colorStyle === 'mono' ? ' passage-wallpaper--mono' : ''}`}
        style={{
          width: `${width}px`,
          height: `${height}px`,
          backgroundColor: scheme.background,
          color: scheme.text,
          ['--wallpaper-accent' as string]: scheme.accent,
          ['--wallpaper-reference' as string]: scheme.reference,
          ['--wallpaper-line-gap' as string]: `${spacing.lineGap}px`,
          ['--wallpaper-reference-gap' as string]: `${spacing.referenceGap}px`,
          ['--wallpaper-logo-gap' as string]: `${spacing.logoGap}px`,
        }}
      >
        <div className="passage-wallpaper-body">
          <div className="passage-wallpaper-content">
            <div className="passage-wallpaper-quote">
              <div className="passage-wallpaper-verse" aria-label={lines.join(' ')}>
                {lines.map((line, lineIndex) => (
                  <p key={`${lineIndex}-${line}`} className="passage-wallpaper-line">
                    {line || '\u00a0'}
                  </p>
                ))}
              </div>
              <p className="passage-wallpaper-ref">{reference}</p>
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
