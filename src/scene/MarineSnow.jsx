import React, { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { journey } from '../journey/state.js'
import { COUNTS } from '../config.js'

// Persistent ambient marine-snow field (the NON-NEGOTIABLE particle layer). A
// GPU points cloud with shader drift that recenters on the camera every frame,
// so snow falls at every depth. Subtle by design — it keeps quiet frames alive
// without grabbing the eye (stays under the simultaneity budget).
const FIELD = 32

export default function MarineSnow() {
  const { camera } = useThree()
  const group = useRef()
  const mat = useRef()
  const count = COUNTS.marineSnow

  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry()
    const pos = new Float32Array(count * 3)
    const seed = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      pos[i * 3 + 0] = (Math.random() * 2 - 1) * FIELD
      pos[i * 3 + 1] = (Math.random() * 2 - 1) * FIELD
      pos[i * 3 + 2] = (Math.random() * 2 - 1) * FIELD
      seed[i] = Math.random()
    }
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1))
    return g
  }, [count])

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uSize: { value: 26 },
      uOpacity: { value: 0.5 },
      uField: { value: FIELD },
      uSpeed: { value: 0.8 },
    }),
    [],
  )

  useFrame((state) => {
    uniforms.uTime.value = state.clock.elapsedTime
    // a touch faster + brighter cue during the descent scrub
    uniforms.uSpeed.value = journey.phase === 'descent' ? 1.7 : 0.8
    uniforms.uOpacity.value = 0.5
    if (group.current) group.current.position.set(0, camera.position.y, camera.position.z * 0.0)
  })

  return (
    <points ref={group} geometry={geo} frustumCulled={false}>
      <shaderMaterial
        ref={mat}
        transparent
        depthWrite={false}
        uniforms={uniforms}
        vertexShader={/* glsl */ `
          uniform float uTime; uniform float uSize; uniform float uField; uniform float uSpeed;
          attribute float aSeed;
          varying float vA;
          void main(){
            vec3 p = position;
            float span = uField * 2.0;
            // slow downward drift, looped within the field
            p.y = mod(p.y - uTime * uSpeed * (0.4 + aSeed * 0.6), span) - uField;
            p.x += sin(uTime * 0.25 + aSeed * 6.2831) * 0.5;
            p.z += cos(uTime * 0.2 + aSeed * 6.2831) * 0.5;
            vec4 mv = modelViewMatrix * vec4(p, 1.0);
            gl_Position = projectionMatrix * mv;
            gl_PointSize = uSize * (0.5 + aSeed) / max(-mv.z, 0.1);
            vA = 0.35 + aSeed * 0.65;
          }
        `}
        fragmentShader={/* glsl */ `
          uniform float uOpacity;
          varying float vA;
          void main(){
            vec2 c = gl_PointCoord - 0.5;
            float d = length(c);
            float a = smoothstep(0.5, 0.05, d);
            gl_FragColor = vec4(vec3(0.78, 0.92, 1.0), a * vA * uOpacity);
          }
        `}
      />
    </points>
  )
}
