import { defineConfig } from 'vite';

import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';

export default defineConfig({
  root: __dirname,
  cacheDir: '../../../node_modules/.vite/projects/utils',

  plugins: [nxViteTsPaths()],

  // Uncomment this if you are using workers.
  // worker: {
  //  plugins: [ nxViteTsPaths() ],
  // },
  coverage: {
    reporter: ['text', 'lcov'],
    reportsDirectory: '../../coverage/utils/unit-tests',
    exclude: ['mocks/**', '**/types.ts'],
  },

  test: {
    globals: true,
    cache: { dir: '../../../node_modules/.vitest' },
    environment: 'node',
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    reporters: ['default'],
    coverage: {
      reportsDirectory: '../../../coverage/projects/utils',
      provider: 'v8',
    },
  },
});
