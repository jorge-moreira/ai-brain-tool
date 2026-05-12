export type {
  BrainConfig,
  Config,
  ResolvedBrain,
  BrainInfo,
  GetBrainPathOptions
} from '@ai-brain/core/config/types'

export {
  configPath,
  createInitialConfig,
  ensureConfigDir,
  readConfig,
  writeConfig,
  updateConfig,
  isInstallationComplete,
  setInstallationComplete,
  addGraphifyyExtra
} from '@ai-brain/core/config/state'

export {
  resolveBrain,
  listBrains,
  addBrain,
  importBrain,
  isExistingBrain,
  isBrainIdAvailable,
  removeBrain,
  readBrainConfig,
  getBrainPath,
  toggleSync,
  toggleSyncById
} from '@ai-brain/core/config/brains'
