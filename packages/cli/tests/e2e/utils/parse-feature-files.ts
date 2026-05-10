import { readdirSync, readFileSync } from 'fs'
import { join } from 'path'

export interface FeatureStep {
  featureName: string
  scenarioName: string
  stepName: string
}

export function parseFeatureFiles(featuresDir: string): FeatureStep[] {
  const steps: FeatureStep[] = []

  const findFeatureFiles = (dir: string): string[] => {
    const entries = readdirSync(dir, { withFileTypes: true })
    const files: string[] = []

    for (const entry of entries) {
      const fullPath = join(dir, entry.name)
      if (entry.isDirectory() && !entry.name.startsWith('.')) {
        files.push(...findFeatureFiles(fullPath))
      } else if (entry.isFile() && entry.name.endsWith('.feature')) {
        files.push(fullPath)
      }
    }

    return files
  }

  const featureFiles = findFeatureFiles(featuresDir)

  for (const file of featureFiles) {
    const content = readFileSync(file, 'utf8')
    const lines = content.split('\n')

    let currentFeature: string | null = null
    let currentScenario: string | null = null

    for (const line of lines) {
      const featureMatch = line.match(/^Feature:\s*(.+)$/)
      if (featureMatch) {
        currentFeature = featureMatch[1].trim()
        currentScenario = null
        continue
      }

      const scenarioMatch = line.match(/^\s*Scenario:\s*(.+)$/)
      if (scenarioMatch && currentFeature) {
        currentScenario = scenarioMatch[1].trim()
        continue
      }

      const stepMatch = line.match(/^\s*(Given|When|Then|And|But)\s+(.+)$/)
      if (stepMatch && currentFeature && currentScenario) {
        steps.push({
          featureName: currentFeature,
          scenarioName: currentScenario,
          stepName: `${stepMatch[1]} ${stepMatch[2].trim()}`
        })
      }
    }
  }

  return steps
}
