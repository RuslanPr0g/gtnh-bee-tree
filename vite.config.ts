import { defineConfig } from 'vite';
import { reactRouter } from '@react-router/dev/vite';

// base must match `basename` in react-router.config.ts (the GitHub Pages project path)
export default defineConfig({
  base: '/gtnh-bee-tree/',
  plugins: [reactRouter()],
  // the bee + quest JSON (~400 kB) is bundled on purpose; it is the app's whole dataset
  build: { chunkSizeWarningLimit: 1000 },
});
