import { listBrains, type BrainInfo } from '../config.js'

export interface ListResult {
  brains: BrainInfo[]
  hasBrains: boolean
}

export async function list(): Promise<ListResult> {
  const brains = listBrains()

  return {
    brains,
    hasBrains: brains.length > 0,
  }
}
