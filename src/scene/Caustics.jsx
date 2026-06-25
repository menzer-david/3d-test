import React, { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { journey } from '../journey/state.js'

// Generated caustics light-gobo wired as an ADDITIVE overhead light pattern near
// the surface. Two stacked panning layers fake rippling refracted sunlight; the
// whole thing fades out with depth (causticsOpacity) as we leave the sunlit zone.
export default function Caustics() {
  const tex = useTexture('/assets/caustics-surface.png')
  useMemo(() => {
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping
    tex.repeat.set(2.4, 2.4)
    tex.colorSpace = THREE.SRGBColorSpace
  }, [tex])

  const tex2 = useMemo(() => {
    const t = tex.clone()
    t.needsUpdate = true
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.repeat.set(1.6, 1.6)
    return t
  }, [tex])

  const m1 = useRef()
  const m2 = useRef()
  useFrame((state) => {
    const t = state.clock.elapsedTime
    tex.offset.set(t * 0.015, t * 0.008)
    tex2.offset.set(-t * 0.01, t * 0.012)
    const o = journey.causticsOpacity
    if (m1.current) m1.current.opacity = o * 0.85
    if (m2.current) m2.current.opacity = o * 0.55
  })

  return (
    <group position={[0, 11, -6]} rotation={[-Math.PI / 2.1, 0, 0]} renderOrder={-5}>
      <mesh>
        <planeGeometry args={[80, 80]} />
        <meshBasicMaterial
          ref={m1}
          map={tex}
          transparent
          opacity={0}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
          color="#9ff4ff"
        />
      </mesh>
      <mesh position={[0, 0, 0.5]}>
        <planeGeometry args={[80, 80]} />
        <meshBasicMaterial
          ref={m2}
          map={tex2}
          transparent
          opacity={0}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
          color="#7fe9ff"
        />
      </mesh>
    </group>
  )
}
