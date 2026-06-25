import React, { useEffect, useState } from 'react'
import { useProgress } from '@react-three/drei'

// Loader tied to REAL readiness (drei useProgress = bundle + texture + first
// render). On this near-procedural build there's little to load, so it stays
// BRIEF and dissolves the moment the first frame is ready — no fake countdown.
export default function Loader({ glReady, onReady, bootstrap }) {
  const { active, progress } = useProgress()
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (bootstrap) return
    if (glReady && !active && !done) {
      setDone(true)
      // hand off to the journey on the next tick (lets the first frame settle)
      const id = setTimeout(() => onReady && onReady(), 120)
      return () => clearTimeout(id)
    }
  }, [glReady, active, done, bootstrap, onReady])

  const pct = bootstrap ? 8 : Math.max(progress, glReady ? 100 : 0)

  return (
    <div
      className="pointer-events-none fixed inset-0 z-50 flex flex-col items-center justify-center transition-opacity duration-700"
      style={{ opacity: done ? 0 : 1, background: '#01030a' }}
    >
      <div className="font-grotesque text-[1.6rem] font-bold uppercase tracking-widest2 text-[#cfeffb]">
        AURELIA
      </div>
      <div className="mt-5 h-px w-44 overflow-hidden bg-white/10">
        <div
          className="h-full bg-aurelia-cyan transition-[width] duration-200"
          style={{ width: `${pct}%`, boxShadow: '0 0 12px #5ef2ff' }}
        />
      </div>
      <div className="mt-3 font-mono text-[0.62rem] uppercase tracking-[0.25em] text-[#5a8aa0]">
        descending
      </div>
    </div>
  )
}
