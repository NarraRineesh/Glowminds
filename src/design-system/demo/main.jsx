import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'glowminds-resume/ui'
import '@/index.css'
import { ThemeProvider } from '@/hooks/useTheme'
import Demo from './Demo'

const root = document.getElementById('root')
if (!root) throw new Error('Missing #root')

createRoot(root).render(
  <StrictMode>
    <ThemeProvider>
      <Demo />
      <Toaster position="bottom-right" closeButton />
    </ThemeProvider>
  </StrictMode>,
)
