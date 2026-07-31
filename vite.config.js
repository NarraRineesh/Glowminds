import { defineConfig, loadEnv } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { glowmindsResumeAlias, glowmindsResumePlugins, glowmindsResumePublicAssets } from './vite.glowminds-resume.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const siteUrl = (env.VITE_PUBLIC_SITE_URL || 'https://glowminds.in').replace(/\/$/, '')

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
      tailwindcss(),
      glowmindsResumePublicAssets(),
      glowmindsResumeAlias(),
      ...glowmindsResumePlugins(),
      {
        name: 'inject-site-url-html',
        transformIndexHtml(html) {
          return html.replace(/%SITE_URL%/g, siteUrl)
        },
      },
      {
        name: 'inject-site-url-public-files',
        closeBundle() {
          const distDir = path.join(__dirname, 'dist')
          for (const file of ['robots.txt', 'sitemap.xml']) {
            const filePath = path.join(distDir, file)
            if (!fs.existsSync(filePath)) continue
            fs.writeFileSync(
              filePath,
              fs.readFileSync(filePath, 'utf8').replace(/https:\/\/glowminds\.in/g, siteUrl),
            )
          }
        },
      },
    ],
    resolve: {
      alias: {
        'glowminds-resume/embed': path.resolve(__dirname, './packages/glowminds-resume/src/embed/index.ts'),
        'glowminds-resume/embed-theme': path.resolve(__dirname, './packages/glowminds-resume/src/embed/theme.ts'),
        'glowminds-resume/ui': path.resolve(__dirname, './packages/glowminds-resume/src/lib/ui/index.ts'),
        'glowminds-resume/host.css': path.resolve(__dirname, './packages/glowminds-resume/src/embed/host.css'),
        'glowminds-resume/style.css': path.resolve(__dirname, './packages/glowminds-resume/src/index.css'),
        'glowminds-resume': path.resolve(__dirname, './packages/glowminds-resume'),
      },
      dedupe: ['react', 'react-dom'],
      tsconfigPaths: false,
    },
    optimizeDeps: {
      exclude: ['glowminds-resume/embed'],
    },
    define: {
      __APP_VERSION__: JSON.stringify('1.0.0'),
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return undefined
            // Keep firebase / framer split, but do NOT force all Phosphor icons into one
            // shared chunk — that pulled resume-builder icons onto the marketing homepage.
            if (id.includes('firebase')) return 'firebase'
            if (id.includes('framer-motion')) return 'framer-motion'
            return undefined
          },
        },
      },
    },
  }
})
