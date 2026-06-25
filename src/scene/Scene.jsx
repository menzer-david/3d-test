import React, { useMemo, useRef, Suspense } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Environment, Lightformer } from '@react-three/drei'
import * as THREE from 'three'
import { journey } from '../journey/state.js'
import { fogColorAt, fogDensityAt, HERO_Y, isMobile } from '../config.js'
import Backdrop from './Backdrop.jsx'
import Caustics from './Caustics.jsx'
import MarineSnow from './MarineSnow.jsx'
import Jellyfish from './Jellyfish.jsx'
import PlanktonBloom from './PlanktonBloom.jsx'
import DepthMarkers from './DepthMarkers.jsx'
import SceneText from './SceneText.jsx'
import PostFX from './PostFX.jsx'
import DevTools from './DevTools.jsx'

// Drives scene.fog + scene.background from the global depth each frame, so the
// whole background (including empty pixels) is the rendered ocean color — never
// a CSS fill. This is what makes color come from LIGHT + FOG.
function FogDriver() {
  const { scene } = useThree()
  const fog = useMemo(() => new THREE.FogExp2('#3fb9d9', 0.014), [])
  const bg = useMemo(() => new THREE.Color('#3fb9d9'), [])
  React.useEffect(() => {
    scene.fog = fog
    scene.background = bg
    return () => {
      scene.fog = null
      scene.background = null
    }
  }, [scene, fog, bg])
  useFrame(() => {
    fogColorAt(journey.depth, fog.color)
    fog.density = fogDensityAt(journey.depth)
    bg.copy(fog.color).multiplyScalar(0.82) // background a touch darker than the haze
  })
  return null
}

// Camera rig: copies the journey's camera target each frame and adds the SUBTLE
// idle layer (breathing + damped cursor parallax). Lead motion lives in the
// GSAP/scrub targets; this only adds quiet life.
function CameraRig() {
  const { camera } = useThree()
  const look = useRef(new THREE.Vector3())
  const px = useRef(0)
  const py = useRef(0)
  useFrame((state) => {
    const t = state.clock.elapsedTime
    const c = journey.cam
    // damp the pointer for parallax; stronger near the surface, quiet in the deep
    const par = journey.phase === 'kf1' ? 0.5 : 0.18
    px.current += (journey.pointer.x * par - px.current) * 0.05
    py.current += (journey.pointer.y * par - py.current) * 0.05
    const breatheY = Math.sin(t * 0.6) * (journey.phase === 'descent' ? 0.0 : 0.12)
    camera.position.set(c.x + px.current, c.y + breatheY, c.z)
    look.current.set(c.lx + px.current * 0.4, c.ly + py.current * 0.4, c.lz)
    camera.lookAt(look.current)
  })
  return null
}

export default function Scene({ started }) {
  return (
    <>
      <FogDriver />
      <CameraRig />

      {/* Procedural IBL via inline Lightformers — offline, no CDN preset.
          Gives the jelly + particles real image-based lighting + reflections. */}
      <Environment resolution={isMobile ? 128 : 256} frames={1}>
        <color attach="background" args={['#04101c']} />
        <Lightformer intensity={1.6} color="#bff4ff" position={[0, 12, -6]} scale={[18, 14, 1]} />
        <Lightformer intensity={0.5} color="#1a8a9c" position={[-8, 0, 4]} scale={[10, 12, 1]} />
        <Lightformer intensity={0.6} color="#5ef2ff" position={[8, -4, 2]} scale={[8, 10, 1]} />
        <Lightformer intensity={0.4} color="#ff4fd8" position={[0, -10, -4]} scale={[12, 8, 1]} />
      </Environment>

      {/* Matched key + bio rim lights (the hero is grounded by these + fog tint). */}
      <ambientLight intensity={0.18} />
      <directionalLight position={[0, 30, 6]} intensity={0.7} color="#bfefff" />
      <pointLight position={[3, HERO_Y + 4, 4]} intensity={6} distance={40} color="#5ef2ff" />
      <pointLight position={[-4, HERO_Y - 2, -3]} intensity={4} distance={36} color="#ff4fd8" />

      <MarineSnow />

      {/* asset/font consumers (useTexture + drei Text) suspend while loading */}
      <Suspense fallback={null}>
        <Backdrop />
        <Caustics />
        <Jellyfish />
        <PlanktonBloom />
        <DepthMarkers />
        <SceneText />
      </Suspense>

      <PostFX />
      <DevTools />
    </>
  )
}
