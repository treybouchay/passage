import type { PassageColorScheme, WallpaperColorStyle } from '../lib/passageColorScheme'
import {
  FRAME_STYLES,
  getFramedPreviewScale,
  PRINT_SIZES,
  type FrameStyle,
  type PrintSize,
} from '../lib/framedPrint'
import type { WallpaperSpacing } from '../lib/wallpaperSpacing'
import { PassageWallpaper } from './PassageWallpaper'

interface FramedPrintPreviewProps {
  reference: string
  lines: string[]
  printSize: PrintSize
  frameStyle: FrameStyle
  scheme: PassageColorScheme
  spacing: WallpaperSpacing
  colorStyle: WallpaperColorStyle
  layoutKey: string
  showCaption?: boolean
}

export function FramedPrintPreview({
  reference,
  lines,
  printSize,
  frameStyle,
  scheme,
  spacing,
  colorStyle,
  layoutKey,
  showCaption = true,
}: FramedPrintPreviewProps) {
  const { width, height, label } = PRINT_SIZES[printSize]
  const frame = FRAME_STYLES[frameStyle]
  const artScale = getFramedPreviewScale(printSize)
  const frameBorder = 9
  const matPadding = 12
  const previewArtWidth = Math.round(width * artScale)
  const previewArtHeight = Math.round(height * artScale)
  const previewWidth = previewArtWidth + matPadding * 2 + frameBorder * 2
  const previewHeight = previewArtHeight + matPadding * 2 + frameBorder * 2

  return (
    <div className="framed-print-preview" aria-label={`Framed print preview, ${label}`}>
      <div className="framed-print-scene">
        <div
          className="framed-print-frame"
          style={{
            width: `${previewWidth}px`,
            height: `${previewHeight}px`,
            padding: `${frameBorder}px`,
            background: `linear-gradient(145deg, ${frame.highlight}, ${frame.surface} 55%, ${frame.shadow})`,
          }}
        >
          <div className="framed-print-mat">
            <div
              className="framed-print-art"
              style={{
                width: `${previewArtWidth}px`,
                height: `${previewArtHeight}px`,
              }}
            >
              <div
                className="framed-print-art-inner"
                style={{
                  width: `${width}px`,
                  height: `${height}px`,
                  transform: `scale(${artScale})`,
                }}
              >
                <PassageWallpaper
                  key={layoutKey}
                  reference={reference}
                  lines={lines}
                  printSize={printSize}
                  scheme={scheme}
                  spacing={spacing}
                  colorStyle={colorStyle}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      {showCaption ? (
        <p className="framed-print-caption">
          {label} · {frame.label} frame
        </p>
      ) : null}
    </div>
  )
}
