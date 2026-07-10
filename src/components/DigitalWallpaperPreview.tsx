import type { CSSProperties } from 'react'
import type { PassageColorScheme, WallpaperColorStyle } from '../lib/passageColorScheme'
import type { WallpaperSpacing } from '../lib/wallpaperSpacing'
import { PassageWallpaper, WALLPAPER_SIZES, type WallpaperVariant } from './PassageWallpaper'

interface DigitalWallpaperPreviewProps {
  reference: string
  lines: string[]
  variant: WallpaperVariant
  scheme: PassageColorScheme
  spacing: WallpaperSpacing
  colorStyle: WallpaperColorStyle
  layoutKey: string
}

export function DigitalWallpaperPreview({
  reference,
  lines,
  variant,
  scheme,
  spacing,
  colorStyle,
  layoutKey,
}: DigitalWallpaperPreviewProps) {
  const size = WALLPAPER_SIZES[variant]
  const maxWidth = variant === 'mobile' ? 168 : 240
  const previewScale = Math.min(1, maxWidth / size.width, 320 / size.height)
  const previewWidth = Math.round(size.width * previewScale)
  const previewHeight = Math.round(size.height * previewScale)

  const screenStyle = {
    width: `${previewWidth}px`,
    height: `${previewHeight}px`,
  } satisfies CSSProperties

  const artStyle = {
    width: `${size.width}px`,
    height: `${size.height}px`,
    transform: `scale(${previewScale})`,
  } satisfies CSSProperties

  return (
    <div
      className={`digital-preview digital-preview--${variant}`}
      aria-label={`${variant} wallpaper preview`}
    >
      <div className="digital-preview-screen" style={screenStyle}>
        <div className="digital-preview-art" style={artStyle}>
          <PassageWallpaper
            key={layoutKey}
            reference={reference}
            lines={lines}
            variant={variant}
            scheme={scheme}
            spacing={spacing}
            colorStyle={colorStyle}
          />
        </div>
      </div>
    </div>
  )
}
