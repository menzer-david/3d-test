import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import { journey } from '../journey/state.js'
import { HERO_Y } from '../config.js'
import archivoUrl from '@fontsource/archivo/files/archivo-latin-700-normal.woff?url'
import plexUrl from '@fontsource/ibm-plex-mono/files/ibm-plex-mono-latin-400-normal.woff?url'

// All headlines/sub-lines rendered IN-SCENE (WebGL) per the brief's "scene text
// in WebGL" rule. Each billboards to the camera (always legible) and reads its
// opacity from the journey timeline. Vignette + outline give subtle backing so
// text is never lost over busy/particle frames.
function Line({ keyName, billboard = true, ...props }) {
  const ref = useRef()
  useFrame((state) => {
    const m = ref.current
    if (!m) return
    m.material.transparent = true
    m.material.depthWrite = false
    m.material.opacity = journey.text[keyName] ?? 0
    if (billboard) m.quaternion.copy(state.camera.quaternion)
  })
  return <Text ref={ref} {...props} />
}

export default function SceneText() {
  return (
    <>
      {/* KF1 SURFACE — title held over the sunlit surface */}
      <Line
        keyName="kf1"
        position={[0, 5.6, 4]}
        font={archivoUrl}
        fontSize={2.4}
        letterSpacing={0.42}
        color="#eafbff"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.01}
        outlineColor="#04243a"
      >
        AURELIA
      </Line>
      <Line
        keyName="kf1sub"
        position={[0, 3.5, 4]}
        font={plexUrl}
        fontSize={0.42}
        letterSpacing={0.18}
        color="#9fdff0"
        anchorX="center"
        anchorY="middle"
      >
        Field research from the midnight zone.
      </Line>

      {/* KF2 sub-line (appears mid-descent) */}
      <Line
        keyName="kf2sub"
        position={[0, -70, 6.5]}
        font={plexUrl}
        fontSize={0.6}
        letterSpacing={0.06}
        maxWidth={9}
        textAlign="center"
        color="#bfeaff"
        anchorX="center"
        anchorY="middle"
      >
        Below the last light, life keeps its own records.
      </Line>

      {/* KF3 IGNITE */}
      <Line
        keyName="kf3"
        position={[0, HERO_Y + 4.2, 0.5]}
        font={archivoUrl}
        fontSize={0.66}
        letterSpacing={0.04}
        maxWidth={8}
        textAlign="center"
        color="#eafbff"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.012}
        outlineColor="#04122a"
      >
        Bioluminescence isn't decoration. It's language.
      </Line>

      {/* KF4 THE BLOOM (signature) */}
      <Line
        keyName="kf4"
        position={[0, HERO_Y + 2.4, -10.5]}
        font={archivoUrl}
        fontSize={0.8}
        letterSpacing={0.06}
        maxWidth={9}
        textAlign="center"
        color="#f3ffff"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.014}
        outlineColor="#0a0420"
      >
        One pulse. A thousand signals.
      </Line>

      {/* KF5 LOGO — faint AURELIA backing (the plankton form the primary wordmark)
          + the sub-line, both in-scene. */}
      <Line
        keyName="kf5"
        position={[0, HERO_Y + 0.1, -0.4]}
        font={archivoUrl}
        fontSize={2.0}
        letterSpacing={0.42}
        color="#bfe9ff"
        anchorX="center"
        anchorY="middle"
      >
        AURELIA
      </Line>
      <Line
        keyName="kf5sub"
        position={[0, HERO_Y - 2.4, 0]}
        font={plexUrl}
        fontSize={0.46}
        letterSpacing={0.16}
        color="#9fdff0"
        anchorX="center"
        anchorY="middle"
      >
        Mapping the living dark.
      </Line>
    </>
  )
}
