import React from 'react'
import { useAmbientAudio } from '../audio/useAmbientAudio.js'

// Visible mute/unmute control for the deep-sea drone (muted by default).
export default function MuteToggle() {
  const { muted, toggle } = useAmbientAudio()
  return (
    <button
      onClick={toggle}
      aria-label={muted ? 'Unmute ambient audio' : 'Mute ambient audio'}
      className="pointer-events-auto flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-3 py-1.5 font-mono text-[0.62rem] uppercase tracking-[0.22em] text-[#bfe9ff] backdrop-blur-sm transition-colors hover:border-aurelia-cyan/60 hover:text-white"
    >
      <span className="relative flex h-3 w-3 items-center justify-center">
        <span
          className="h-1.5 w-1.5 rounded-full"
          style={{
            background: muted ? '#5a8aa0' : '#5ef2ff',
            boxShadow: muted ? 'none' : '0 0 8px #5ef2ff',
          }}
        />
      </span>
      {muted ? 'sound off' : 'sound on'}
    </button>
  )
}
