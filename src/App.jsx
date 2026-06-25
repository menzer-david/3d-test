import React, { useCallback, useEffect, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import * as THREE from 'three'
import Scene from './scene/Scene.jsx'
import Overlay from './ui/Overlay.jsx'
import Loader from './ui/Loader.jsx'
import JourneyController from './journey/JourneyController.jsx'
import { journey } from './journey/state.js'
import { isMobile } from './config.js'

export default function App() {
  const [ready, setReady] = useState(false) // loader resolved -> start journey
  const [glReady, setGlReady] = useState(false) // first frame rendered

  const onReady = useCallback(() => setReady(true), [])

  // Track the pointer in normalized device coords for cursor reactivity.
  useEffect(() => {
    const onMove = (e) => {
      journey.pointer.x = (e.clientX / window.innerWidth) * 2 - 1
      journey.pointer.y = -((e.clientY / window.innerHeight) * 2 - 1)
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [])

  return (
    <div className="fixed inset-0">
      {/* THE 3D SCENE IS THE BACKGROUND: fixed, full-viewport, z-0. */}
      <Canvas
        className="!fixed inset-0"
        style={{ zIndex: 0 }}
        dpr={isMobile ? [1, 1.5] : [1, 2]}
        gl={{
          antialias: !isMobile,
          powerPreference: 'high-performance',
          alpha: false,
          stencil: false,
        }}
        camera={{ position: [0, 2, 14], fov: 50, near: 0.1, far: 600 }}
        onCreated={({ gl, scene }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping
          gl.toneMappingExposure = 1.05
          scene.background = null // background is fog + geometry, never a flat color fill
          setGlReady(true)
        }}
      >
        <Scene started={ready} />
      </Canvas>

      {/* 2D UI overlaid on the canvas (nav, mute, scroll hint, footer). */}
      <Overlay />

      {/* Input + scroll choreography (no DOM of its own beyond the descent spacer). */}
      <JourneyController started={ready} />

      {/* Loader tied to REAL readiness; brief, then dissolves into KF1. */}
      <Loader glReady={glReady} onReady={onReady} />
    </div>
  )
}
