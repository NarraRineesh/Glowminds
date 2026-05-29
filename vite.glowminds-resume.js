import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'url'
import { lingui, linguiTransformerBabelPreset } from '@lingui/vite-plugin'
import babel from '@rolldown/plugin-babel'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import viteReact, { reactCompilerPreset } from '@vitejs/plugin-react'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export const GLOWMINDS_RESUME_ROOT = path.resolve(__dirname, 'packages/glowminds-resume')
export const GLOWMINDS_RESUME_SRC = path.join(GLOWMINDS_RESUME_ROOT, 'src')
export const GLOWMINDS_RESUME_PUBLIC = path.join(GLOWMINDS_RESUME_ROOT, 'public')

const PUBLIC_ASSET_PREFIXES = ['/templates/']

function copyRecursive(source, destination) {
  if (!fs.existsSync(source)) return

  fs.mkdirSync(destination, { recursive: true })

  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    const from = path.join(source, entry.name)
    const to = path.join(destination, entry.name)

    if (entry.isDirectory()) {
      copyRecursive(from, to)
      continue
    }

    fs.copyFileSync(from, to)
  }
}

function contentTypeFor(filePath) {
  switch (path.extname(filePath)) {
    case '.jpg':
      return 'image/jpeg'
    case '.jpeg':
      return 'image/jpeg'
    case '.png':
      return 'image/png'
    case '.svg':
      return 'image/svg+xml'
    case '.ico':
      return 'image/x-icon'
    case '.pdf':
      return 'application/pdf'
    default:
      return 'application/octet-stream'
  }
}

/** Serve glowminds-resume public assets from the main dev server and build output. */
export function glowmindsResumePublicAssets() {
  let outDir = path.resolve(__dirname, 'dist')

  return {
    name: 'glowminds-resume-public-assets',
    configResolved(config) {
      outDir = path.resolve(config.root, config.build.outDir)
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url?.split('?')[0] ?? ''
        const isPublicAsset = PUBLIC_ASSET_PREFIXES.some(
          (prefix) => url === prefix || url.startsWith(prefix),
        )

        if (!isPublicAsset) return next()

        const filePath = path.join(GLOWMINDS_RESUME_PUBLIC, url)
        if (!filePath.startsWith(GLOWMINDS_RESUME_PUBLIC) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
          return next()
        }

        res.statusCode = 200
        res.setHeader('Content-Type', contentTypeFor(filePath))
        fs.createReadStream(filePath).pipe(res)
      })
    },
    closeBundle() {
      copyRecursive(path.join(GLOWMINDS_RESUME_PUBLIC, 'templates'), path.join(outDir, 'templates'))

      const appPublic = path.resolve(__dirname, 'public')
      copyRecursive(path.join(appPublic, 'favicon'), path.join(outDir, 'favicon'))

      for (const fileName of ['favicon.ico', 'favicon.svg', 'favicon-96x96.png', 'og-image.png', 'logo-light.png', 'logo-dark.png', 'logo-mark.png']) {
        const source = path.join(appPublic, fileName)
        if (fs.existsSync(source)) {
          fs.copyFileSync(source, path.join(outDir, fileName))
        }
      }
    },
  }
}

/** Resolve `@/` to app src or glowminds-resume src based on the importing file. */
export function glowmindsResumeAlias() {
  const appSrc = path.resolve(__dirname, 'src')

  return {
    name: 'glowminds-resume-alias',
    enforce: 'pre',
    async resolveId(source, importer) {
      if (source === '#react-pdf-renderer') {
        return this.resolve('@react-pdf/renderer', importer, { skipSelf: true })
      }

      if (source === 'glowminds-resume/ui') {
        return path.join(GLOWMINDS_RESUME_SRC, 'lib/ui/index.ts')
      }

      const uiSubpath = source.match(/^glowminds-resume\/ui\/(.+)$/)
      if (uiSubpath) {
        const componentPath = path.join(
          GLOWMINDS_RESUME_SRC,
          'lib/ui/components',
          `${uiSubpath[1]}.tsx`,
        )
        if (fs.existsSync(componentPath)) {
          return componentPath
        }
      }

      if (!source.startsWith('@/')) return null

      const normalizedImporter = importer?.replace(/\\/g, '/') ?? ''
      const targetRoot = normalizedImporter.includes('/packages/glowminds-resume/')
        ? GLOWMINDS_RESUME_SRC
        : appSrc

      return this.resolve(path.join(targetRoot, source.slice(2)), importer, { skipSelf: true })
    },
  }
}

export function glowmindsResumePlugins() {
  return [
    tanstackRouter({
      routesDirectory: path.join(GLOWMINDS_RESUME_SRC, 'routes'),
      generatedRouteTree: path.join(GLOWMINDS_RESUME_SRC, 'routeTree.gen.ts'),
      target: 'react',
      semicolons: true,
      quoteStyle: 'double',
      autoCodeSplitting: true,
    }),
    viteReact(),
    lingui(),
    babel({ presets: [reactCompilerPreset(), linguiTransformerBabelPreset()] }),
  ]
}
