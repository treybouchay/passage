import { useEffect, useState } from 'react'
import type { Passage } from '../data/passages'
import { useBibleTranslation } from '../lib/bibleTranslationContext'

interface PassageTextProps {
  passage: Passage
  className?: string
}

export function PassageText({ passage, className = 'passage-text' }: PassageTextProps) {
  const { translation, getDisplayText } = useBibleTranslation()
  const [text, setText] = useState(passage.text)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let cancelled = false

    if (translation === 'niv') {
      setText(passage.text)
      setLoading(false)
      return
    }

    setLoading(true)
    getDisplayText(passage)
      .then((nextText) => {
        if (!cancelled) {
          setText(nextText)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setText(passage.text)
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [passage, translation, getDisplayText])

  return (
    <blockquote className={`${className}${loading ? ' passage-text--loading' : ''}`}>
      {text}
    </blockquote>
  )
}
