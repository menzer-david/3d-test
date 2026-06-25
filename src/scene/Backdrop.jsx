import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { journey } from '../journey/state.js'

// Generated asset wired as a FAR backdrop layer: the distant sunlit ceiling the
// KF1 camera looks up toward. It sits BEHIND the real volumetric fog + geometry
// (fog=true on the material) so the descent literally swallows it — it
// SUPPLEMENTS the procedural world, it does not replace it.
export default function Backdrop() {
  const tex = useTexture('/assets/kf1-surface-backdrop.png')
  tex.colorSpace = THREE.SRGBColorSpace
  const mat = useRef()
  useFrame(() => {
    if (mat.current) mat.current.opacity = journey.backdropOpacity
  })
  return (
    <mesh position={[0, 13, -26]} rotation={[0.32, 0, 0]} renderOrder={-10}>
      <planeGeometry args={[120, 68]} />
      <meshBasicMaterial
        ref={mat}
        map={tex}
        transparent
        opacity={0}
        depthWrite={false}
        fog
        toneMapped={false}
      />
    </mesh>
  )
}
