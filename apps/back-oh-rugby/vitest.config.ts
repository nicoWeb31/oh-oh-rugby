import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig(() => ({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/apps/back-oh-rugby',
  plugins: [tsconfigPaths()],
  test: {
    name: 'back-oh-rugby',
    watch: false,
    globals: true,
    environment: 'node',
    include: ['src/**/*.{test,spec}.ts'],
    reporters: ['default'],
    passWithNoTests: true,
    coverage: {
      reportsDirectory: '../../coverage/apps/back-oh-rugby',
      provider: 'v8' as const,
    },
  },
}));
