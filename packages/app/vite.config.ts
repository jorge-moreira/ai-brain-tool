import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import fs from 'fs'

const TS_EXTENSIONS = ['.tsx', '.ts']

// Resolves a subPath relative to baseDir, checking both components/ and components/ui/
// for component imports, and trying file extensions and index files.
function resolveInternalPath(baseDir: string, subPath: string) {
  const cleanPath = subPath.startsWith('/') ? subPath.slice(1) : subPath
  const pathsToTry: string[] = []

  // If it's a component, try custom components first, then shadcn 'ui' subfolder
  if (cleanPath.startsWith('components/')) {
    const componentPath = cleanPath.replace('components/', '')
    pathsToTry.push(path.join(baseDir, 'components', componentPath))
    pathsToTry.push(path.join(baseDir, 'components/ui', componentPath))
  } else {
    pathsToTry.push(path.join(baseDir, cleanPath))
  }

  for (const p of pathsToTry) {
    for (const ext of TS_EXTENSIONS) {
      if (fs.existsSync(p + ext)) return p + ext
    }
    for (const ext of TS_EXTENSIONS) {
      if (fs.existsSync(path.join(p, 'index' + ext))) return path.join(p, 'index' + ext)
    }
  }
  return null
}

const UI_ROOT = path.resolve(__dirname, '../ui/src')
const APP_ROOT = path.resolve(__dirname, './src/mainview')

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'ui-workspace-resolver',
      enforce: 'pre',
      resolveId(source, importer) {
        if (source.startsWith('@ai-brain/ui')) {
          const relativePath = source.slice('@ai-brain/ui'.length)
          // Handle the root import '@ai-brain/ui'
          if (relativePath === '') return path.join(UI_ROOT, 'index.ts')
          return resolveInternalPath(UI_ROOT, relativePath)
        }

        // Resolve @/...
        if (source.startsWith('@/')) {
          const relativePath = source.slice('@/'.length)

          // Contextual routing: If importer is in UI package, route to UI_ROOT
          if (importer?.startsWith(UI_ROOT)) {
            return resolveInternalPath(UI_ROOT, relativePath)
          }

          // Otherwise route to the app's source
          return resolveInternalPath(APP_ROOT, relativePath)
        }

        return null
      }
    }
  ],
  base: '/',
  root: path.resolve(__dirname, 'src/mainview'),
  // Force an absolute path so there is no ambiguity
  publicDir: path.resolve(__dirname, 'src/mainview/public'),
  build: {
    outDir: path.resolve(__dirname, './dist'),
    emptyOutDir: true
  },
  resolve: {
    alias: {
      '@ai-brain/core': path.resolve(__dirname, '../core/src')
    }
  },
  server: {
    port: 5173,
    strictPort: true
  }
})
