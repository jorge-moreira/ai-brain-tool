import { beforeEach } from 'vitest'
import { mkdtempSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'

let tmpHome

beforeEach(() => {
  tmpHome = mkdtempSync(join(tmpdir(), 'ai-brain-test-'))
  process.env.__HOME__ = tmpHome
})

export { tmpHome }