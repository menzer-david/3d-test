import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GLSL files are imported as raw strings via ?raw (built into Vite).
export default defineConfig({
  plugins: [react()],
  server: { host: true, port: 5173 },
  preview: { host: true, port: 4173 },
  // Pre-bundle the heavy 3D ecosystem up front so the dev server doesn't stall
  // mid-flight discovering them (which holds requests).
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-dom/client',
      'three',
      '@react-three/fiber',
      '@react-three/drei',
      '@react-three/postprocessing',
      'postprocessing',
      'gsap',
      'lenis',
      'maath',
      // discovered at runtime via drei <Text> — force into the FIRST optimize
      // pass so Vite never re-optimizes mid-session (which wedges).
      'troika-three-text',
    ],
  },
  // Keep the heavy 3D libs in their own chunk so the lazy-loaded scene
  // sits behind the loader.
  build: {
    chunkSizeWarningLimit: 1600,
  },
})
