import React, { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import {
  EffectComposer,
  Bloom,
  ChromaticAberration,
  DepthOfField,
  Noise,
  Vignette,
  N8AO,
  GodRays,
} from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import * as THREE from 'three'
import { journey } from '../journey/state.js'
import { isMobile } from '../config.js'

// Post-FX is SEASONING: subtle by default, briefly bumped during the KF4 bloom.
// N8AO / DOF / GodRays are desktop-only (dropped on mobile for perf).
export default function PostFX() {
  const [sun, setSun] = useState(null)
  const bloom = useRef()
  const ca = useRef()

  useFrame(() => {
    if (bloom.current) bloom.current.intensity = journey.postBloom
    if (ca.current) ca.current.offset.set(journey.postCA, journey.postCA)
    if (sun) {
      // the surface sun fades as the descent leaves the sunlit zone
      sun.material.opacity = 1 - THREE.MathUtils.smoothstep(journey.depth, 0.08, 0.32)
    }
  })

  return (
    <>
      {/* GodRays source — the surface sun, behind the backdrop */}
      <mesh ref={setSun} position={[0, 19, -30]}>
        <sphereGeometry args={[3, 24, 24]} />
        <meshBasicMaterial color="#dffbff" transparent toneMapped={false} />
      </mesh>

      <EffectComposer multisampling={isMobile ? 0 : 4} enableNormalPass={!isMobile}>
        {!isMobile ? (
          <N8AO aoRadius={1.3} intensity={1.1} distanceFalloff={1} halfRes quality="low" />
        ) : null}
        {sun && !isMobile ? (
          <GodRays
            sun={sun}
            blendFunction={BlendFunction.SCREEN}
            samples={48}
            density={0.92}
            decay={0.92}
            weight={0.35}
            exposure={0.5}
            clampMax={1}
            blur
          />
        ) : null}
        <Bloom
          ref={bloom}
          intensity={0.55}
          luminanceThreshold={0.22}
          luminanceSmoothing={0.9}
          radius={0.62}
          mipmapBlur
        />
        <ChromaticAberration
          ref={ca}
          blendFunction={BlendFunction.NORMAL}
          offset={[0.0009, 0.0009]}
          radialModulation={false}
        />
        {!isMobile ? (
          <DepthOfField focusDistance={0.02} focalLength={0.025} bokehScale={1.8} />
        ) : null}
        <Noise premultiply blendFunction={BlendFunction.OVERLAY} opacity={0.05} />
        <Vignette eskil={false} offset={0.28} darkness={0.62} />
      </EffectComposer>
    </>
  )
}
