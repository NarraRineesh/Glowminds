import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const siteUrl = (env.VITE_PUBLIC_SITE_URL || 'https://studentsai.in').replace(/\/$/, '')

  const firebaseProjectId = env.VITE_FIREBASE_PROJECT_ID || 'glowminds-abc84'

  return {
    server: {
      proxy: {
        '/api': {
          target: 'http://127.0.0.1:5001',
          changeOrigin: true,
          rewrite: (path) =>
            `/${firebaseProjectId}/asia-south1/api${path}`,
        },
      },
    },
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'inject-site-url-html',
        transformIndexHtml(html) {
          return html.replace(/%SITE_URL%/g, siteUrl)
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  }
})
