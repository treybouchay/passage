import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { Passage } from '../data/passages'
import { downloadWallpaper, renderWallpaperPng } from '../lib/exportWallpaper'
import { canGenerateWallpaper, formatVerseLines } from '../lib/formatVerseLines'
import { getPassageColorScheme, type WallpaperColorStyle } from '../lib/passageColorScheme'
import {
  DEFAULT_WALLPAPER_SPACING,
  type WallpaperSpacing,
} from '../lib/wallpaperSpacing'
import {
  PassageWallpaper,
  WALLPAPER_SIZES,
  type WallpaperVariant,
} from './PassageWallpaper'

function linesToText(lines: string[]): string {
  return lines.join('\n')
}

function textToLines(text: string): string[] {
  return text.split(/\r?\n/).map((line) => line.trim())
}

function nonEmptyLines(lines: string[]): string[] {
  return lines.filter(Boolean)
}

interface PassageWallpaperModalProps {
  passage: Passage
  onClose: () => void
}

export function PassageWallpaperModal({
  passage,
  onClose,
}: PassageWallpaperModalProps) {
  const exportRef = useRef<HTMLDivElement>(null)
  const autoLines = useMemo(
    () => formatVerseLines(passage.text).map((line) => line.text),
    [passage.text],
  )
  const [variant, setVariant] = useState<WallpaperVariant>('mobile')
  const [colorStyle, setColorStyle] = useState<WallpaperColorStyle>('passage')
  const [lineText, setLineText] = useState(() => linesToText(autoLines))
  const [spacing, setSpacing] = useState<WallpaperSpacing>(DEFAULT_WALLPAPER_SPACING)
  const [isSaving, setIsSaving] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const scheme = getPassageColorScheme(colorStyle)
  const size = WALLPAPER_SIZES[variant]
  const previewScale = Math.min(1, 220 / size.width, 340 / size.height)
  const previewLines = useMemo(() => textToLines(lineText), [lineText])
  const exportLines = useMemo(() => nonEmptyLines(previewLines), [previewLines])

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [])

  function handleResetLayout() {
    setLineText(linesToText(autoLines))
    setSpacing(DEFAULT_WALLPAPER_SPACING)
  }

  function handleSpacingChange(key: keyof WallpaperSpacing, value: number) {
    setSpacing((current) => ({ ...current, [key]: value }))
  }

  async function handleSave() {
    if (exportLines.length === 0) {
      setStatus('add at least one line of text')
      return
    }

    setIsSaving(true)
    setStatus(null)
    try {
      if (!exportRef.current) return
      const blob = await renderWallpaperPng(exportRef.current, scheme.background)
      downloadWallpaper(blob, passage.id, variant, colorStyle)
      setStatus('wallpaper saved to your device')
    } catch {
      setStatus('could not save wallpaper — try again')
    } finally {
      setIsSaving(false)
    }
  }

  return createPortal(
    <div className="wallpaper-modal" role="presentation" onClick={onClose}>
      <div
        className="wallpaper-modal-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="wallpaper-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="wallpaper-modal-header">
          <h3 id="wallpaper-modal-title" className="wallpaper-modal-title">
            wallpaper
          </h3>
          <button
            type="button"
            className="wallpaper-modal-close"
            onClick={onClose}
            aria-label="Close wallpaper"
          >
            ×
          </button>
        </div>

        <p className="wallpaper-modal-lead">
          Scripture only — no reflection or tags. Edit line breaks and spacing, then save.
        </p>

        <div className="wallpaper-variant-toggle" role="group" aria-label="Wallpaper size">
          <button
            type="button"
            className={`wallpaper-variant-btn${variant === 'mobile' ? ' wallpaper-variant-btn--active' : ''}`}
            onClick={() => setVariant('mobile')}
            aria-pressed={variant === 'mobile'}
          >
            mobile
          </button>
          <button
            type="button"
            className={`wallpaper-variant-btn${variant === 'desktop' ? ' wallpaper-variant-btn--active' : ''}`}
            onClick={() => setVariant('desktop')}
            aria-pressed={variant === 'desktop'}
          >
            desktop
          </button>
        </div>

        <div className="wallpaper-variant-toggle" role="group" aria-label="Wallpaper color">
          <button
            type="button"
            className={`wallpaper-variant-btn${colorStyle === 'passage' ? ' wallpaper-variant-btn--active' : ''}`}
            onClick={() => setColorStyle('passage')}
            aria-pressed={colorStyle === 'passage'}
          >
            green
          </button>
          <button
            type="button"
            className={`wallpaper-variant-btn${colorStyle === 'mono' ? ' wallpaper-variant-btn--active' : ''}`}
            onClick={() => setColorStyle('mono')}
            aria-pressed={colorStyle === 'mono'}
          >
            black
          </button>
        </div>

        <div className="wallpaper-editor">
          <div className="wallpaper-editor-block">
            <label className="wallpaper-editor-label" htmlFor="wallpaper-line-editor">
              lines
            </label>
            <textarea
              id="wallpaper-line-editor"
              className="wallpaper-line-editor"
              value={lineText}
              onChange={(event) => setLineText(event.target.value)}
              rows={6}
              spellCheck={false}
            />
            <p className="wallpaper-editor-hint">One line per row. Press enter to add a break.</p>
          </div>

          <fieldset className="wallpaper-spacing-fields">
            <legend className="wallpaper-editor-label">spacing (px)</legend>
            <label className="wallpaper-spacing-field">
              <span>between lines</span>
              <input
                type="number"
                min={0}
                max={120}
                value={spacing.lineGap}
                onChange={(event) =>
                  handleSpacingChange('lineGap', Number(event.target.value) || 0)
                }
              />
            </label>
            <label className="wallpaper-spacing-field">
              <span>before reference</span>
              <input
                type="number"
                min={0}
                max={400}
                value={spacing.referenceGap}
                onChange={(event) =>
                  handleSpacingChange('referenceGap', Number(event.target.value) || 0)
                }
              />
            </label>
            <label className="wallpaper-spacing-field">
              <span>before logo</span>
              <input
                type="number"
                min={0}
                max={600}
                value={spacing.logoGap}
                onChange={(event) =>
                  handleSpacingChange('logoGap', Number(event.target.value) || 0)
                }
              />
            </label>
          </fieldset>

          <button type="button" className="wallpaper-reset-btn" onClick={handleResetLayout}>
            reset layout
          </button>
        </div>

        <div className="wallpaper-preview-wrap">
          <div
            className="wallpaper-preview"
            style={{
              width: `${Math.round(size.width * previewScale)}px`,
              height: `${Math.round(size.height * previewScale)}px`,
            }}
          >
            <div
              className="wallpaper-preview-inner"
              style={{
                width: `${size.width}px`,
                height: `${size.height}px`,
                transform: `scale(${previewScale})`,
              }}
            >
              <PassageWallpaper
                key={lineText}
                reference={passage.reference}
                lines={previewLines}
                variant={variant}
                scheme={scheme}
                spacing={spacing}
                colorStyle={colorStyle}
              />
            </div>
          </div>
        </div>

        <div className="wallpaper-modal-actions">
          <button
            type="button"
            className="prayer-save-btn"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? 'saving…' : 'save wallpaper'}
          </button>
        </div>

        {status ? <p className="wallpaper-modal-status">{status}</p> : null}
      </div>

      <div className="wallpaper-export-target" aria-hidden="true">
        <PassageWallpaper
          ref={exportRef}
          reference={passage.reference}
          lines={exportLines}
          variant={variant}
          scheme={scheme}
          spacing={spacing}
          colorStyle={colorStyle}
        />
      </div>
    </div>,
    document.body,
  )
}

interface PassageWallpaperTriggerProps {
  passage: Passage
}

export function PassageWallpaperTrigger({ passage }: PassageWallpaperTriggerProps) {
  const [open, setOpen] = useState(false)

  if (!canGenerateWallpaper(passage.text)) {
    return null
  }

  return (
    <>
      <button
        type="button"
        className="prayer-text-btn"
        onClick={() => setOpen(true)}
      >
        wallpaper
      </button>
      {open ? (
        <PassageWallpaperModal
          passage={passage}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </>
  )
}
