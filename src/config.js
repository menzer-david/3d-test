// Central tuning: palette, per-depth fog grade, particle counts, capability flags.
import * as THREE from 'three'

export const isMobile =
  typeof navigator !== 'undefined' &&
  /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)

export const prefersReducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

// ── Palette (color comes from LIGHT + FOG, never CSS) ──────────────────────
export const COLORS = {
  surface: new THREE.Color('#7fe9ff'), // sunlit aqua
  teal: new THREE.Color('#1a8a9c'),
  indigo: new THREE.Color('#0b1a4a'),
  abyss: new THREE.Color('#01030a'), // near-black midnight
  bioCyan: new THREE.Color('#5ef2ff'),
  bioMagenta: new THREE.Color('#ff4fd8'),
}

// Fog color graded by global depth 0..1 (surface -> midnight).
const fogStops = [
  { t: 0.0, c: new THREE.Color('#3fb9d9'), d: 0.014 },
  { t: 0.35, c: new THREE.Color('#137f93'), d: 0.03 },
  { t: 0.7, c: new THREE.Color('#0a1c4e'), d: 0.06 },
  { t: 1.0, c: new THREE.Color('#01030a'), d: 0.095 },
]

const _c = new THREE.Color()
export function fogColorAt(depth, target = _c) {
  const t = THREE.MathUtils.clamp(depth, 0, 1)
  for (let i = 0; i < fogStops.length - 1; i++) {
    const a = fogStops[i]
    const b = fogStops[i + 1]
    if (t >= a.t && t <= b.t) {
      const k = (t - a.t) / (b.t - a.t)
      return target.copy(a.c).lerp(b.c, k)
    }
  }
  return target.copy(fogStops[fogStops.length - 1].c)
}

export function fogDensityAt(depth) {
  const t = THREE.MathUtils.clamp(depth, 0, 1)
  for (let i = 0; i < fogStops.length - 1; i++) {
    const a = fogStops[i]
    const b = fogStops[i + 1]
    if (t >= a.t && t <= b.t) {
      const k = (t - a.t) / (b.t - a.t)
      return THREE.MathUtils.lerp(a.d, b.d, k)
    }
  }
  return fogStops[fogStops.length - 1].d
}

// ── Particle counts (scaled down on mobile) ────────────────────────────────
export const COUNTS = {
  marineSnow: isMobile ? 700 : 2200,
  // GPGPU sim is SIZE x SIZE particles for the plankton bloom.
  gpgpuSize: isMobile ? 64 : 128,
}

// World anchors -------------------------------------------------------------
export const HERO_Y = -182 // jellyfish + bloom live here in the midnight zone

// Camera framing per phase: position + lookAt target.
export const CAM = {
  kf1: { x: 0, y: 2, z: 14, lx: 0, ly: 6, lz: 0 }, // looking up toward the surface ceiling
  descentTop: { x: 0, y: 2, z: 14, lx: 0, ly: -6, lz: 0 },
  descentBottom: { x: 0, y: HERO_Y + 9, z: 10, lx: 0, ly: HERO_Y, lz: 0 },
  kf3: { x: 0, y: HERO_Y + 1.5, z: 6.5, lx: 0, ly: HERO_Y, lz: 0 },
  kf4: { x: 0, y: HERO_Y + 0.5, z: -4, lx: 0, ly: HERO_Y, lz: -6 }, // dollied THROUGH bloom
  kf5: { x: 0, y: HERO_Y, z: 7.5, lx: 0, ly: HERO_Y, lz: 0 }, // pulled back to read wordmark
}
