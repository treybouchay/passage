// Cross from Figma — Excess file, node 2:25
// Halo rays from Figma node 8:154, mapped into cross viewBox

export const CROSS_VIEWBOX = '110 104 292 406'

export const CROSS_PATH =
  'M224 116H288V222H394V286H288V502.5H224V286H118V222H224V116Z'

export const CROSS_STROKE = 12

/** Figma Group 1 — 9 rays, inner → outer (grow outward from cross) */
export const HALO_RAYS: Array<{
  x1: number
  y1: number
  x2: number
  y2: number
}> = [
  { x1: 259.9, y1: 47.57, x2: 259.9, y2: -28.36 },
  { x1: 202.08, y1: 67.94, x2: 179.7, y2: -6.13 },
  { x1: 147.99, y1: 90.17, x2: 97.63, y2: 29.05 },
  { x1: 93.9, y1: 132.76, x2: 28.62, y2: 90.17 },
  { x1: 62.19, y1: 190.17, x2: -18.01, y2: 169.8 },
  { x1: 317.72, y1: 67.94, x2: 340.11, y2: -6.13 },
  { x1: 371.82, y1: 90.17, x2: 422.18, y2: 29.05 },
  { x1: 425.9, y1: 132.76, x2: 491.19, y2: 90.17 },
  { x1: 457.61, y1: 190.17, x2: 537.82, y2: 169.8 },
]

export const RAY_COUNT = HALO_RAYS.length

/** Stagger order: center, then pairs outward left/right */
const RAY_ANIM_ORDER = [0, 1, 5, 2, 6, 3, 7, 4, 8]

export function buildHaloRays(): Array<{
  x1: number
  y1: number
  x2: number
  y2: number
  delay: number
}> {
  return RAY_ANIM_ORDER.map((index, order) => ({
    ...HALO_RAYS[index],
    delay: order * 35,
  }))
}
