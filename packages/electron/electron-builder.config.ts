import type { Configuration } from 'electron-builder'

const config: Configuration = {
  appId: 'dev.jorge-moreira.ai-brain',
  productName: 'AI Brain',
  directories: {
    output: 'dist-electron'
  },
  files: ['dist/main/**/*', 'dist/renderer/**/*'],
  mac: {
    category: 'public.app-category.developer-tools',
    target: ['dmg', 'zip'],
    identity: process.env.APPLE_TEAM_ID,
    notarize: {
      teamId: process.env.APPLE_TEAM_ID || ''
    }
  },
  win: {
    target: ['nsis', 'portable']
  },
  linux: {
    target: ['AppImage', 'deb'],
    category: 'Development'
  },
  publish: {
    provider: 'github',
    owner: 'jorge-moreira',
    repo: 'ai-brain',
    releaseType: 'release'
  }
}

export default config
