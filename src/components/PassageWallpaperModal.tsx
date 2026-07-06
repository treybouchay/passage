import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { Passage } from '../data/passages'
import { downloadWallpaper, renderWallpaperPng } from '../lib/exportWallpaper'
import { canGenerateWallpaper } from '../lib/formatVerseLines'
import { getPassageColorScheme } from '../lib/passageColorScheme'
import {
  PassageWallpaper,
  WALLPAPER_SIZES,
  type WallpaperVariant,
} from './PassageWallpaper'

interface PassageWallpaperModalProps {
  passage: Passage
  colorIndex: number
  onClose: () => void
}

export function PassageWallpaperModal({
  passage,
  colorIndex,
  onClose,
}: PassageWallpaperModalProps) {
  const exportRef = useRef<HTMLDivElement>(null)
  const [variant, setVariant] = useState<WallpaperVariant>('mobile')
  const [isSaving, setIsSaving] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const scheme = getPassageColorScheme(colorIndex)
  const size = WALLPAPER_SIZES[variant]
  const previewScale = Math.min(1, 220 / size.width, 340 / size.height)

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

  async function handleSave() {
    setIsSaving(true)
    setStatus(null)
    try {
      if (!exportRef.current) return
      const blob = await renderWallpaperPng(exportRef.current, scheme.background)
      downloadWallpaper(blob, passage.id, variant)
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
          Scripture only — no reflection or tags. Save a portrait or landscape wallpaper.
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
              <PassageWallpaper passage={passage} variant={variant} scheme={scheme} />
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
          passage={passage}
          variant={variant}
          scheme={scheme}
        />
      </div>
    </div>,
    document.body,
  )
}

interface PassageWallpaperTriggerProps {
  passage: Passage
  colorIndex: number
}

export function PassageWallpaperTrigger({ passage, colorIndex }: PassageWallpaperTriggerProps) {
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
          colorIndex={colorIndex}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </>
  )
}
