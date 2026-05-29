import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import './index.css'
import 'glowminds-resume/style.css'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import { ThemeProvider } from '@/hooks/useTheme'

const rootEl = document.getElementById('root')
if (!rootEl) {
  throw new Error('Missing #root element — index.html must contain <div id="root"></div>.')
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
