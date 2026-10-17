import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// relative base so the build works on GitHub Pages under /<repo>/ without extra config
export default defineConfig({
  base: './',
  plugins: [react()],
  // the bee + quest JSON (~400 kB) is bundled on purpose; it is the app's whole dataset
  build: { chunkSizeWarningLimit: 1000 },
});
