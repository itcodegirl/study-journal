import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

const sharedTestOptions = {
  restoreMocks: true,
  // Rich-text component tests are slower than unit tests under parallel load.
  testTimeout: 15000,
};

export default defineConfig({
  plugins: [react()],
  test: {
    projects: [
      {
        extends: true,
        test: {
          ...sharedTestOptions,
          name: 'unit',
          environment: 'node',
          include: ['src/**/*.test.ts'],
        },
      },
      {
        extends: true,
        test: {
          ...sharedTestOptions,
          name: 'dom',
          environment: 'jsdom',
          include: ['src/**/*.test.tsx'],
          setupFiles: ['./src/test/setup.ts'],
        },
      },
    ],
  },
});
