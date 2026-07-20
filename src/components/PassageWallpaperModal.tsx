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
import { BibleTranslationTabs } from './BibleTranslationTabs'
import {
  BIBLE_TRANSLATIONS,
  fetchBibleTranslation,
  type BibleTranslation,
} from '../lib/bibleTranslations'
import { PassageWallpaper, type WallpaperVariant } from './PassageWallpaper'
import { DigitalWallpaperPreview } from './DigitalWallpaperPreview'
import { FramedPrintPreview } from './FramedPrintPreview'
import {
  createPrintCheckout,
  checkOrdersApi,
  formatPrice,
  PRINT_PRICES_USD,
  uploadPrintDesign,
  type ShippingAddress,
} from '../lib/ordersApi'
import { FRAME_STYLES, PRINT_SIZES, type FrameStyle, type PrintSize } from '../lib/framedPrint'

type WallpaperTab = 'framed' | 'phone'

const EMPTY_SHIPPING: ShippingAddress = {
  name: '',
  line1: '',
  line2: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'US',
}

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
  const printExportRef = useRef<HTMLDivElement>(null)
  const [translation, setTranslation] = useState<BibleTranslation>('niv')
  const [scriptureText, setScriptureText] = useState(passage.text)
  const [translationLoading, setTranslationLoading] = useState(false)
  const autoLines = useMemo(
    () => formatVerseLines(scriptureText).map((line) => line.text),
    [scriptureText],
  )
  const [tab, setTab] = useState<WallpaperTab>('framed')
  const [variant, setVariant] = useState<WallpaperVariant>('mobile')
  const [printSize, setPrintSize] = useState<PrintSize>('8x10')
  const [frameStyle, setFrameStyle] = useState<FrameStyle>('oak')
  const [colorStyle, setColorStyle] = useState<WallpaperColorStyle>('passage')
  const [lineText, setLineText] = useState(() => linesToText(autoLines))
  const [spacing, setSpacing] = useState<WallpaperSpacing>(DEFAULT_WALLPAPER_SPACING)
  const [isSaving, setIsSaving] = useState(false)
  const [isOrdering, setIsOrdering] = useState(false)
  const [showOrderForm, setShowOrderForm] = useState(false)
  const [apiReady, setApiReady] = useState<boolean | null>(null)
  const [shipping, setShipping] = useState<ShippingAddress>(EMPTY_SHIPPING)
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<string | null>(null)
  const scheme = getPassageColorScheme(colorStyle)
  const previewLines = useMemo(() => textToLines(lineText), [lineText])
  const exportLines = useMemo(() => nonEmptyLines(previewLines), [previewLines])
  const printPrice = PRINT_PRICES_USD[printSize]
  const layoutKey = `${translation}-${lineText}-${spacing.lineGap}-${spacing.referenceGap}-${spacing.logoGap}-${colorStyle}`

  useEffect(() => {
    if (tab !== 'framed') return
    checkOrdersApi().then(setApiReady)
  }, [tab])

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

  useEffect(() => {
    setStatus(null)
  }, [tab])

  function applyAutoLayout(text: string) {
    const lines = formatVerseLines(text).map((line) => line.text)
    setLineText(linesToText(lines))
    setSpacing(DEFAULT_WALLPAPER_SPACING)
  }

  async function handleTranslationChange(next: BibleTranslation) {
    if (next === translation || translationLoading) return

    setTranslation(next)
    setStatus(null)

    if (next === 'niv') {
      setScriptureText(passage.text)
      applyAutoLayout(passage.text)
      return
    }

    setTranslationLoading(true)
    try {
      const text = await fetchBibleTranslation(passage.reference, next)
      setScriptureText(text)
      applyAutoLayout(text)
    } catch {
      setTranslation('niv')
      setScriptureText(passage.text)
      applyAutoLayout(passage.text)
      setStatus(`could not load ${BIBLE_TRANSLATIONS[next].label} — showing NIV`)
    } finally {
      setTranslationLoading(false)
    }
  }

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
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
      })
      if (!exportRef.current) return
      const blob = await renderWallpaperPng(exportRef.current, scheme.background)
      downloadWallpaper(blob, passage.id, variant, colorStyle)
      setStatus('wallpaper saved')
    } catch {
      setStatus('could not save wallpaper — try again')
    } finally {
      setIsSaving(false)
    }
  }

  function updateShipping(key: keyof ShippingAddress, value: string) {
    setShipping((current) => ({ ...current, [key]: value }))
  }

  async function handleOrder() {
    if (exportLines.length === 0) {
      setStatus('add at least one line of text')
      return
    }

    if (!showOrderForm) {
      setShowOrderForm(true)
      return
    }

    if (!email.trim() || !shipping.name.trim() || !shipping.line1.trim() || !shipping.city.trim() || !shipping.postalCode.trim()) {
      setStatus('fill in email and shipping address')
      return
    }

    setIsOrdering(true)
    setStatus(null)
    try {
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
      })
      if (!printExportRef.current) return

      const blob = await renderWallpaperPng(printExportRef.current, scheme.background)
      const { designId } = await uploadPrintDesign(blob, {
        passageId: passage.id,
        reference: passage.reference,
        translation,
        printSize,
        frameStyle,
        colorStyle,
        lines: exportLines,
        spacing,
      })

      const checkout = await createPrintCheckout({
        designId,
        email: email.trim(),
        shipping: {
          ...shipping,
          name: shipping.name.trim(),
          line1: shipping.line1.trim(),
          city: shipping.city.trim(),
          postalCode: shipping.postalCode.trim(),
          country: shipping.country.trim() || 'US',
        },
      })

      if (checkout.checkoutUrl) {
        window.location.href = checkout.checkoutUrl
        return
      }

      if (checkout.redirectUrl) {
        window.location.href = checkout.redirectUrl
        return
      }

      setStatus('order placed')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown error'
      if (message.includes('fetch') || message.includes('Failed')) {
        setStatus('order server not running — run npm run dev:server in another terminal')
      } else {
        setStatus(`could not place order — ${message}`)
      }
    } finally {
      setIsOrdering(false)
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
            create
          </h3>
          <button
            type="button"
            className="wallpaper-modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="wallpaper-tabs" role="tablist" aria-label="Preview type">
          <button
            type="button"
            role="tab"
            id="wallpaper-tab-framed"
            aria-selected={tab === 'framed'}
            aria-controls="wallpaper-panel-framed"
            className={`wallpaper-tab${tab === 'framed' ? ' wallpaper-tab--active' : ''}`}
            onClick={() => setTab('framed')}
          >
            framed
          </button>
          <button
            type="button"
            role="tab"
            id="wallpaper-tab-phone"
            aria-selected={tab === 'phone'}
            aria-controls="wallpaper-panel-phone"
            className={`wallpaper-tab${tab === 'phone' ? ' wallpaper-tab--active' : ''}`}
            onClick={() => setTab('phone')}
          >
            phone
          </button>
        </div>

        <BibleTranslationTabs
          translation={translation}
          onChange={handleTranslationChange}
          disabled={translationLoading}
          className="wallpaper-tabs wallpaper-tabs--version"
        />

        <div
          id={tab === 'framed' ? 'wallpaper-panel-framed' : 'wallpaper-panel-phone'}
          role="tabpanel"
          aria-labelledby={tab === 'framed' ? 'wallpaper-tab-framed' : 'wallpaper-tab-phone'}
          className="wallpaper-tab-panel"
        >
          <div
            className={`wallpaper-preview-wrap wallpaper-preview-wrap--hero${translationLoading ? ' wallpaper-preview-wrap--loading' : ''}`}
          >
            {translationLoading ? (
              <p className="wallpaper-preview-loading">loading translation…</p>
            ) : null}
            {tab === 'framed' ? (
              <FramedPrintPreview
                reference={passage.reference}
                lines={previewLines}
                printSize={printSize}
                frameStyle={frameStyle}
                scheme={scheme}
                spacing={spacing}
                colorStyle={colorStyle}
                layoutKey={layoutKey}
                showCaption={false}
              />
            ) : (
              <DigitalWallpaperPreview
                reference={passage.reference}
                lines={previewLines}
                variant={variant}
                scheme={scheme}
                spacing={spacing}
                colorStyle={colorStyle}
                layoutKey={layoutKey}
              />
            )}
          </div>

          <div className="wallpaper-options">
            {tab === 'framed' ? (
              <>
                <div className="wallpaper-option-row">
                  <span className="wallpaper-option-label">size</span>
                  <div className="wallpaper-option-chips" role="group" aria-label="Print size">
                    {(Object.keys(PRINT_SIZES) as PrintSize[]).map((sizeKey) => (
                      <button
                        key={sizeKey}
                        type="button"
                        className={`wallpaper-chip${printSize === sizeKey ? ' wallpaper-chip--active' : ''}`}
                        onClick={() => setPrintSize(sizeKey)}
                        aria-pressed={printSize === sizeKey}
                      >
                        {PRINT_SIZES[sizeKey].label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="wallpaper-option-row">
                  <span className="wallpaper-option-label">frame</span>
                  <div className="wallpaper-option-chips" role="group" aria-label="Frame style">
                    {(Object.keys(FRAME_STYLES) as FrameStyle[]).map((styleKey) => (
                      <button
                        key={styleKey}
                        type="button"
                        className={`wallpaper-chip${frameStyle === styleKey ? ' wallpaper-chip--active' : ''}`}
                        onClick={() => setFrameStyle(styleKey)}
                        aria-pressed={frameStyle === styleKey}
                      >
                        {FRAME_STYLES[styleKey].label}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="wallpaper-option-row">
                <span className="wallpaper-option-label">size</span>
                <div className="wallpaper-option-chips" role="group" aria-label="Wallpaper size">
                  <button
                    type="button"
                    className={`wallpaper-chip${variant === 'mobile' ? ' wallpaper-chip--active' : ''}`}
                    onClick={() => setVariant('mobile')}
                    aria-pressed={variant === 'mobile'}
                  >
                    mobile
                  </button>
                  <button
                    type="button"
                    className={`wallpaper-chip${variant === 'desktop' ? ' wallpaper-chip--active' : ''}`}
                    onClick={() => setVariant('desktop')}
                    aria-pressed={variant === 'desktop'}
                  >
                    desktop
                  </button>
                </div>
              </div>
            )}

            <div className="wallpaper-option-row">
              <span className="wallpaper-option-label">ink</span>
              <div className="wallpaper-option-chips" role="group" aria-label="Ink color">
                <button
                  type="button"
                  className={`wallpaper-chip${colorStyle === 'passage' ? ' wallpaper-chip--active' : ''}`}
                  onClick={() => setColorStyle('passage')}
                  aria-pressed={colorStyle === 'passage'}
                >
                  green
                </button>
                <button
                  type="button"
                  className={`wallpaper-chip${colorStyle === 'mono' ? ' wallpaper-chip--active' : ''}`}
                  onClick={() => setColorStyle('mono')}
                  aria-pressed={colorStyle === 'mono'}
                >
                  black
                </button>
              </div>
            </div>
          </div>

          {tab === 'framed' && showOrderForm ? (
            <div className="wallpaper-checkout">
              <p className="wallpaper-checkout-title">shipping</p>
              <div className="wallpaper-order-form">
                <label className="wallpaper-order-field">
                  <span>email</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                  />
                </label>
                <label className="wallpaper-order-field">
                  <span>name</span>
                  <input
                    type="text"
                    value={shipping.name}
                    onChange={(e) => updateShipping('name', e.target.value)}
                    autoComplete="name"
                  />
                </label>
                <label className="wallpaper-order-field">
                  <span>address</span>
                  <input
                    type="text"
                    value={shipping.line1}
                    onChange={(e) => updateShipping('line1', e.target.value)}
                    autoComplete="address-line1"
                  />
                </label>
                <label className="wallpaper-order-field">
                  <span>city</span>
                  <input
                    type="text"
                    value={shipping.city}
                    onChange={(e) => updateShipping('city', e.target.value)}
                    autoComplete="address-level2"
                  />
                </label>
                <div className="wallpaper-order-row">
                  <label className="wallpaper-order-field">
                    <span>state</span>
                    <input
                      type="text"
                      value={shipping.state}
                      onChange={(e) => updateShipping('state', e.target.value)}
                      autoComplete="address-level1"
                    />
                  </label>
                  <label className="wallpaper-order-field">
                    <span>zip</span>
                    <input
                      type="text"
                      value={shipping.postalCode}
                      onChange={(e) => updateShipping('postalCode', e.target.value)}
                      autoComplete="postal-code"
                    />
                  </label>
                </div>
              </div>
            </div>
          ) : null}

          <div className="wallpaper-modal-actions wallpaper-modal-actions--stacked">
            {tab === 'framed' ? (
              <>
                {apiReady === false ? (
                  <p className="wallpaper-order-hint">
                    restart dev server — <code>npm run dev</code> starts the order API too
                  </p>
                ) : apiReady ? (
                  <p className="wallpaper-order-hint">test mode — no real charge</p>
                ) : null}
                <button
                  type="button"
                  className="prayer-save-btn wallpaper-save-btn"
                  onClick={handleOrder}
                  disabled={isOrdering || translationLoading || apiReady === false}
                >
                  {isOrdering
                    ? 'processing…'
                    : showOrderForm
                      ? `place test order · ${formatPrice(printPrice)}`
                      : `order print · ${formatPrice(printPrice)}`}
                </button>
              </>
            ) : (
              <button
                type="button"
                className="prayer-save-btn wallpaper-save-btn"
                onClick={handleSave}
                disabled={isSaving || translationLoading}
              >
                {isSaving ? 'saving…' : 'save wallpaper'}
              </button>
            )}
          </div>
        </div>

        <details className="wallpaper-customize">
          <summary className="wallpaper-customize-summary">customize layout</summary>
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
                rows={5}
                spellCheck={false}
              />
              <p className="wallpaper-editor-hint">One line per row.</p>
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
        </details>

        {status ? <p className="wallpaper-modal-status">{status}</p> : null}
      </div>

      <div className="wallpaper-export-target" aria-hidden="true">
        <PassageWallpaper
          ref={exportRef}
          key={`export-${layoutKey}-${variant}`}
          reference={passage.reference}
          lines={exportLines}
          variant={variant}
          scheme={scheme}
          spacing={spacing}
          colorStyle={colorStyle}
        />
        <PassageWallpaper
          ref={printExportRef}
          key={`print-export-${layoutKey}-${printSize}`}
          reference={passage.reference}
          lines={exportLines}
          printSize={printSize}
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
