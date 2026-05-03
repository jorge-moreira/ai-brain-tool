import type { ElectrobunConfig } from "electrobun";

export default {
  app: {
    name: "AI Brain Tool",
    identifier: "ai-brain.jorge-moreira.dev",
    version: "1.0.0",
  },
  main: "src/bun/index.ts",
  build: {
    copy: {
      // Copy @ai-brain/core resources needed at runtime
      // Paths are relative to the config file location
      "../core/package.json": "core/package.json",
      "../core/requirements.txt": "core/requirements.txt",
      "../core/src/templates": "core/src/templates",
      "../core/src/platforms/brain-skills.md": "core/src/platforms/brain-skills.md",
      // UI for renderer (built by Vite)
      "dist/index.html": "views/mainview/index.html",
      "dist/assets": "views/mainview/assets",
    },
    watchIgnore: ["dist/**", "views/**"],
    mac: {
      bundleCEF: false,
    },
    linux: {
      bundleCEF: false,
    },
    win: {
      bundleCEF: false,
    },
  },
} satisfies ElectrobunConfig;
