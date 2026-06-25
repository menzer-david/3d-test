import React from 'react'
import { Perf } from 'r3f-perf'
import { useControls } from 'leva'
import { journey } from '../journey/state.js'

// Tune fog/glow/particles + post during dev. Bindings write straight to the
// shared journey object (read each frame by the scene). Stripped from prod.
export default function DevPanelImpl() {
  useControls('aurelia (dev)', {
    postBloom: { value: journey.postBloom, min: 0, max: 2, step: 0.01, onChange: (v) => (journey.postBloom = v) },
    depthOverride: {
      value: -1,
      min: -1,
      max: 1,
      step: 0.01,
      onChange: (v) => {
        if (v >= 0) journey.depth = v
      },
    },
    jellyIgnite: { value: journey.jellyIgnite, min: 0, max: 1, step: 0.01, onChange: (v) => (journey.jellyIgnite = v) },
  })
  return <Perf position="bottom-left" minimal />
}
