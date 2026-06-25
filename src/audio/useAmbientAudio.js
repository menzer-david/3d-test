import { useCallback, useRef, useState } from 'react'

// Low, slow deep-sea atmospheric drone via native Web Audio (no library).
// MUTED by default — the AudioContext is only created on the first user gesture
// (browsers block autoplay), so nothing plays until the user un-mutes.
export function useAmbientAudio() {
  const ctxRef = useRef(null)
  const masterRef = useRef(null)
  const lfoRef = useRef(null)
  const [muted, setMuted] = useState(true)

  const build = useCallback(() => {
    const Ctx = window.AudioContext || window.webkitAudioContext
    const ctx = new Ctx()
    const master = ctx.createGain()
    master.gain.value = 0
    master.connect(ctx.destination)

    // a slow low-pass to keep it dark + a gentle wandering filter
    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 320
    filter.Q.value = 0.6
    filter.connect(master)

    const lfo = ctx.createOscillator()
    const lfoGain = ctx.createGain()
    lfo.frequency.value = 0.05 // very slow swell
    lfoGain.gain.value = 140
    lfo.connect(lfoGain)
    lfoGain.connect(filter.frequency)
    lfo.start()
    lfoRef.current = lfo

    // detuned low oscillators -> a quiet drone with a fifth above
    const voices = [
      { f: 55, type: 'sine', g: 0.5 },
      { f: 55.4, type: 'sine', g: 0.4 },
      { f: 82.4, type: 'triangle', g: 0.18 },
    ]
    voices.forEach((v) => {
      const osc = ctx.createOscillator()
      osc.type = v.type
      osc.frequency.value = v.f
      const g = ctx.createGain()
      g.gain.value = v.g
      osc.connect(g)
      g.connect(filter)
      osc.start()
    })

    ctxRef.current = ctx
    masterRef.current = master
  }, [])

  const toggle = useCallback(() => {
    if (!ctxRef.current) build()
    const ctx = ctxRef.current
    const master = masterRef.current
    if (ctx.state === 'suspended') ctx.resume()
    const now = ctx.currentTime
    const next = !muted
    master.gain.cancelScheduledValues(now)
    master.gain.setValueAtTime(master.gain.value, now)
    master.gain.linearRampToValueAtTime(next ? 0 : 0.16, now + 1.2)
    setMuted(next)
  }, [build, muted])

  return { muted, toggle }
}
