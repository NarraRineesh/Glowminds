import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import './index.css'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import { ThemeProvider } from '@/hooks/useTheme'
import { installChunkLoadRecovery } from '@/utils/chunkLoadRecovery'

installChunkLoadRecovery()

const rootEl = document.getElementById('root')
if (!rootEl) {
  throw new Error('Missing #root element — index.html must contain <div id="root"></div>.')
}

function dismissBootShells() {
  const shell = document.getElementById('app-shell')
  if (shell && !shell.hidden) shell.hidden = true
  const boot = document.getElementById('seo-boot')
  if (boot && !boot.hidden) boot.hidden = true
}

createRoot(rootEl).render(
  <StrictMode>
    <HelmetProvider>
      <ErrorBoundary>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </ErrorBoundary>
    </HelmetProvider>
  </StrictMode>,
)

// Hide the branded shell only after React has committed UI.
// If JS fails, #app-shell stays (intentional loading look) and #seo-boot stays in the DOM for crawlers.
requestAnimationFrame(() => {
  requestAnimationFrame(dismissBootShells)
})
