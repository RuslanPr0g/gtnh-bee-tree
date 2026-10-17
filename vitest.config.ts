import { defineConfig } from 'vitest/config';

// unit tests only cover pure modules, so they don't need the React Router plugin
export default defineConfig({
  test: { include: ['src/**/*.test.ts'] },
});
