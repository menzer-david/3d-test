// The approved BEAT SPEC, transcribed as GSAP timelines. Each builder returns a
// GSAP timeline that animates values on the shared `journey` object. The
// CameraRig / scene shaders read those values every frame. Implemented LITERALLY
// from the plan gate — no extra tracks beyond what the spec authorized.
import gsap from 'gsap'
import { CAM } from '../config.js'
import { journey, setPhase } from './state.js'

// reduced-motion shortens transitions and skips the heavy holds
const RM = journey.reducedMotion
const dur = (s) => (RM ? s * 0.35 : s)

function tweenCam(tl, to, d, ease, at = 0) {
  tl.to(journey.cam, { ...to, duration: dur(d), ease }, at)
}

// ── KF1 SURFACE — entrance from the loader ─────────────────────────────────
export function kf1Entrance() {
  Object.assign(journey.cam, { ...CAM.kf1, z: 18 })
  journey.depth = 0
  const tl = gsap.timeline({
    onComplete: () => {
      journey.locked = false
      setPhase('kf1')
    },
  })
  tweenCam(tl, { z: 14 }, 1.4, 'power3.out', 0)
  tl.to(journey.text, { kf1: 1, duration: dur(0.8), ease: 'power2.out' }, 0.3)
  tl.to(journey.text, { kf1sub: 1, duration: dur(0.8), ease: 'power2.out' }, 0.5)
  tl.to(journey, { causticsOpacity: 0.7, duration: dur(1.6), ease: 'power1.out' }, 0)
  tl.to(journey, { backdropOpacity: 0.85, duration: dur(1.6), ease: 'power1.out' }, 0)
  return tl
}

// ── KF1 -> KF2 : hand off to the scrub. Title dissolves, descent begins. ────
export function enterDescent() {
  journey.locked = true
  setPhase('descent')
  const tl = gsap.timeline({
    onComplete: () => {
      journey.locked = false // scrub is free movement, not locked
    },
  })
  tl.to(journey.text, { kf1: 0, kf1sub: 0, duration: dur(0.6), ease: 'power2.in' }, 0)
  return tl
}

// ── KF2 -> KF3 : IGNITE. Out of the black, the jelly lights from within. ────
export function ignite() {
  journey.locked = true
  journey.depth = 1
  journey.descentT = 1
  Object.assign(journey.cam, CAM.descentBottom)
  const tl = gsap.timeline({
    onComplete: () => {
      journey.locked = false
      setPhase('kf3')
    },
  })
  tweenCam(tl, CAM.kf3, 1.0, 'power2.out', 0)
  tl.to(journey, { jellyIgnite: 1, duration: dur(0.95), ease: 'power2.inOut' }, 0.15)
  tl.fromTo(
    journey,
    { jellyPulse: 0.98 },
    { jellyPulse: 1.0, duration: dur(0.9), ease: 'power2.out' },
    0.3,
  )
  tl.to(journey.text, { kf3: 1, duration: dur(0.9), ease: 'power2.out' }, 0.4)
  return tl
}

export function deignite() {
  // reverse: KF3 -> back up the descent
  journey.locked = true
  const tl = gsap.timeline({
    onComplete: () => {
      journey.locked = false
      setPhase('descent')
    },
  })
  tl.to(journey, { jellyIgnite: 0, duration: dur(0.5), ease: 'power2.in' }, 0)
  tl.to(journey.text, { kf3: 0, duration: dur(0.4) }, 0)
  return tl
}

// ── KF3 -> KF4 : THE BLOOM (signature). Pulse -> shockwave -> fly-through. ──
export function bloom() {
  journey.locked = true
  const tl = gsap.timeline({
    onComplete: () => {
      journey.locked = false
      setPhase('kf4')
    },
  })
  // 0–250 wind-up contract, 250–500 snap-expand + flash
  tl.to(journey, { jellyPulse: 0.9, duration: dur(0.25), ease: 'power2.in' }, 0)
  tl.to(journey, { jellyPulse: 1.05, duration: dur(0.25), ease: 'power3.out' }, 0.25)
  tl.to(journey, { jellyPulse: 1.0, duration: dur(0.5), ease: 'power2.out' }, 0.5)
  // 300–1600 GPGPU shockwave expands
  tl.to(journey, { bloom: 1, duration: dur(1.3), ease: 'power2.out' }, 0.3)
  // 500–2200 camera dollies forward THROUGH the shell
  tweenCam(tl, CAM.kf4, 1.7, 'power2.inOut', 0.5)
  // 400–1400 headline in
  tl.to(journey.text, { kf3: 0, duration: dur(0.4) }, 0.2)
  tl.to(journey.text, { kf4: 1, duration: dur(1.0), ease: 'power2.out' }, 0.4)
  // 600–1600 post bump (seasoning) then settle
  tl.to(journey, { postBloom: 1.15, postCA: 0.0026, duration: dur(0.5), ease: 'power2.out' }, 0.6)
  tl.to(journey, { postBloom: 0.6, postCA: 0.0011, duration: dur(0.9), ease: 'power2.inOut' }, 1.4)
  return tl
}

export function unbloom() {
  // reverse: KF4 -> KF3
  journey.locked = true
  const tl = gsap.timeline({
    onComplete: () => {
      journey.locked = false
      setPhase('kf3')
    },
  })
  tl.to(journey, { bloom: 0, duration: dur(0.8), ease: 'power2.inOut' }, 0)
  tweenCam(tl, CAM.kf3, 0.9, 'power2.inOut', 0)
  tl.to(journey.text, { kf4: 0, duration: dur(0.4) }, 0)
  tl.to(journey.text, { kf3: 1, duration: dur(0.6) }, 0.3)
  return tl
}

// ── KF4 -> KF5 : DISSOLVE. Plankton reassemble into the AURELIA wordmark. ───
export function dissolveToLogo() {
  journey.locked = true
  const tl = gsap.timeline({
    onComplete: () => {
      journey.locked = false
      setPhase('kf5')
    },
  })
  tl.to(journey, { morph: 1, duration: dur(1.4), ease: 'power2.inOut' }, 0)
  tweenCam(tl, CAM.kf5, 1.5, 'power3.inOut', 0.2)
  tl.to(journey.text, { kf4: 0, duration: dur(0.4) }, 0)
  tl.to(journey.text, { kf5: 1, duration: dur(0.8), ease: 'power2.out' }, 0.9)
  tl.to(journey.text, { kf5sub: 1, duration: dur(0.8), ease: 'power2.out' }, 1.1)
  return tl
}

export function reassembleBack() {
  // reverse: KF5 -> KF4
  journey.locked = true
  const tl = gsap.timeline({
    onComplete: () => {
      journey.locked = false
      setPhase('kf4')
    },
  })
  tl.to(journey, { morph: 0, duration: dur(1.0), ease: 'power2.inOut' }, 0)
  tweenCam(tl, CAM.kf4, 1.0, 'power2.inOut', 0)
  tl.to(journey.text, { kf5: 0, kf5sub: 0, duration: dur(0.4) }, 0)
  tl.to(journey.text, { kf4: 1, duration: dur(0.6) }, 0.4)
  return tl
}
