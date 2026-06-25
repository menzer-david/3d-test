import React, { useEffect, useRef } from 'react'
import Lenis from 'lenis'
import * as THREE from 'three'
import { journey, setPhase } from './state.js'
import { CAM } from '../config.js'
import {
  kf1Entrance,
  enterDescent,
  ignite,
  deignite,
  bloom,
  unbloom,
  dissolveToLogo,
  reassembleBack,
} from './beats.js'

// Map the KF2 descent progress (0..1) onto the continuous environment values.
// This is the ONE genuinely continuous scrub move in the journey.
const smooth = (a, b, t) => THREE.MathUtils.smoothstep(t, a, b)
function applyDescent(p) {
  journey.descentT = p
  journey.depth = p
  journey.cam.x = 0
  journey.cam.y = THREE.MathUtils.lerp(2, CAM.descentBottom.y, p)
  journey.cam.z = THREE.MathUtils.lerp(14, 10, smooth(0.6, 1, p))
  journey.cam.lx = 0
  journey.cam.ly = THREE.MathUtils.lerp(journey.cam.y - 7, CAM.descentBottom.ly, smooth(0.8, 1, p))
  journey.cam.lz = 0
  journey.causticsOpacity = 0.7 * (1 - smooth(0.02, 0.25, p))
  journey.backdropOpacity = 0.85 * (1 - smooth(0.05, 0.35, p))
}

export default function JourneyController({ started }) {
  const lenisRef = useRef(null)
  const rafRef = useRef(0)
  const spacerRef = useRef(null)
  const touchY = useRef(0)
  const busy = useRef(false)

  // ── Entrance once the loader resolves ───────────────────────────────────
  useEffect(() => {
    if (!started) return
    if (journey.reducedMotion) {
      setupReducedMotion()
      return () => teardownReducedMotion()
    }
    kf1Entrance()
  }, [started])

  // ── REDUCED MOTION: drop the hijack, use anchored native scroll ──────────
  function setupReducedMotion() {
    setPhase('kf1')
    journey.locked = false
    const spacer = document.createElement('div')
    spacer.style.cssText = 'position:absolute;top:0;left:0;width:1px;height:500vh;pointer-events:none;opacity:0'
    document.body.appendChild(spacer)
    spacerRef.current = spacer
    document.body.style.overflow = 'auto'

    const camStops = [
      { f: 0.0, c: CAM.kf1 },
      { f: 0.1, c: CAM.kf1 },
      { f: 0.5, c: CAM.kf3 },
      { f: 0.72, c: CAM.kf4 },
      { f: 0.9, c: CAM.kf5 },
      { f: 1.0, c: CAM.kf5 },
    ]
    const lerpCam = (f) => {
      for (let i = 0; i < camStops.length - 1; i++) {
        const a = camStops[i]
        const b = camStops[i + 1]
        if (f >= a.f && f <= b.f) {
          const k = (f - a.f) / (b.f - a.f || 1)
          for (const key of ['x', 'y', 'z', 'lx', 'ly', 'lz'])
            journey.cam[key] = THREE.MathUtils.lerp(a.c[key], b.c[key], k)
          return
        }
      }
    }
    const win = (v, a, b) => THREE.MathUtils.clamp((v - a) / (b - a), 0, 1)
    const onScroll = () => {
      const limit = document.documentElement.scrollHeight - window.innerHeight
      const f = limit > 0 ? window.scrollY / limit : 0
      journey.depth = THREE.MathUtils.clamp(f / 0.5, 0, 1)
      journey.descentT = journey.depth
      journey.causticsOpacity = 0.7 * (1 - win(f, 0.02, 0.18))
      journey.backdropOpacity = 0.85 * (1 - win(f, 0.05, 0.22))
      journey.jellyIgnite = win(f, 0.45, 0.6)
      journey.bloom = win(f, 0.6, 0.78)
      journey.morph = win(f, 0.82, 0.95)
      lerpCam(f)
      journey.text.kf1 = 1 - win(f, 0.05, 0.12)
      journey.text.kf1sub = journey.text.kf1
      journey.text.kf2sub = win(f, 0.25, 0.33) * (1 - win(f, 0.42, 0.5))
      journey.text.kf3 = win(f, 0.5, 0.58) * (1 - win(f, 0.66, 0.72))
      journey.text.kf4 = win(f, 0.68, 0.74) * (1 - win(f, 0.82, 0.88))
      journey.text.kf5 = win(f, 0.9, 0.96)
      journey.text.kf5sub = journey.text.kf5
      setPhase(f > 0.88 ? 'kf5' : f > 0.6 ? 'kf4' : f > 0.45 ? 'kf3' : f > 0.1 ? 'descent' : 'kf1')
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    spacerRef.current._onScroll = onScroll
    onScroll()
  }
  function teardownReducedMotion() {
    if (spacerRef.current) {
      window.removeEventListener('scroll', spacerRef.current._onScroll)
      spacerRef.current.remove()
    }
    document.body.style.overflow = 'hidden'
  }

  // ── SNAP + SCRUB hijack (default, full-motion) ───────────────────────────
  // Build the Lenis-smoothed descent scroll region. `atBottom` re-enters at the
  // deep end (used when stepping backward out of KF3).
  function createDescentScroll(atBottom = false) {
    const spacer = document.createElement('div')
    spacer.style.cssText = 'position:absolute;top:0;left:0;width:1px;height:600vh;pointer-events:none;opacity:0'
    document.body.appendChild(spacer)
    spacerRef.current = spacer
    document.body.style.overflow = 'auto'

    const lenis = new Lenis({
      duration: 1.15,
      smoothWheel: true,
      syncTouch: true,
      touchMultiplier: 1.4,
    })
    lenisRef.current = lenis
    lenis.on('scroll', ({ scroll, limit }) => {
      applyDescent(limit > 0 ? THREE.MathUtils.clamp(scroll / limit, 0, 1) : 0)
    })
    const raf = (t) => {
      lenis.raf(t)
      rafRef.current = requestAnimationFrame(raf)
    }
    rafRef.current = requestAnimationFrame(raf)

    const limit = () => document.documentElement.scrollHeight - window.innerHeight
    if (atBottom) {
      requestAnimationFrame(() => lenis.scrollTo(limit(), { immediate: true }))
      applyDescent(1)
    } else {
      lenis.scrollTo(0, { immediate: true })
      applyDescent(0)
    }
  }

  function startDescentScrub() {
    enterDescent()
    createDescentScroll(false)
  }

  // backward out of KF3: rebuild the scrub at the deep end, fade ignite away
  function backToDescent() {
    journey.locked = true
    createDescentScroll(true)
    deignite()
  }

  function teardownDescentScrub() {
    cancelAnimationFrame(rafRef.current)
    if (lenisRef.current) {
      lenisRef.current.destroy()
      lenisRef.current = null
    }
    if (spacerRef.current) {
      spacerRef.current.remove()
      spacerRef.current = null
    }
    document.body.style.overflow = 'hidden'
    window.scrollTo(0, 0)
  }

  // unified directional intent (+1 forward/down, -1 back/up)
  function onIntent(dir) {
    if (journey.locked || busy.current) return
    const phase = journey.phase

    if (phase === 'kf1' && dir > 0) {
      busy.current = true
      startDescentScrub()
      setTimeout(() => (busy.current = false), 60)
      return
    }
    if (phase === 'descent') {
      const p = journey.descentT
      if (dir > 0 && p >= 0.985) {
        teardownDescentScrub()
        ignite()
      } else if (dir < 0 && p <= 0.015) {
        teardownDescentScrub()
        // snap back to KF1 hold
        Object.assign(journey.cam, CAM.kf1)
        journey.depth = 0
        journey.causticsOpacity = 0.7
        journey.backdropOpacity = 0.85
        journey.text.kf1 = 1
        journey.text.kf1sub = 1
        setPhase('kf1')
        journey.locked = false
      }
      return
    }
    if (phase === 'kf3') return dir > 0 ? void bloom() : void backToDescent()
    if (phase === 'kf4') return dir > 0 ? void dissolveToLogo() : void unbloom()
    if (phase === 'kf5' && dir < 0) return void reassembleBack()
  }

  // ── Input listeners (wheel / touch / keyboard) ───────────────────────────
  useEffect(() => {
    if (journey.reducedMotion) return
    const onWheel = (e) => {
      if (Math.abs(e.deltaY) < 2) return
      onIntent(Math.sign(e.deltaY))
    }
    const onTouchStart = (e) => (touchY.current = e.touches[0].clientY)
    const onTouchEnd = (e) => {
      const endY = (e.changedTouches[0] || {}).clientY ?? touchY.current
      const dy = touchY.current - endY
      if (Math.abs(dy) > 24) onIntent(Math.sign(dy))
    }
    const onKey = (e) => {
      if (['ArrowDown', 'PageDown', ' ', 'Spacebar', 'ArrowRight'].includes(e.key)) {
        e.preventDefault()
        onIntent(1)
      } else if (['ArrowUp', 'PageUp', 'ArrowLeft'].includes(e.key)) {
        e.preventDefault()
        onIntent(-1)
      }
    }
    window.addEventListener('wheel', onWheel, { passive: true })
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchend', onTouchEnd, { passive: true })
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchend', onTouchEnd)
      window.removeEventListener('keydown', onKey)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}
