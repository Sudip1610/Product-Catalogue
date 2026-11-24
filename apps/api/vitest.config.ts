import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    // Vitest runs under Vite which resolves `.js` imports to `.ts` sources
    // This is correct for ESM-first TypeScript projects
    extensionAlias: {
      '.js': ['.ts', '.js'],
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts', 'test/**/*.test.ts'],
    coverage: {
      reporter: ['text', 'lcov'],
    },
  },
});
