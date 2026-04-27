import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist/renderer',
  },
  base: './',
  resolve: {
    alias: {
      '@renderer': path.resolve(__dirname, './src/renderer'),
      '@ai-brain/ui': path.resolve(__dirname, '../ui/src'),
    },
  },
})
