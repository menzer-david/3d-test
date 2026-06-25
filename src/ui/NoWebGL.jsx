import React from 'react'

// No-WebGL fallback: a styled message over the captured surface poster frame.
export default function NoWebGL() {
  return (
    <div className="fixed inset-0 flex items-center justify-center overflow-hidden bg-abyss">
      <img
        src="/assets/kf1-surface-backdrop.png"
        alt=""
        className="absolute inset-0 h-full w-full object-cover opacity-40"
      />
      <div className="absolute inset-0 bg-abyss/60" />
      <div className="relative max-w-md px-6 text-center">
        <div className="font-grotesque text-3xl font-bold uppercase tracking-widest2 text-[#eafbff]">
          AURELIA
        </div>
        <p className="mt-4 font-mono text-xs uppercase tracking-[0.22em] text-[#9fdff0]">
          Field research from the midnight zone.
        </p>
        <p className="mt-6 text-sm leading-relaxed text-[#9fbfce]">
          This experience needs a WebGL-capable browser. Please enable hardware
          acceleration or try a current version of Chrome, Firefox, Safari, or Edge.
        </p>
      </div>
    </div>
  )
}
