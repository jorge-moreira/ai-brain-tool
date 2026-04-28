import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    outDir: 'dist/main',
    lib: {
      entry: 'src/main/index.ts',
      formats: ['cjs'],
      fileName: () => 'index.js'
    },
    rollupOptions: {
      external: ['electron'],
      output: {
        format: 'cjs'
      }
    }
  }
})
