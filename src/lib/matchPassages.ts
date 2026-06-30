import { passages, type Passage } from '../data/passages'

export interface MatchedPassage extends Passage {
  score: number
  matchedTerms: string[]
}

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been',
  'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
  'could', 'should', 'may', 'might', 'must', 'shall', 'can', 'need',
  'i', 'me', 'my', 'myself', 'we', 'our', 'you', 'your', 'he', 'she',
  'it', 'they', 'them', 'this', 'that', 'these', 'those', 'am', 'im',
  "i'm", 'feeling', 'feel', 'feels', 'felt', 'really', 'very', 'so',
  'just', 'about', 'right', 'now', 'today', 'lot', 'much', 'some',
])

const POSITIVE_TERMS = new Set([
  'happy', 'happiness', 'joy', 'joyful', 'glad', 'grateful', 'gratitude',
  'thankful', 'thanks', 'blessed', 'celebrate', 'celebrating', 'content',
  'contentment', 'excited', 'wonderful', 'amazing', 'good', 'great',
  'peaceful', 'calm', 'rejoice', 'praise', 'thanksgiving',
])

/** Diverse fallbacks when nothing matches — avoids recycling anxiety/peace verses */
const GENERAL_FALLBACK_IDS = [
  'jer-29-11',
  'rom-8-38-39',
  'isa-40-31',
  'lam-3-22-23',
  'matt-11-28-30',
  'psalm-139-13-14',
  'prov-3-5-6',
  'heb-11-1',
]

const POSITIVE_FALLBACK_IDS = [
  'phil-4-4',
  'psalm-100',
  'psalm-16-11',
  '1-thess-5-16-18',
  'neh-8-10',
  'psalm-126-3',
  'phil-4-11-12',
  'rom-15-13',
]

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s']/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 1 && !STOP_WORDS.has(word))
}

function getPhrases(text: string): string[] {
  const normalized = text.toLowerCase()
  const allKeywords = passages.flatMap((p) => p.keywords)
  const multiWord = allKeywords.filter((k) => k.includes(' '))

  return multiWord.filter((phrase) => normalized.includes(phrase))
}

function isPositiveInput(tokens: string[], normalizedInput: string): boolean {
  if (tokens.some((t) => POSITIVE_TERMS.has(t))) return true
  return [...POSITIVE_TERMS].some((term) => normalizedInput.includes(term))
}

function toMatched(passage: Passage, score = 0, matchedTerms: string[] = []): MatchedPassage {
  return { ...passage, score, matchedTerms }
}

function pickByIds(ids: string[], exclude: Set<string>, limit: number): MatchedPassage[] {
  return ids
    .map((id) => passages.find((p) => p.id === id))
    .filter((p): p is Passage => p != null && !exclude.has(p.id))
    .slice(0, limit)
    .map((p) => toMatched(p))
}

function relatedPassages(
  themes: string[],
  exclude: Set<string>,
  limit: number,
): MatchedPassage[] {
  const themeSet = new Set(themes)
  return passages
    .filter((p) => !exclude.has(p.id) && p.themes.some((t) => themeSet.has(t)))
    .slice(0, limit)
    .map((p) => toMatched(p))
}

export const MATCH_RESULT_COUNT = 6
export const RESULTS_PER_PAGE = 3

export function matchPassages(input: string, limit = MATCH_RESULT_COUNT): MatchedPassage[] {
  const trimmed = input.trim()
  if (!trimmed) return []

  const tokens = tokenize(trimmed)
  const phrases = getPhrases(trimmed)
  const normalizedInput = trimmed.toLowerCase()

  const scored = passages.map((passage) => {
    let score = 0
    const matchedTerms: string[] = []

    for (const keyword of passage.keywords) {
      const keywordLower = keyword.toLowerCase()

      if (keyword.includes(' ')) {
        if (normalizedInput.includes(keywordLower)) {
          score += 4
          matchedTerms.push(keyword)
        }
        continue
      }

      if (tokens.includes(keywordLower)) {
        score += 3
        matchedTerms.push(keyword)
      } else if (normalizedInput.includes(keywordLower)) {
        score += 2
        matchedTerms.push(keyword)
      }
    }

    for (const theme of passage.themes) {
      if (tokens.includes(theme) || normalizedInput.includes(theme)) {
        score += 2
        matchedTerms.push(theme)
      }
    }

    for (const phrase of phrases) {
      if (passage.keywords.includes(phrase)) {
        score += 1
        if (!matchedTerms.includes(phrase)) matchedTerms.push(phrase)
      }
    }

    return { ...passage, score, matchedTerms: [...new Set(matchedTerms)] }
  })

  const results = scored
    .filter((p) => p.score > 0)
    .sort((a, b) => b.score - a.score)

  const usedIds = new Set(results.map((r) => r.id))
  const combined: MatchedPassage[] = [...results]

  if (combined.length > 0 && combined.length < limit) {
    const related = relatedPassages(
      combined[0].themes,
      usedIds,
      limit - combined.length,
    )
    related.forEach((p) => usedIds.add(p.id))
    combined.push(...related)
  }

  if (combined.length >= limit) {
    return combined.slice(0, limit)
  }

  const positive = isPositiveInput(tokens, normalizedInput)
  const fallbackIds = positive ? POSITIVE_FALLBACK_IDS : GENERAL_FALLBACK_IDS
  const fallbacks = pickByIds(fallbackIds, usedIds, limit - combined.length)

  return [...combined, ...fallbacks].slice(0, limit)
}
