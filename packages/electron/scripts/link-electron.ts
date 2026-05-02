/**
 * Electron Forge requires `electron` to be present in the local node_modules
 * of the package, not hoisted to the monorepo root. This script creates a
 * symlink from packages/electron/node_modules/electron -> root/node_modules/electron.
 *
 * This is a known limitation of Electron Forge in monorepos with hoisted linkers
 * (Bun, pnpm without shamefully-hoist, Yarn Berry).
 */

import { existsSync, mkdirSync, symlinkSync } from "fs";
import { dirname, resolve } from "path";

const src = resolve(import.meta.dir, "../../../node_modules/electron");
const dst = resolve(import.meta.dir, "../node_modules/electron");

if (!existsSync(dst)) {
  mkdirSync(dirname(dst), { recursive: true });
  symlinkSync(src, dst, "junction");
  console.log("linked electron →", src);
} else {
  console.log("electron already linked, skipping");
}
