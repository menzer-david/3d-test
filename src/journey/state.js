// A single mutable object shared between the journey controller (writer) and the
// scene's useFrame loops (readers). Mutating it never triggers React re-renders,
// which is exactly what we want for per-frame animation values. GSAP timelines
// and the Lenis scrub write here; scene components read here.
import { CAM, prefersReducedMotion, isMobile } from '../config.js'

export const journey = {
  // discrete phase: 'loading' | 'kf1' | 'descent' | 'kf3' | 'kf4' | 'kf5'
  phase: 'loading',
  locked: true, // input ignored while true (loading + during snap transitions)

  depth: 0, // 0 surface .. 1 midnight  (drives fog/light grade)
  descentT: 0, // 0..1 progress through the KF2 scrub

  // camera target (CameraRig copies this each frame, then adds idle offsets)
  cam: { ...CAM.kf1 },

  // environment / asset opacities
  causticsOpacity: 0,
  backdropOpacity: 0,

  // hero jellyfish
  jellyIgnite: 0, // 0 dark .. 1 fully lit from within
  jellyPulse: 1, // multiplicative scale from the KF4 wind-up/snap

  // GPGPU plankton
  bloom: 0, // 0 dormant .. 1 full shockwave (KF4)
  morph: 0, // 0 bloom field .. 1 reassembled wordmark (KF5)

  // post-fx live intensities (kept subtle; bumped briefly in KF4)
  postBloom: 0.55,
  postCA: 0.0009,

  // in-scene text opacities
  text: { kf1: 0, kf1sub: 0, kf2sub: 0, kf3: 0, kf4: 0, kf5: 0, kf5sub: 0 },

  // pointer in normalized device space (-1..1) for cursor reactivity
  pointer: { x: 0, y: 0 },

  reducedMotion: prefersReducedMotion,
  mobile: isMobile,
}

// Tiny pub/sub so the 2D React overlay can react to infrequent phase changes
// (footer visibility, scroll-hint) without polling.
const listeners = new Set()
export function onPhase(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}
export function setPhase(phase) {
  journey.phase = phase
  listeners.forEach((fn) => fn(phase))
}
