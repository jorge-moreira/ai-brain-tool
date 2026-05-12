import type { ElectrobunConfig } from 'electrobun'

export default {
  app: {
    name: 'AI Brain Tool',
    identifier: 'ai-brain.jorge-moreira.dev',
    version: '1.0.0'
  },
  build: {
    bun: {
      entrypoint: 'src/bun/index.ts',
      tsconfig: './tsconfig.json'
    },
    copy: {
      // Copy @ai-brain/core resources needed at runtime
      '../core/package.json': 'core/package.json',
      '../core/requirements.txt': 'core/requirements.txt',
      '../core/src/templates': 'core/src/templates',
      '../core/src/platforms/brain-skills.md': 'core/src/platforms/brain-skills.md',
      // UI for renderer (built by Vite)
      'dist/index.html': 'views/mainview/index.html',
      'dist/assets': 'views/mainview/assets',
      // Public assets (logos)
      'dist/logo.svg': 'views/mainview/logo.svg',
      'dist/graphify.svg': 'views/mainview/graphify.svg'
    },
    watchIgnore: ['dist/**'],
    mac: {
      bundleCEF: false, // Use system WebKit for smaller bundle
      icons: 'assets/icons/ai-brain-tool.icon'
    },
    linux: {
      bundleCEF: true, // Required for advanced features on Linux
      icon: 'assets/icons/ai-brain-tool.png'
    },
    win: {
      bundleCEF: false, // Use system Webview2 (Chromium-based)
      icon: 'assets/icons/ai-brain-tool.ico'
    }
  }
} satisfies ElectrobunConfig
