import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  root: "src/mainview",
  resolve: {
    alias: {
      "@ai-brain/core": resolve(__dirname, "../core/src"),
      "@ai-brain/ui": resolve(__dirname, "../ui/src"),
      "@": resolve(__dirname, "../ui/src"),
      "@/lib": resolve(__dirname, "../ui/src/lib"),
      "@/components": resolve(__dirname, "../ui/src/components"),
    },
  },
  build: {
    outDir: "../../dist",
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    strictPort: true,
  },
});
