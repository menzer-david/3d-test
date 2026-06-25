import React, { Suspense } from 'react'

// Dev-only leva + r3f-perf, code-split so the production bundle never executes
// them. The impl chunk is only ever imported when import.meta.env.DEV is true.
const DevPanel = import.meta.env.DEV ? React.lazy(() => import('./DevPanelImpl.jsx')) : null

// Only mounts in dev AND when ?dev is in the URL, so the default view (and the
// review screenshots) stay clean while tuning is one query param away.
const devRequested =
  typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('dev')

export default function DevTools() {
  if (!import.meta.env.DEV || !DevPanel || !devRequested) return null
  return (
    <Suspense fallback={null}>
      <DevPanel />
    </Suspense>
  )
}
