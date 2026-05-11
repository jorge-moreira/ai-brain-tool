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
      'dist/assets': 'views/mainview/assets'
    },
    watchIgnore: ['dist/**'],
    mac: {
      bundleCEF: false,
      icons: 'assets/icons/ai-brain-tool.icon'
    },
    linux: {
      bundleCEF: false,
      icon: 'assets/icons/ai-brain-tool.png'
    },
    win: {
      bundleCEF: false,
      icon: 'assets/icons/ai-brain-tool.ico'
    }
  }
} satisfies ElectrobunConfig
