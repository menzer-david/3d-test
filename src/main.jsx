import React, { Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
// Bundled fonts (offline, latin subset) — used by the 2D overlay UI.
import '@fontsource/archivo/latin-600.css'
import '@fontsource/archivo/latin-700.css'
import '@fontsource/ibm-plex-mono/latin-400.css'
import '@fontsource/ibm-plex-mono/latin-500.css'
import './index.css'
import Loader from './ui/Loader.jsx'
import NoWebGL from './ui/NoWebGL.jsx'

// Lazy-load the whole 3D app so the heavy WebGL bundle sits behind the loader.
const App = lazy(() => import('./App.jsx'))

function hasWebGL() {
  try {
    const c = document.createElement('canvas')
    return !!(
      window.WebGLRenderingContext &&
      (c.getContext('webgl2') || c.getContext('webgl'))
    )
  } catch {
    return false
  }
}

const root = createRoot(document.getElementById('root'))
root.render(
  hasWebGL() ? (
    <Suspense fallback={<Loader bootstrap />}>
      <App />
    </Suspense>
  ) : (
    <NoWebGL />
  ),
)
