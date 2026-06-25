import React, { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { journey } from '../journey/state.js'
import { HERO_Y, isMobile } from '../config.js'

const TENTACLES = isMobile ? 7 : 10
const BREATHE_PERIOD = 4.0 // seconds — the slow breathing rhythm, scroll-independent

// ── Translucent SSS bell ────────────────────────────────────────────────────
function Bell({ matRef }) {
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uBreathe: { value: 1 },
      uIgnite: { value: 0 },
      uPulse: { value: 1 },
      uDeep: { value: new THREE.Color('#06303a') },
      uRim: { value: new THREE.Color('#5ef2ff') },
      uGlow: { value: new THREE.Color('#79c9ff') },
    }),
    [],
  )
  matRef.current = uniforms
  return (
    <mesh>
      <sphereGeometry args={[1.8, 64, 40, 0, Math.PI * 2, 0, Math.PI * 0.6]} />
      <shaderMaterial
        transparent
        side={THREE.DoubleSide}
        depthWrite={false}
        uniforms={uniforms}
        vertexShader={/* glsl */ `
          uniform float uTime; uniform float uBreathe;
          varying vec3 vN; varying vec3 vView; varying float vY;
          void main(){
            vec3 p = position;
            float b = uBreathe;
            p.xz *= b;
            p.y *= (2.0 - b);
            float w = sin(p.x*4.0 + uTime*1.5) * cos(p.z*4.0 + uTime*1.2) * 0.022;
            p += normal * w;
            vN = normalize(normalMatrix * normal);
            vec4 mv = modelViewMatrix * vec4(p,1.0);
            vView = normalize(-mv.xyz);
            vY = position.y;
            gl_Position = projectionMatrix * mv;
          }
        `}
        fragmentShader={/* glsl */ `
          uniform vec3 uDeep; uniform vec3 uRim; uniform vec3 uGlow;
          uniform float uIgnite; uniform float uPulse;
          varying vec3 vN; varying vec3 vView; varying float vY;
          void main(){
            float fres = pow(1.0 - max(dot(vView, vN), 0.0), 2.0);
            float inner = smoothstep(-0.3, 1.8, vY);
            vec3 col = mix(uDeep, uRim, fres);
            col += uGlow * (inner*0.8 + 0.2) * uIgnite * uPulse;
            col += uRim * fres * (0.25 + 0.75*uIgnite);
            float alpha = clamp(0.20 + fres*0.6 + uIgnite*0.28, 0.0, 0.95);
            gl_FragColor = vec4(col, alpha);
          }
        `}
      />
    </mesh>
  )
}

// ── Tentacles: curl/sine drift ribbons hanging from the bell ────────────────
function Tentacles({ matsRef }) {
  const items = useMemo(() => {
    const arr = []
    for (let i = 0; i < TENTACLES; i++) {
      const a = (i / TENTACLES) * Math.PI * 2
      const r = 0.7 + (i % 2) * 0.25
      arr.push({ a, r, phase: Math.random() * 6.2831, len: 2.6 + Math.random() * 1.4 })
    }
    return arr
  }, [])
  matsRef.current = []
  return (
    <group position={[0, -0.1, 0]}>
      {items.map((it, i) => (
        <mesh key={i} position={[Math.cos(it.a) * it.r, 0, Math.sin(it.a) * it.r]}>
          <planeGeometry args={[0.11, it.len, 1, 18]} />
          <shaderMaterial
            ref={(m) => m && (matsRef.current[i] = m)}
            transparent
            side={THREE.DoubleSide}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            uniforms={{
              uTime: { value: 0 },
              uPhase: { value: it.phase },
              uLen: { value: it.len },
              uIgnite: { value: 0 },
              uA: { value: new THREE.Color('#5ef2ff') },
              uB: { value: new THREE.Color('#ff4fd8') },
            }}
            vertexShader={/* glsl */ `
              uniform float uTime; uniform float uPhase; uniform float uLen;
              varying float vT;
              void main(){
                vec3 p = position;
                float yy = (p.y / uLen) + 0.5;     // 0 top .. 1 bottom
                p.y -= uLen * 0.5;                  // hang down from the bell
                float t = 1.0 - yy;                 // tip factor
                float amp = t * t * 0.9;
                p.x += sin(uTime*1.3 + uPhase + yy*5.0) * amp;
                p.z += cos(uTime*1.1 + uPhase + yy*4.0) * amp;
                vT = yy;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(p,1.0);
              }
            `}
            fragmentShader={/* glsl */ `
              uniform float uIgnite; uniform vec3 uA; uniform vec3 uB;
              varying float vT;
              void main(){
                vec3 col = mix(uA, uB, vT);
                float a = (1.0 - vT) * (0.25 + 0.75*uIgnite) * 0.6;
                gl_FragColor = vec4(col * (0.4 + uIgnite), a);
              }
            `}
          />
        </mesh>
      ))}
    </group>
  )
}

export default function Jellyfish() {
  const group = useRef()
  const bell = useRef({})
  const tents = useRef([])
  const core = useRef()
  const halo = useRef()
  const light = useRef()

  useFrame((state) => {
    const t = state.clock.elapsedTime
    // slow 4s breathing, INDEPENDENT of scroll
    const breathe = 1 + Math.sin((t / BREATHE_PERIOD) * Math.PI * 2) * 0.045
    const ignite = journey.jellyIgnite
    const pulse = journey.jellyPulse

    if (bell.current.uTime) {
      bell.current.uTime.value = t
      bell.current.uBreathe.value = breathe
      bell.current.uIgnite.value = ignite
      bell.current.uPulse.value = pulse * (0.85 + 0.15 * (breathe - 1) * 20)
    }
    for (const m of tents.current) {
      if (!m) continue
      m.uniforms.uTime.value = t
      m.uniforms.uIgnite.value = ignite
    }
    if (core.current) {
      core.current.material.opacity = ignite * (0.6 + 0.4 * (breathe - 1) * 18)
      core.current.scale.setScalar(0.55 * pulse)
    }
    if (light.current) light.current.intensity = ignite * 9 * (0.85 + 0.3 * (breathe - 1) * 18)
    if (halo.current) {
      halo.current.material.opacity = ignite * 0.4
      halo.current.quaternion.copy(state.camera.quaternion)
    }
    if (group.current) {
      // hero-looks-at-cursor: subtle, damped, capped
      const tx = journey.pointer.y * 0.18
      const ty = journey.pointer.x * 0.22
      group.current.rotation.x += (tx - group.current.rotation.x) * 0.06
      group.current.rotation.y += (ty - group.current.rotation.y) * 0.06
      group.current.scale.setScalar(pulse)
    }
  })

  return (
    <group ref={group} position={[0, HERO_Y, 0]}>
      <Bell matRef={bell} />
      {/* inner core glow seen through the translucent bell */}
      <mesh ref={core} position={[0, 0.55, 0]}>
        <icosahedronGeometry args={[1, 3]} />
        <meshBasicMaterial
          color="#ff7bf0"
          transparent
          opacity={0}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      <Tentacles matsRef={tents} />
      {/* glow halo seats the hero in the haze (no seabed for contact shadows) */}
      <mesh ref={halo} position={[0, 0.4, 0]}>
        <planeGeometry args={[10, 10]} />
        <shaderMaterial
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          uniforms={{ uColor: { value: new THREE.Color('#3aa6ff') } }}
          vertexShader={`varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);} `}
          fragmentShader={`uniform vec3 uColor; varying vec2 vUv; void main(){ float d=length(vUv-0.5); float a=smoothstep(0.5,0.0,d); gl_FragColor=vec4(uColor, a*a*0.5);} `}
        />
      </mesh>
      <pointLight ref={light} position={[0, 0.5, 0.5]} color="#79e8ff" distance={22} intensity={0} />
    </group>
  )
}
