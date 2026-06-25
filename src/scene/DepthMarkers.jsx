import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import * as THREE from 'three'
import { journey } from '../journey/state.js'
import plexUrl from '@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-500-normal.woff?url'

// Kinetic depth markers the camera flies THROUGH during the KF2 descent. Each is
// pinned to a depth along the column; opacity + scale peak as the camera passes
// its Y level (a true fly-through, not a static label).
const MARKERS = [
  { label: '0M', y: 0, x: -2.2 },
  { label: '−200M', y: -42, x: 2.4 },
  { label: '−1000M', y: -92, x: -2.6 },
  { label: '−4000M', y: -148, x: 2.2 },
]

function Marker({ label, y, x }) {
  const ref = useRef()
  useFrame((state) => {
    const m = ref.current
    if (!m) return
    const dy = state.camera.position.y - y
    const near = 1 - THREE.MathUtils.clamp(Math.abs(dy) / 26, 0, 1)
    // only during the descent scrub (gate at the very surface / very bottom)
    const gate = THREE.MathUtils.smoothstep(journey.descentT, 0.02, 0.06) *
      (1 - THREE.MathUtils.smoothstep(journey.descentT, 0.97, 1.0))
    m.material.transparent = true
    m.material.depthWrite = false
    m.material.opacity = near * gate
    const s = 1 + near * 0.8
    m.scale.setScalar(s)
    m.quaternion.copy(state.camera.quaternion)
  })
  return (
    <Text
      ref={ref}
      position={[x, y, 7]}
      font={plexUrl}
      fontSize={1.1}
      letterSpacing={0.12}
      color="#9bf3ff"
      anchorX="center"
      anchorY="middle"
      outlineWidth={0.006}
      outlineColor="#04243a"
    >
      {label}
    </Text>
  )
}

export default function DepthMarkers() {
  return (
    <group>
      {MARKERS.map((m) => (
        <Marker key={m.label} {...m} />
      ))}
    </group>
  )
}
