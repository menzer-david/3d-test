import React, { useEffect, useState } from 'react'
import { onPhase, journey } from '../journey/state.js'
import MuteToggle from './MuteToggle.jsx'

// 2D UI overlaid on the canvas: brand, scroll hint, footer nav, mute. Per the
// brief, only standard 2D UI lives here (nav / footer / controls) — all
// headlines + depth markers are rendered IN-SCENE (WebGL). Nothing here draws a
// page background; the canvas behind it is the world.
export default function Overlay() {
  const [phase, setPhase] = useState(journey.phase)
  useEffect(() => onPhase(setPhase), [])

  const atSurface = phase === 'kf1'
  const atLogo = phase === 'kf5'

  return (
    <div className="pointer-events-none fixed inset-0 z-10 select-none">
      {/* brand */}
      <div className="absolute left-6 top-6 font-grotesque text-sm font-bold uppercase tracking-[0.4em] text-[#dff4ff]/90">
        AURELIA
      </div>

      {/* mute toggle */}
      <div className="absolute right-6 top-6">
        <MuteToggle />
      </div>

      {/* depth / phase HUD (right rail) — quiet, mono, scientific */}
      <div className="absolute right-6 top-1/2 hidden -translate-y-1/2 flex-col items-end gap-2 font-mono text-[0.6rem] uppercase tracking-[0.2em] text-[#6fa6bd] sm:flex">
        {['surface', 'descent', 'ignite', 'bloom', 'logo'].map((label, i) => {
          const order = ['kf1', 'descent', 'kf3', 'kf4', 'kf5']
          const active = order[i] === phase
          return (
            <div key={label} className="flex items-center gap-2">
              <span style={{ color: active ? '#5ef2ff' : undefined }}>{label}</span>
              <span
                className="h-px transition-all duration-500"
                style={{
                  width: active ? 22 : 10,
                  background: active ? '#5ef2ff' : '#2a4a58',
                  boxShadow: active ? '0 0 8px #5ef2ff' : 'none',
                }}
              />
            </div>
          )
        })}
      </div>

      {/* scroll hint (surface only) */}
      <div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 font-mono text-[0.62rem] uppercase tracking-[0.3em] text-[#9fdff0] transition-opacity duration-700"
        style={{ opacity: atSurface ? 0.9 : 0 }}
      >
        <span className="inline-block animate-pulse">scroll to descend ↓</span>
      </div>

      {/* footer nav (logo beat only) */}
      <nav
        className="absolute bottom-8 left-1/2 -translate-x-1/2 transition-opacity duration-700"
        style={{ opacity: atLogo ? 1 : 0, pointerEvents: atLogo ? 'auto' : 'none' }}
      >
        <ul className="flex flex-wrap items-center justify-center gap-x-7 gap-y-2 font-mono text-[0.66rem] uppercase tracking-[0.24em] text-[#bfe9ff]">
          {['Research log', 'Open data', 'Contact the collective'].map((item, i) => (
            <li key={item} className="flex items-center gap-7">
              {i > 0 && <span className="text-[#3a6678]">·</span>}
              <a
                href="#"
                onClick={(e) => e.preventDefault()}
                className="transition-colors hover:text-white"
                style={{ textShadow: '0 0 10px rgba(94,242,255,0.25)' }}
              >
                {item}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
