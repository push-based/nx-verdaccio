/// <reference types="vitest" />
import { defineConfig } from 'vite';

import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';

export default defineConfig({
  root: __dirname,
  cacheDir: '../../../node_modules/.vite/projects/nx-verdaccio-e2e',

  plugins: [nxViteTsPaths()],

  // Uncomment this if you are using workers.
  // worker: {
  //  plugins: [ nxViteTsPaths() ],
  // },

  test: {
    hookTimeout: 20_000,
    globals: true,
    cache: { dir: '../../node_modules/.vitest' },
    environment: 'node',
    include: ['test/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    reporters: ['default'],
    coverage: {
      reportsDirectory: '../../coverage/projects/nx-verdaccio-e2e',
      provider: 'v8',
    },
    setupFiles: ['../../testing/test-setup/src/lib/extend/path-matcher.ts'],
  },
});
