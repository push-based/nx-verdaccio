import { defineConfig } from 'vite';

import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';

export default defineConfig({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/projects/build-env',

  plugins: [nxViteTsPaths()],

  test: {
    globals: true,
    cache: { dir: '../../node_modules/.vitest' },
    environment: 'node',
    include: ['src/**/*.integration.test.{js,mjs,ts}'],
    reporters: ['default'],
    setupFiles: ['../../testing/test-setup/src/lib/extend/path-matcher.ts'],
    coverage: {
      reporter: ['lcov', 'text-summary'],
      provider: 'v8',
      reportsDirectory: './coverage/int-tests',
    },
  },
});