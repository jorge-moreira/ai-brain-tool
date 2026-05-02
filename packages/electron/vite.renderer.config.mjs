import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: [
      // More specific aliases first
      { find: '@/lib', replacement: resolve(__dirname, '../ui/src/lib') },
      { find: '@', replacement: resolve(__dirname, 'src') },
      { find: '@ai-brain/ui', replacement: resolve(__dirname, '../ui/src') },
      { find: '@ai-brain/core', replacement: resolve(__dirname, '../core/src') },
    ],
  },
});
