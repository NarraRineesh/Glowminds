import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const siteUrl = (env.VITE_PUBLIC_SITE_URL || 'https://studentsai.in').replace(/\/$/, '')

  return {
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
