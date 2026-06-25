import { useCallback, useEffect, useRef, useState } from 'react'
import {
  buildHaloRays,
  CROSS_PATH,
  CROSS_STROKE,
  CROSS_VIEWBOX,
  RAY_COUNT,
} from '../icons/crossPaths'

const HIT_THRESHOLD = 36
const COMPLETE_RATIO = 0.98
const SAMPLES = 200
const MAX_FILL_GAP = 36
const NEIGHBOR_SPREAD = 2

const RAY_ANIM_MS = 600
const RAY_STAGGER_MS = 35
const RAY_HOLD_MS = 1600
const LINES_DELAY_MS = RAY_ANIM_MS + (RAY_COUNT - 1) * RAY_STAGGER_MS + RAY_HOLD_MS

function CrossHaloRays() {
  const rays = buildHaloRays()

  return (
    <svg
      className="trace-halo-rays"
      viewBox={CROSS_VIEWBOX}
      overflow="visible"
      aria-hidden="true"
    >
      {rays.map((ray, i) => (
        <line
          key={i}
          x1={ray.x1}
          y1={ray.y1}
          x2={ray.x2}
          y2={ray.y2}
          pathLength={1}
          className="trace-halo-ray"
          style={{ animationDelay: `${ray.delay}ms` }}
        />
      ))}
    </svg>
  )
}

interface TraceGestureProps {
  onComplete: () => void
}

interface Point {
  x: number
  y: number
}

function dist(a: Point, b: Point) {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

/** Lit segments follow traced parts of the path, not just the path start */
function buildHitDasharray(hits: boolean[]): string {
  const n = hits.length
  const unit = 1 / n
  const hitCount = hits.filter(Boolean).length

  if (hitCount === 0) return '0 1'
  if (hitCount === n) return '1'

  let start = hits.findIndex(Boolean)
  if (start === -1) return '0 1'

  const parts: number[] = []
  let idx = start
  let guard = 0

  do {
    if (hits[idx % n]) {
      let run = 0
      while (hits[idx % n] && run < n) {
        run++
        idx++
      }
      parts.push(run * unit)

      let gap = 0
      while (!hits[idx % n] && gap < n) {
        gap++
        idx++
      }
      if (gap > 0) parts.push(gap * unit)
    } else {
      idx++
    }
    guard++
  } while (idx % n !== start && guard <= n * 2)

  return parts.length > 0 ? parts.join(' ') : '0 1'
}

function closestPathIndex(
  path: SVGPathElement,
  point: Point,
  sampleCount: number,
): { index: number; distance: number } {
  const total = path.getTotalLength()
  let bestL = 0
  let bestD = Infinity

  const coarse = 72
  for (let i = 0; i <= coarse; i++) {
    const l = (i / coarse) * total
    const d = dist(point, path.getPointAtLength(l))
    if (d < bestD) {
      bestD = d
      bestL = l
    }
  }

  const window = total / coarse
  let lo = Math.max(0, bestL - window)
  let hi = Math.min(total, bestL + window)
  for (let j = 0; j < 18; j++) {
    const m1 = lo + (hi - lo) / 3
    const m2 = hi - (hi - lo) / 3
    const d1 = dist(point, path.getPointAtLength(m1))
    const d2 = dist(point, path.getPointAtLength(m2))
    if (d1 < d2) {
      hi = m2
      if (d1 < bestD) {
        bestD = d1
        bestL = m1
      }
    } else {
      lo = m1
      if (d2 < bestD) {
        bestD = d2
        bestL = m2
      }
    }
  }

  const index = Math.min(
    sampleCount - 1,
    Math.max(0, Math.round((bestL / total) * (sampleCount - 1))),
  )

  return { index, distance: bestD }
}

function markIndexRange(hits: boolean[], from: number, to: number): boolean {
  let changed = false
  const mark = (i: number) => {
    if (!hits[i]) {
      hits[i] = true
      changed = true
    }
  }

  if (from <= to) {
    for (let i = from; i <= to; i++) mark(i)
  } else {
    for (let i = from; i < hits.length; i++) mark(i)
    for (let i = 0; i <= to; i++) mark(i)
  }

  return changed
}

function markWithNeighbors(hits: boolean[], index: number): boolean {
  let changed = false
  for (let d = -NEIGHBOR_SPREAD; d <= NEIGHBOR_SPREAD; d++) {
    const i = index + d
    if (i >= 0 && i < hits.length && !hits[i]) {
      hits[i] = true
      changed = true
    }
  }
  return changed
}

function fillBetweenIndices(
  hits: boolean[],
  lastIndex: number,
  index: number,
  total: number,
): boolean {
  const directGap = Math.abs(index - lastIndex)
  const wrapGap = total - directGap

  if (directGap <= MAX_FILL_GAP) {
    return markIndexRange(hits, Math.min(lastIndex, index), Math.max(lastIndex, index))
  }

  if (wrapGap <= MAX_FILL_GAP) {
    if (lastIndex <= index) {
      return markIndexRange(hits, index, lastIndex)
    }
    return markIndexRange(hits, lastIndex, index)
  }

  return false
}

function hitRatio(hits: boolean[]) {
  return hits.filter(Boolean).length / hits.length
}

export function TraceGesture({ onComplete }: TraceGestureProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const pathRef = useRef<SVGPathElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const hitsRef = useRef<boolean[]>([])
  const drawingRef = useRef(false)
  const lastPointRef = useRef<Point | null>(null)
  const lastIndexRef = useRef<number | null>(null)
  const completedRef = useRef(false)

  const [progressDash, setProgressDash] = useState('0 1')
  const [celebrating, setCelebrating] = useState(false)

  const syncProgress = useCallback((hits: boolean[]) => {
    setProgressDash(buildHitDasharray(hits))
  }, [])

  const getPoint = useCallback((clientX: number, clientY: number): Point | null => {
    const overlay = overlayRef.current
    const svg = svgRef.current
    if (!overlay || !svg) return null

    const rect = overlay.getBoundingClientRect()
    const viewBox = svg.viewBox.baseVal
    const scaleX = viewBox.width / rect.width
    const scaleY = viewBox.height / rect.height

    return {
      x: (clientX - rect.left) * scaleX + viewBox.x,
      y: (clientY - rect.top) * scaleY + viewBox.y,
    }
  }, [])

  const registerPoint = useCallback(
    (point: Point) => {
      if (completedRef.current) return

      const path = pathRef.current
      const hits = hitsRef.current
      if (!path || !hits.length) return

      const { index, distance } = closestPathIndex(path, point, hits.length)
      if (distance > HIT_THRESHOLD) return

      let changed = false
      const lastIndex = lastIndexRef.current

      if (lastIndex === null) {
        changed = markWithNeighbors(hits, index)
      } else if (fillBetweenIndices(hits, lastIndex, index, hits.length)) {
        changed = true
      } else {
        changed = markWithNeighbors(hits, index)
      }

      lastIndexRef.current = index

      if (changed) {
        syncProgress(hits)

        if (hitRatio(hits) >= COMPLETE_RATIO && !completedRef.current) {
          completedRef.current = true
          hits.fill(true)
          setProgressDash('1')
          setCelebrating(true)
          window.setTimeout(onComplete, LINES_DELAY_MS)
        }
      }
    },
    [onComplete, syncProgress],
  )

  const registerStroke = useCallback(
    (from: Point, to: Point) => {
      const length = dist(from, to)
      const steps = Math.max(1, Math.ceil(length / 3))
      for (let i = 0; i <= steps; i++) {
        const t = i / steps
        registerPoint({
          x: from.x + (to.x - from.x) * t,
          y: from.y + (to.y - from.y) * t,
        })
      }
    },
    [registerPoint],
  )

  useEffect(() => {
    hitsRef.current = new Array(SAMPLES).fill(false)
  }, [])

  const handlePointerDown = (e: React.PointerEvent) => {
    if (completedRef.current) return
    drawingRef.current = true
    lastIndexRef.current = null
    const point = getPoint(e.clientX, e.clientY)
    if (point) {
      lastPointRef.current = point
      registerPoint(point)
    }
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!drawingRef.current || completedRef.current) return
    const point = getPoint(e.clientX, e.clientY)
    if (!point) return

    const lastPoint = lastPointRef.current
    if (lastPoint) {
      registerStroke(lastPoint, point)
    } else {
      registerPoint(point)
    }
    lastPointRef.current = point
  }

  const handlePointerUp = () => {
    drawingRef.current = false
    lastPointRef.current = null
    lastIndexRef.current = null
  }

  return (
    <div className={`trace-gesture${celebrating ? ' trace-gesture--complete' : ''}`}>
      <div className="trace-cross-stage">
        {celebrating && <CrossHaloRays />}
        <div className="trace-canvas-wrap">
          <svg
            ref={svgRef}
            viewBox={CROSS_VIEWBOX}
            className="trace-svg"
            aria-hidden="true"
          >
            <path
              d={CROSS_PATH}
              className="trace-outline"
              fill="none"
              strokeWidth={CROSS_STROKE}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              ref={pathRef}
              d={CROSS_PATH}
              className="trace-progress"
              fill="none"
              strokeWidth={CROSS_STROKE}
              strokeLinecap="round"
              strokeLinejoin="round"
              pathLength={1}
              strokeDasharray={progressDash}
              strokeDashoffset={0}
            />
          </svg>
          <div
            ref={overlayRef}
            className="trace-overlay"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
          />
        </div>
      </div>
      {!celebrating && <p className="trace-hint">trace the cross to begin</p>}
    </div>
  )
}
