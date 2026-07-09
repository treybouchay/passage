import { forwardRef } from 'react'
import type { PassageColorScheme, WallpaperColorStyle } from '../lib/passageColorScheme'
import { PRINT_SIZES, type PrintSize } from '../lib/framedPrint'
import type { WallpaperSpacing } from '../lib/wallpaperSpacing'

export const WALLPAPER_SIZES = {
  mobile: { width: 1080, height: 1920 },
  desktop: { width: 2560, height: 1440 },
} as const

export type WallpaperVariant = keyof typeof WALLPAPER_SIZES

interface PassageWallpaperProps {
  reference: string
  lines: string[]
  variant?: WallpaperVariant
  printSize?: PrintSize
  scheme: PassageColorScheme
  spacing: WallpaperSpacing
  colorStyle?: WallpaperColorStyle
}

export const PassageWallpaper = forwardRef<HTMLDivElement, PassageWallpaperProps>(
  function PassageWallpaper(
    { reference, lines, variant, printSize, scheme, spacing, colorStyle = 'passage' },
    ref,
  ) {
    if (!variant && !printSize) {
      throw new Error('PassageWallpaper requires variant or printSize')
    }

    const { width, height } = printSize ? PRINT_SIZES[printSize] : WALLPAPER_SIZES[variant!]
    const layoutClass = printSize
      ? `passage-wallpaper--print passage-wallpaper--print-${printSize}`
      : `passage-wallpaper--${variant}`

    return (
      <div
        ref={ref}
        className={`passage-wallpaper ${layoutClass}${colorStyle === 'mono' ? ' passage-wallpaper--mono' : ''}`}
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
              <div
                className="passage-wallpaper-verse"
                aria-label={lines.join(' ')}
                style={{ gap: `${spacing.lineGap}px` }}
              >
                {lines.map((line, lineIndex) => (
                  <p key={`${lineIndex}-${line}`} className="passage-wallpaper-line">
                    {line || '\u00a0'}
                  </p>
                ))}
              </div>
              <p
                className="passage-wallpaper-ref"
                style={{ marginTop: `${spacing.referenceGap}px` }}
              >
                {reference}
              </p>
            </div>
            <div
              className="passage-wallpaper-brand"
              style={{ marginTop: `${spacing.logoGap}px` }}
            >
              <img
                src="/icons/logo-hands-figma.svg"
                alt=""
                className="passage-wallpaper-logo"
                width={printSize ? 20 : variant === 'mobile' ? 22 : 28}
                height={printSize ? 34 : variant === 'mobile' ? 38 : 48}
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
