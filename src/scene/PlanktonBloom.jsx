import React, { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { GPUComputationRenderer } from '../gpgpu/GPUComputationRenderer.js'
import { noiseGLSL } from '../shaders/noise.glsl.js'
import { journey } from '../journey/state.js'
import { COUNTS, HERO_Y } from '../config.js'

const SIZE = COUNTS.gpgpuSize // SIZE*SIZE particles

// Sample target positions that spell AURELIA by rasterizing the word to a canvas
// and scattering particles across its opaque pixels (canvas-pixel sampling — the
// approved, offline-robust stand-in for MeshSurfaceSampler over TextGeometry).
function wordmarkTargets(count, width = 12, height = 3.0) {
  const cw = 1024
  const ch = 256
  const cv = document.createElement('canvas')
  cv.width = cw
  cv.height = ch
  const ctx = cv.getContext('2d')
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, cw, ch)
  ctx.fillStyle = '#fff'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = '800 170px Archivo, Arial, sans-serif'
  ctx.letterSpacing = '24px'
  ctx.fillText('AURELIA', cw / 2, ch / 2 + 8)
  const data = ctx.getImageData(0, 0, cw, ch).data
  const pts = []
  for (let y = 0; y < ch; y += 2) {
    for (let x = 0; x < cw; x += 2) {
      if (data[(y * cw + x) * 4] > 128) pts.push([x, y])
    }
  }
  const out = new Float32Array(count * 4)
  for (let i = 0; i < count; i++) {
    const [px, py] = pts.length ? pts[(Math.random() * pts.length) | 0] : [cw / 2, ch / 2]
    out[i * 4 + 0] = (px / cw - 0.5) * width
    out[i * 4 + 1] = -(py / ch - 0.5) * height
    out[i * 4 + 2] = (Math.random() - 0.5) * 0.5
    out[i * 4 + 3] = 1
  }
  return out
}

export default function PlanktonBloom() {
  const { gl } = useThree()
  const pointsRef = useRef()
  const matRef = useRef()

  const { gpu, posVar, velVar, geometry, uniforms } = useMemo(() => {
    const gpu = new GPUComputationRenderer(SIZE, SIZE, gl)
    const dtPos = gpu.createTexture()
    const dtVel = gpu.createTexture()
    const dtHome = gpu.createTexture()
    const dtTarget = gpu.createTexture()

    // home: scattered sphere around the jelly core
    const tgt = wordmarkTargets(SIZE * SIZE)
    const pa = dtPos.image.data
    const va = dtVel.image.data
    const ha = dtHome.image.data
    const ta = dtTarget.image.data
    for (let i = 0; i < SIZE * SIZE; i++) {
      const r = 0.4 + Math.random() * 1.9
      const th = Math.random() * Math.PI * 2
      const ph = Math.acos(Math.random() * 2 - 1)
      const x = r * Math.sin(ph) * Math.cos(th)
      const y = r * Math.sin(ph) * Math.sin(th)
      const z = r * Math.cos(ph)
      pa[i * 4] = ha[i * 4] = x
      pa[i * 4 + 1] = ha[i * 4 + 1] = y
      pa[i * 4 + 2] = ha[i * 4 + 2] = z
      pa[i * 4 + 3] = ha[i * 4 + 3] = 1
      va[i * 4] = va[i * 4 + 1] = va[i * 4 + 2] = 0
      va[i * 4 + 3] = 1
      ta[i * 4] = tgt[i * 4]
      ta[i * 4 + 1] = tgt[i * 4 + 1]
      ta[i * 4 + 2] = tgt[i * 4 + 2]
      ta[i * 4 + 3] = 1
    }
    // these two feed the velocity shader as plain sampler uniforms — make sure
    // the freshly-written data is uploaded and sampled exactly (nearest).
    for (const t of [dtHome, dtTarget]) {
      t.minFilter = THREE.NearestFilter
      t.magFilter = THREE.NearestFilter
      t.needsUpdate = true
    }

    const velFrag = /* glsl */ `
      uniform float uTime; uniform float dt; uniform float uBloom; uniform float uMorph;
      uniform sampler2D tHome; uniform sampler2D tTarget;
      ${noiseGLSL}
      void main(){
        vec2 uv = gl_FragCoord.xy / resolution.xy;
        vec3 pos = texture2D(texturePosition, uv).xyz;
        vec3 vel = texture2D(textureVelocity, uv).xyz;
        vec3 home = texture2D(tHome, uv).xyz;
        vec3 target = texture2D(tTarget, uv).xyz;

        // ambient: spring home + curl drift
        vec3 force = (home - pos) * 0.7;
        force += curlNoise(pos * 0.22 + uTime * 0.06) * 0.7;

        // KF4 bloom: radial shockwave outward from the core
        vec3 radial = normalize(pos + 1e-4);
        force += radial * uBloom * 7.0;

        // KF5 morph: strong pull toward the wordmark target
        vec3 toT = target - pos;
        force = mix(force, toT * 5.0, uMorph);

        vel += force * dt;
        vel *= mix(0.90, 0.84, uMorph);
        gl_FragColor = vec4(vel, 1.0);
      }
    `
    const posFrag = /* glsl */ `
      uniform float dt;
      void main(){
        vec2 uv = gl_FragCoord.xy / resolution.xy;
        vec3 pos = texture2D(texturePosition, uv).xyz;
        vec3 vel = texture2D(textureVelocity, uv).xyz;
        pos += vel * dt;
        gl_FragColor = vec4(pos, 1.0);
      }
    `

    const posVar = gpu.addVariable('texturePosition', posFrag, dtPos)
    const velVar = gpu.addVariable('textureVelocity', velFrag, dtVel)
    gpu.setVariableDependencies(posVar, [posVar, velVar])
    gpu.setVariableDependencies(velVar, [posVar, velVar])
    posVar.material.uniforms.dt = { value: 0.016 }
    velVar.material.uniforms.uTime = { value: 0 }
    velVar.material.uniforms.dt = { value: 0.016 }
    velVar.material.uniforms.uBloom = { value: 0 }
    velVar.material.uniforms.uMorph = { value: 0 }
    velVar.material.uniforms.tHome = { value: dtHome }
    velVar.material.uniforms.tTarget = { value: dtTarget }
    const err = gpu.init()
    if (err) console.error('GPGPU init:', err)

    // render geometry: one point per sim texel
    const geometry = new THREE.BufferGeometry()
    const refs = new Float32Array(SIZE * SIZE * 2)
    const rnd = new Float32Array(SIZE * SIZE)
    const positions = new Float32Array(SIZE * SIZE * 3)
    for (let i = 0; i < SIZE * SIZE; i++) {
      refs[i * 2] = (i % SIZE) / SIZE
      refs[i * 2 + 1] = Math.floor(i / SIZE) / SIZE
      rnd[i] = Math.random()
    }
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('ref', new THREE.BufferAttribute(refs, 2))
    geometry.setAttribute('aRnd', new THREE.BufferAttribute(rnd, 1))

    const uniforms = {
      uPositions: { value: null },
      uSize: { value: 15 },
      uOpacity: { value: 0 },
      uCyan: { value: new THREE.Color('#7af7ff') },
      uMag: { value: new THREE.Color('#ff5fe0') },
    }
    return { gpu, posVar, velVar, geometry, uniforms }
  }, [gl])

  matRef.current = uniforms

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.033)
    velVar.material.uniforms.uTime.value = state.clock.elapsedTime
    velVar.material.uniforms.dt.value = dt
    posVar.material.uniforms.dt.value = dt
    velVar.material.uniforms.uBloom.value = journey.bloom
    velVar.material.uniforms.uMorph.value = journey.morph
    gpu.compute()
    uniforms.uPositions.value = gpu.getCurrentRenderTarget(posVar).texture
    uniforms.uOpacity.value = Math.max(
      THREE.MathUtils.smoothstep(journey.bloom, 0.0, 0.25),
      journey.morph,
    )
    uniforms.uSize.value = THREE.MathUtils.lerp(15, 9, journey.morph)
  })

  return (
    <points ref={pointsRef} geometry={geometry} position={[0, HERO_Y, 0]} frustumCulled={false}>
      <shaderMaterial
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        uniforms={uniforms}
        vertexShader={/* glsl */ `
          uniform sampler2D uPositions; uniform float uSize;
          attribute vec2 ref; attribute float aRnd;
          varying float vR;
          void main(){
            vec3 p = texture2D(uPositions, ref).xyz;
            vec4 mv = modelViewMatrix * vec4(p, 1.0);
            gl_Position = projectionMatrix * mv;
            gl_PointSize = (uSize * (0.5 + aRnd)) / max(-mv.z, 0.1);
            vR = aRnd;
          }
        `}
        fragmentShader={/* glsl */ `
          uniform vec3 uCyan; uniform vec3 uMag; uniform float uOpacity;
          varying float vR;
          void main(){
            vec2 c = gl_PointCoord - 0.5;
            float d = length(c);
            float a = smoothstep(0.5, 0.0, d);
            vec3 col = mix(uCyan, uMag, vR);
            gl_FragColor = vec4(col, a * uOpacity * (0.5 + vR * 0.5));
          }
        `}
      />
    </points>
  )
}
